const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');

// GET /api/users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const filter = { organisationId: req.user.organisationId, deletedAt: null };

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: { users: users.map(u => u.getPublicProfile()), pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.', error: error.message });
  }
};

// GET /api/users/:id
const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await createAuditLog({ action: 'data_access', entityType: 'User', entityId: user.userId, performedBy: req.user.userId, performedByRole: req.user.role, outcome: 'success', organisationId: req.user.organisationId });

    res.json({ success: true, data: { user: user.getPublicProfile() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.', error: error.message });
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const prev = user.toObject();
    const allowedFields = ['firstName', 'lastName', 'role', 'status', 'permissions', 'notificationPreferences'];
    allowedFields.forEach(field => { if (req.body[field] !== undefined) user[field] = req.body[field]; });

    await user.save();

    if (prev.role !== user.role) {
      await createAuditLog({ action: 'role_change', entityType: 'User', entityId: user.userId, performedBy: req.user.userId, performedByRole: req.user.role, previousValue: { role: prev.role }, newValue: { role: user.role }, outcome: 'success', organisationId: req.user.organisationId });
    } else {
      await createAuditLog({ action: 'update', entityType: 'User', entityId: user.userId, performedBy: req.user.userId, performedByRole: req.user.role, previousValue: prev, newValue: req.body, outcome: 'success', organisationId: req.user.organisationId });
    }

    res.json({ success: true, message: 'User updated.', data: { user: user.getPublicProfile() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update user.', error: error.message });
  }
};

// DELETE /api/users/:id (soft delete)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id, organisationId: req.user.organisationId, deletedAt: null });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.userId === req.user.userId) return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });

    user.deletedAt = new Date();
    user.status = 'inactive';
    await user.save();

    await createAuditLog({ action: 'delete', entityType: 'User', entityId: user.userId, performedBy: req.user.userId, performedByRole: req.user.role, outcome: 'success', organisationId: req.user.organisationId });

    res.json({ success: true, message: 'User deactivated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user.', error: error.message });
  }
};

module.exports = { getUsers, getUser, updateUser, deleteUser };
