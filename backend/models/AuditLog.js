const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  auditId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'login_failed',
      'data_access',
      'create',
      'update',
      'delete',
      'export',
      'ai_execution',
      'ai_approval',
      'ai_rejection',
      'ai_override',
      'config_change',
      'password_change',
      'role_change',
      'permission_change',
      'escalation',
      'approval',
      'rejection'
    ],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    index: true
  },
  performedBy: {
    type: String,
    ref: 'User',
    required: true,
    index: true
  },
  performedByRole: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  outcome: {
    type: String,
    enum: ['success', 'failure', 'blocked'],
    default: 'success',
    index: true
  },
  reason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  organisationId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Audit logs are append-only — never modified or deleted
auditLogSchema.index({ timestamp: -1, organisationId: 1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, entityType: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
