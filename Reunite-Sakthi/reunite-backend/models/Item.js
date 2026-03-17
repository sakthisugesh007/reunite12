const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['lost', 'found']
  },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'jewelry', 'documents', 'clothing', 'accessories', 'bags', 'keys', 'pets', 'others']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  images: [{
    url: String,
    publicId: String,
    isPrimary: { type: Boolean, default: false }
  }],
  reward: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'claimed', 'verified', 'completed', 'cancelled'],
    default: 'active'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: Date,
  verifiedAt: Date,
  completedAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  contactInfo: {
    showPhone: { type: Boolean, default: false },
    showEmail: { type: Boolean, default: false },
    preferredContact: { type: String, enum: ['phone', 'email', 'chat'], default: 'chat' }
  },
  additionalInfo: {
    color: String,
    brand: String,
    model: String,
    serialNumber: String,
    distinguishingFeatures: String,
    dateLost: Date,
    dateFound: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
itemSchema.index({ type: 1, status: 1, createdAt: -1 });
itemSchema.index({ postedBy: 1, createdAt: -1 });
itemSchema.index({ coordinates: '2dsphere' });
itemSchema.index({ tags: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ reward: -1 });

// Virtual for commission calculation
itemSchema.virtual('commission').get(function() {
  return this.reward * 0.30;
});

itemSchema.virtual('finderPayout').get(function() {
  return this.reward * 0.70;
});

module.exports = mongoose.model('Item', itemSchema);
