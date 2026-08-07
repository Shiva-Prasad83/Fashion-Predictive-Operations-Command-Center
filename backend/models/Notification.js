const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'assignment',
      'exception',
      'approval',
      'alert',
      'due_date',
      'ai_result',
      'system',
      'escalation'
    ],
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'cleared'],
    default: 'unread',
    index: true
  },
  urgent: {
    type: Boolean,
    default: false
  },
  recipientId: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  senderId: {
    type: String,
    ref: 'User'
  },
  linkedRecord: {
    type: { type: String },
    id: String
  },
  actionUrl: {
    type: String
  },
  readAt: {
    type: Date
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

notificationSchema.index({ recipientId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, recipientId: 1 });
notificationSchema.index({ organisationId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
