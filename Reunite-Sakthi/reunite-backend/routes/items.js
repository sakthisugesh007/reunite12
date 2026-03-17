const express = require('express');
const Item = require('../models/Item');
const { auth, optionalAuth } = require('../middleware/auth');
const { validateItem } = require('../middleware/validation');
const { emitItemUpdate } = require('../socket');

const router = express.Router();

// Get all items with filters and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      type,
      category,
      status = 'active',
      tags,
      search,
      lat,
      lng,
      radius = 50,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      ownerScope
    } = req.query;

    // Build query
    const query = { status };

    if (type) query.type = type;
    if (category) query.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (ownerScope === 'mine') {
      if (!req.user) {
        return res.status(401).json({ error: 'Login required to view your items' });
      }

      query.postedBy = req.user.id;
    }

    if (ownerScope === 'others') {
      if (!req.user) {
        return res.status(401).json({ error: 'Login required to view other users items' });
      }

      query.postedBy = { $ne: req.user.id };
    }

    // Location-based search
    if (lat && lng) {
      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert to meters
        }
      };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .populate('postedBy', 'name email avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(query);

    res.json({
      items,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's items
router.get('/user/my-items', auth, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;

    const query = { postedBy: req.user.id };
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .populate('postedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Item.countDocuments(query);

    res.json({
      items,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('postedBy', 'name email avatar phone')
      .populate('claimedBy', 'name email avatar');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Increment view count
    await Item.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({ item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new item
router.post('/', auth, validateItem, async (req, res) => {
  try {
    const { dateLost, dateFound, ...body } = req.body;
    const itemData = {
      ...body,
      additionalInfo: {
        ...(body.additionalInfo || {}),
        ...(dateLost ? { dateLost } : {}),
        ...(dateFound ? { dateFound } : {})
      },
      postedBy: req.user.id
    };

    // For lost items, reward is mandatory
    if (req.body.type === 'lost' && (!req.body.reward || req.body.reward < 10)) {
      return res.status(400).json({ error: 'Reward of at least $10 is required for lost items' });
    }

    const item = new Item(itemData);
    await item.save();

    // Update user stats
    await req.user.updateOne({ $inc: { 'stats.itemsPosted': 1 } });

    // Populate postedBy field
    await item.populate('postedBy', 'name email avatar');

    await emitItemUpdate(item._id, 'created');

    res.status(201).json({
      message: 'Item posted successfully',
      item
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item
router.put('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership
    if (item.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }

    // Don't allow status updates through this endpoint
    const { status, ...updateData } = req.body;

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('postedBy', 'name email avatar');

    await emitItemUpdate(updatedItem._id, 'updated');

    res.json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership
    if (item.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    // Only allow deletion if item is not claimed
    if (item.status !== 'active') {
      return res.status(400).json({ error: 'Cannot delete item that has been claimed' });
    }

    await Item.findByIdAndDelete(req.params.id);
    await emitItemUpdate(item._id, 'deleted');

    // Update user stats
    await req.user.updateOne({ $inc: { 'stats.itemsPosted': -1 } });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Claim item (for found items)
router.post('/:id/claim', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Can only claim found items
    if (item.type !== 'found') {
      return res.status(400).json({ error: 'Can only claim found items' });
    }

    // Can't claim own item
    if (item.postedBy.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot claim your own item' });
    }

    // Check if item is already claimed
    if (item.status !== 'active') {
      return res.status(400).json({ error: 'Item is already claimed' });
    }

    // Update item
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'claimed',
        claimedBy: req.user.id,
        claimedAt: new Date()
      },
      { new: true }
    ).populate('postedBy', 'name email avatar')
      .populate('claimedBy', 'name email avatar');

    await emitItemUpdate(updatedItem._id, 'claimed');

    res.json({
      message: 'Item claimed successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Claim item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark lost item as found by owner
router.post('/:id/self-found', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.type !== 'lost') {
      return res.status(400).json({ error: 'Only lost items can be marked as self-found' });
    }

    if (item.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }

    if (['completed', 'cancelled'].includes(item.status)) {
      return res.status(400).json({ error: 'This item is already closed' });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    ).populate('postedBy', 'name email avatar')
      .populate('claimedBy', 'name email avatar');

    await emitItemUpdate(updatedItem._id, 'self-found');

    res.json({
      message: 'Lost item marked as found by you',
      item: updatedItem
    });
  } catch (error) {
    console.error('Self-found item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
