const express = require('express');
const User = require('../models/User');
const Item = require('../models/Item');
const Conversation = require('../models/Conversation');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalItems,
      activeItems,
      completedReunions,
      totalConversations
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Item.countDocuments({ status: 'active' }),
      Item.countDocuments({ status: 'completed' }),
      Conversation.countDocuments({ isArchived: false })
    ]);

    const completedTransactions = await Conversation.find({
      status: 'completed',
      'paymentDetails.status': 'completed'
    })
      .populate('itemId', 'title type reward status')
      .populate('participants.user', 'name email')
      .sort({ 'paymentDetails.paidAt': -1, updatedAt: -1 });

    const totalRewards = completedTransactions.reduce((sum, conversation) => sum + (conversation.reward || 0), 0);
    const totalCommission = completedTransactions.reduce((sum, conversation) => sum + (conversation.commission || 0), 0);
    const totalFinderPayouts = completedTransactions.reduce(
      (sum, conversation) => sum + ((conversation.reward || 0) - (conversation.commission || 0)),
      0
    );

    // Get recent items and conversations
    const recentItems = await Item.find()
      .populate('postedBy', 'name email')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentConversations = await Conversation.find({ isArchived: false })
      .populate('itemId', 'title')
      .populate('participants.user', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10);

    const recentTransactions = completedTransactions.slice(0, 10).map((conversation) => {
      const owner = conversation.participants.find((participant) => participant.role === 'owner');
      const finder = conversation.participants.find((participant) => participant.role === 'finder');

      return {
        id: conversation._id,
        itemId: conversation.itemId?._id || null,
        itemTitle: conversation.itemId?.title || conversation.itemTitle,
        reward: conversation.reward || 0,
        commission: conversation.commission || 0,
        finderPayout: (conversation.reward || 0) - (conversation.commission || 0),
        owner: owner?.user
          ? {
              id: owner.user._id,
              name: owner.user.name,
              email: owner.user.email
            }
          : null,
        finder: finder?.user
          ? {
              id: finder.user._id,
              name: finder.user.name,
              email: finder.user.email
            }
          : null,
        paymentMethod: conversation.paymentDetails?.paymentMethod || 'manual',
        transactionId: conversation.paymentDetails?.transactionId || null,
        paidAt: conversation.paymentDetails?.paidAt || conversation.updatedAt,
        status: conversation.paymentDetails?.status || conversation.status
      };
    });

    res.json({
      stats: {
        totalUsers,
        totalItems,
        activeItems,
        completedReunions,
        totalConversations,
        totalTransactions: completedTransactions.length,
        totalRewards,
        totalCommission,
        totalFinderPayouts
      },
      recentItems,
      recentConversations,
      recentUsers,
      recentTransactions
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (with pagination)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all items (with pagination)
router.get('/items', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, category, search } = req.query;

    // Build query
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await Item.find(query)
      .populate('postedBy', 'name email')
      .populate('claimedBy', 'name email')
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
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all conversations (with pagination)
router.get('/conversations', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    // Build query
    const query = { isArchived: false };
    if (status) query.status = status;
    if (search) {
      query.itemTitle = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await Conversation.find(query)
      .populate('itemId', 'title type reward')
      .populate('participants.user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments(query);

    res.json({
      conversations,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get completed transactions with payment details
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      status: 'completed',
      'paymentDetails.status': 'completed'
    };

    const conversations = await Conversation.find(query)
      .populate('itemId', 'title type reward status')
      .populate('participants.user', 'name email')
      .sort({ 'paymentDetails.paidAt': -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments(query);

    const transactions = conversations.map((conversation) => {
      const owner = conversation.participants.find((participant) => participant.role === 'owner');
      const finder = conversation.participants.find((participant) => participant.role === 'finder');

      return {
        id: conversation._id,
        itemId: conversation.itemId?._id || null,
        itemTitle: conversation.itemId?.title || conversation.itemTitle,
        itemType: conversation.itemId?.type || null,
        reward: conversation.reward || 0,
        commission: conversation.commission || 0,
        finderPayout: (conversation.reward || 0) - (conversation.commission || 0),
        owner: owner?.user
          ? {
              id: owner.user._id,
              name: owner.user.name,
              email: owner.user.email
            }
          : null,
        finder: finder?.user
          ? {
              id: finder.user._id,
              name: finder.user.name,
              email: finder.user.email
            }
          : null,
        paymentMethod: conversation.paymentDetails?.paymentMethod || 'manual',
        transactionId: conversation.paymentDetails?.transactionId || null,
        paidAt: conversation.paymentDetails?.paidAt || conversation.updatedAt,
        status: conversation.paymentDetails?.status || conversation.status
      };
    });

    res.json({
      transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify user
router.put('/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User verified successfully',
      user
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deletion of admins
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    // Delete user's items and conversations
    await Item.deleteMany({ postedBy: req.params.id });
    await Conversation.deleteMany({ 'participants.user': req.params.id });

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item status
router.put('/items/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'claimed', 'verified', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('postedBy', 'name email');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      message: 'Item status updated successfully',
      item
    });
  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete item
router.delete('/items/:id', adminAuth, async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete related conversations
    await Conversation.deleteMany({ itemId: req.params.id });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get revenue analytics
router.get('/revenue', adminAuth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let format;
    switch (period) {
      case 'day':
        format = "%Y-%m-%d";
        break;
      case 'week':
        format = "%Y-%U";
        break;
      case 'year':
        format = "%Y";
        break;
      case 'month':
      default:
        format = "%Y-%m";
    }

    const revenueData = await Conversation.aggregate([
      {
        $match: {
          status: 'completed',
          reward: { $gt: 0 },
          'paymentDetails.status': 'completed',
          'paymentDetails.paidAt': { $exists: true }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format, date: "$paymentDetails.paidAt" } },
          totalRewards: { $sum: "$reward" },
          totalCommission: { $sum: "$commission" },
          totalFinderPayouts: { $sum: { $subtract: ["$reward", "$commission"] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ revenueData });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
