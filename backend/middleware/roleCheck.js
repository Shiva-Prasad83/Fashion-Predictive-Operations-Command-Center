const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

// Role hierarchy helper
const roleHierarchy = {
  'Operations Admin': 4,
  'Manager': 3,
  'Analyst': 2,
  'Field Staff': 1
};

const roleCheckMinimum = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const requiredRoleLevel = roleHierarchy[minimumRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        minimumRole: minimumRole,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = { roleCheck, roleCheckMinimum };
