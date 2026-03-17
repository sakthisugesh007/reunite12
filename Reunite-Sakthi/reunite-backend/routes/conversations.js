const express = require('express');
const Conversation = require('../models/Conversation');
const Item = require('../models/Item');
const { auth } = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');
const { emitConversationUpdate, emitItemUpdate } = require('../socket');

const router = express.Router();

// Get all conversations for current user
router.get('/', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.user': req.user.id,
      isArchived: false
    })
    .populate('itemId', 'title images type')
    .populate('participants.user', 'name avatar')
    .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single conversation
router.get('/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('itemId', 'title images type reward')
      .populate('participants.user', 'name avatar')
      .populate('messages.sender', 'name avatar');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user._id.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    // Mark as read
    await conversation.markAsRead(req.user.id);

    res.json({ conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start new conversation (when someone clicks "I Found This")
router.post('/', auth, async (req, res) => {
  try {
    const { itemId } = req.body;

    // Get item details
    const item = await Item.findById(itemId).populate('postedBy', 'name email');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Can only start conversation for lost items
    if (item.type !== 'lost') {
      return res.status(400).json({ error: 'Can only start conversation for lost items' });
    }

    // Can't start conversation for own item
    if (item.postedBy._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Cannot start conversation for your own item' });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      itemId: itemId,
      'participants.user': { $in: [item.postedBy._id, req.user.id] },
      isArchived: false
    });

    if (existingConversation) {
      await existingConversation.populate('itemId', 'title images type reward');
      await existingConversation.populate('participants.user', 'name avatar');
      await existingConversation.populate('messages.sender', 'name avatar');

      return res.status(200).json({
        message: 'Conversation already exists',
        conversation: existingConversation
      });
    }

    // Calculate commission
    const reward = item.reward || 0;
    const commission = reward * 0.30;

    // Create conversation
    const conversation = new Conversation({
      itemId: itemId,
      itemTitle: item.title,
      participants: [
        { user: item.postedBy._id, role: 'owner' },
        { user: req.user.id, role: 'finder' }
      ],
      reward,
      commission,
      messages: [{
        sender: req.user.id,
        content: `Hi! I believe I found your ${item.title}. Can you help me verify some details?`,
        messageType: 'text'
      }]
    });

    await conversation.save();

    // NOTE: Do not mark the item as 'claimed' at conversation start.
    // The item remains visible on the public dashboard until the finder
    // verifies the claimant (which updates the item status to 'verified').

    // Populate and return
    await conversation.populate('participants.user', 'name avatar');
    await conversation.populate('messages.sender', 'name avatar');
    await conversation.populate('itemId', 'title images type reward');

    await emitConversationUpdate(conversation._id, 'started');

    res.status(201).json({
      message: 'Conversation started successfully',
      conversation
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add message to conversation
router.post('/:id/messages', auth, validateMessage, async (req, res) => {
  try {
    const { content, messageType = 'text', metadata = {} } = req.body;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    // Add message
    await conversation.addMessage(req.user.id, content, messageType, metadata);

    // Get updated conversation
    const updatedConversation = await Conversation.findById(req.params.id)
      .populate('messages.sender', 'name avatar');

    await emitConversationUpdate(conversation._id, 'message');

    const newMessage = updatedConversation.messages[updatedConversation.messages.length - 1];

    res.status(201).json({
      successMessage: 'Message sent successfully',
      message: newMessage
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify claimant identity (finder only)
router.put('/:id/verify', auth, async (req, res) => {
  try {
    const { verificationNotes, meetingLocation, meetingTime } = req.body;

    const conversation = await Conversation.findById(req.params.id)
      .populate('itemId', 'title reward postedBy')
      .populate('participants.user', 'name email');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is the finder
    const finderParticipant = conversation.participants.find(
      p => p.role === 'finder' && p.user._id.toString() === req.user.id
    );
    if (!finderParticipant) {
      return res.status(403).json({ error: 'Only the finder can verify the claimant' });
    }

    // Check status
    if (conversation.status !== 'pending') {
      return res.status(400).json({ error: 'Claim cannot be verified at this stage' });
    }

    // Update conversation
    conversation.status = 'verified';
    conversation.verificationDetails = {
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      verificationNotes,
      meetingLocation,
      meetingTime: meetingTime ? new Date(meetingTime) : null
    };

    await conversation.save();

    // Update item status
    await Item.findByIdAndUpdate(conversation.itemId._id, {
      status: 'verified',
      verifiedAt: new Date()
    });
    await emitItemUpdate(conversation.itemId._id, 'verified');

    await emitConversationUpdate(conversation._id, 'verified');

    res.json({
      message: 'Claimant verified successfully',
      conversation
    });
  } catch (error) {
    console.error('Verify claim error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Complete payment and reunion (owner only)
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { paymentMethod, transactionId } = req.body;

    const conversation = await Conversation.findById(req.params.id)
      .populate('itemId', 'title reward')
      .populate('participants.user', 'name email');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is the owner
    const ownerParticipant = conversation.participants.find(
      p => p.role === 'owner' && p.user._id.toString() === req.user.id
    );
    if (!ownerParticipant) {
      return res.status(403).json({ error: 'Only the owner can complete the reunion' });
    }

    // Check status
    if (conversation.status !== 'verified') {
      return res.status(400).json({ error: 'Claim must be verified before completion' });
    }

    // Update conversation
    conversation.status = 'completed';
    conversation.paymentDetails = {
      status: 'completed',
      amount: conversation.reward,
      transactionId: transactionId || `pay_${Date.now()}`,
      paymentMethod: paymentMethod || 'dummy_razorpay_upi',
      paidAt: new Date(),
      processedBy: req.user.id
    };

    await conversation.save();

    // Update item status
    await Item.findByIdAndUpdate(conversation.itemId._id, {
      status: 'completed',
      completedAt: new Date()
    });
    await emitItemUpdate(conversation.itemId._id, 'completed');

    // Update user stats
    const finderParticipant = conversation.participants.find(p => p.role === 'finder');
    if (finderParticipant) {
      // Update finder stats
      await require('../models/User').findByIdAndUpdate(
        finderParticipant.user._id,
        { $inc: { 
          'stats.itemsFound': 1,
          'stats.totalRewardsReceived': conversation.reward * 0.70
        }}
      );

      // Update owner stats
      await require('../models/User').findByIdAndUpdate(
        req.user.id,
        { $inc: { 
          'stats.itemsRecovered': 1,
          'stats.totalRewardsPaid': conversation.reward
        }}
      );
    }

    await emitConversationUpdate(conversation._id, 'completed');

    res.json({
      message: 'Reunion completed successfully',
      conversation
    });
  } catch (error) {
    console.error('Complete reunion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Archive conversation
router.put('/:id/archive', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.user.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to archive this conversation' });
    }

    conversation.isArchived = true;
    conversation.archivedBy = req.user.id;
    conversation.archivedAt = new Date();
    await conversation.save();

    await emitConversationUpdate(conversation._id, 'archived');

    res.json({ message: 'Conversation archived successfully' });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
