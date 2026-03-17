const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'location', 'system'],
    default: 'text'
  },
  metadata: {
    imageUrl: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const conversationSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  itemTitle: {
    type: String,
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'finder'],
      required: true
    },
    hasRead: {
      type: Boolean,
      default: false
    },
    lastReadAt: Date
  }],
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'completed'],
    default: 'pending'
  },
  reward: {
    type: Number,
    required: true,
    min: 0
  },
  commission: {
    type: Number,
    required: true
  },
  verificationDetails: {
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String,
    meetingLocation: String,
    meetingTime: Date
  },
  paymentDetails: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    amount: Number,
    transactionId: String,
    paymentMethod: String,
    paidAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  archivedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
conversationSchema.index({ itemId: 1 });
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ updatedAt: -1 });

// Methods
conversationSchema.methods.markAsRead = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.hasRead = true;
    participant.lastReadAt = new Date();
  }
  return this.save();
};

conversationSchema.methods.addMessage = function(senderId, content, messageType = 'text', metadata = {}) {
  const message = {
    sender: senderId,
    content,
    messageType,
    metadata,
    readBy: [{ user: senderId, readAt: new Date() }]
  };
  
  this.messages.push(message);
  this.updatedAt = new Date();
  
  // Mark other participants as unread
  this.participants.forEach(participant => {
    if (participant.user.toString() !== senderId.toString()) {
      participant.hasRead = false;
    }
  });
  
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
