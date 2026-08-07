const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.')
];

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('role').isIn(['Operations Admin', 'Manager', 'Analyst', 'Field Staff']).withMessage('Invalid role.')
];

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.userId, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Find user with password
    const user = await User.findOne({ email, deletedAt: null }).select('+password');

    if (!user) {
      await createAuditLog({
        action: 'login_failed',
        entityType: 'User',
        entityId: email,
        performedBy: 'anonymous',
        ipAddress,
        userAgent,
        outcome: 'failure',
        reason: 'User not found',
        organisationId: 'system'
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive or suspended.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await createAuditLog({
        action: 'login_failed',
        entityType: 'User',
        entityId: user.userId,
        performedBy: user.userId,
        performedByRole: user.role,
        ipAddress,
        userAgent,
        outcome: 'failure',
        reason: 'Invalid password',
        organisationId: user.organisationId
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await createAuditLog({
      action: 'login',
      entityType: 'User',
      entityId: user.userId,
      performedBy: user.userId,
      performedByRole: user.role,
      ipAddress,
      userAgent,
      outcome: 'success',
      organisationId: user.organisationId
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ success: false, message: 'Login failed.', error: error.message });
  }
};

// POST /api/auth/signup  — public self-registration (defaults to Analyst role)
const signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const existingUser = await User.findOne({ email, deletedAt: null });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email is already registered. Please log in.' });
    }

    // Self-registration is limited to non-admin roles
    const allowedRoles = ['Analyst', 'Field Staff'];
    const assignedRole = allowedRoles.includes(role) ? role : 'Analyst';

    const newUser = new User({
      userId: uuidv4(),
      email,
      password,
      firstName,
      lastName,
      role: assignedRole,
      organisationId: 'default-org',
      status: 'active'
    });

    await newUser.save();

    await createAuditLog({
      action: 'create',
      entityType: 'User',
      entityId: newUser.userId,
      performedBy: 'self-registration',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      newValue: { email, role: newUser.role },
      outcome: 'success',
      organisationId: newUser.organisationId
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. You can now log in.',
      data: { user: newUser.getPublicProfile() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Signup failed. Please try again.', error: error.message });
  }
};

// POST /api/auth/register (Admin only)
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, organisationId } = req.body;

    const existingUser = await User.findOne({ email, deletedAt: null });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const newUser = new User({
      userId: uuidv4(),
      email,
      password,
      firstName,
      lastName,
      role: role || 'Analyst',
      organisationId: organisationId || req.user?.organisationId || 'default-org',
      status: 'active'
    });

    await newUser.save();

    await createAuditLog({
      action: 'create',
      entityType: 'User',
      entityId: newUser.userId,
      performedBy: req.user?.userId || 'system',
      performedByRole: req.user?.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      newValue: { email, role: newUser.role },
      outcome: 'success',
      organisationId: newUser.organisationId
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: { user: newUser.getPublicProfile() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Registration failed.', error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId, deletedAt: null });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, data: { user: user.getPublicProfile() } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.', error: error.message });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  await createAuditLog({
    action: 'logout',
    entityType: 'User',
    entityId: req.user.userId,
    performedBy: req.user.userId,
    performedByRole: req.user.role,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    outcome: 'success',
    organisationId: req.user.organisationId
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findOne({ userId: req.user.userId, deletedAt: null }).select('+password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();

    await createAuditLog({
      action: 'password_change',
      entityType: 'User',
      entityId: user.userId,
      performedBy: req.user.userId,
      performedByRole: req.user.role,
      ipAddress: req.ip,
      outcome: 'success',
      organisationId: req.user.organisationId
    });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Password change failed.', error: error.message });
  }
};

module.exports = { login, register, signup, getMe, logout, changePassword, loginValidation, registerValidation };
