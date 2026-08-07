const { v4: uuidv4 } = require('uuid');
const AuditLog = require('../models/AuditLog');

/**
 * Creates an audit log entry.
 * Can be called directly from controllers or used as middleware factory.
 */
const createAuditLog = async ({
  action,
  entityType,
  entityId,
  performedBy,
  performedByRole,
  ipAddress,
  userAgent,
  previousValue,
  newValue,
  outcome = 'success',
  reason,
  metadata,
  organisationId
}) => {
  try {
    await AuditLog.create({
      auditId: uuidv4(),
      action,
      entityType,
      entityId,
      performedBy,
      performedByRole,
      ipAddress,
      userAgent,
      previousValue,
      newValue,
      outcome,
      reason,
      metadata,
      organisationId: organisationId || 'system',
      timestamp: new Date()
    });
  } catch (err) {
    // Audit failures must never crash the application
    console.error('[AUDIT ERROR]', err.message);
  }
};

/**
 * Middleware factory for automatic audit logging on specific routes.
 * Usage: router.post('/path', auditMiddleware('create', 'EntityType'), handler)
 */
const auditMiddleware = (action, entityType) => {
  return (req, res, next) => {
    // Wrap res.json to capture the response after the handler runs
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (req.user) {
        const outcome = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
        createAuditLog({
          action,
          entityType,
          entityId: req.params.id || body?.data?.id || undefined,
          performedBy: req.user.userId,
          performedByRole: req.user.role,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent'),
          outcome,
          organisationId: req.user.organisationId
        });
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = { createAuditLog, auditMiddleware };
