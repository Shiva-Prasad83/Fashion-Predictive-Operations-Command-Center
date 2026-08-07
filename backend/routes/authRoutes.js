const express = require('express');
const router = express.Router();
const { login, register, signup, getMe, logout, changePassword, loginValidation, registerValidation } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const validate = require('../middleware/validate');

// Public routes
router.post('/login', loginValidation, validate, login);
router.post('/signup', registerValidation, validate, signup);

// Protected routes
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);
router.put('/change-password', auth, changePassword);

// Admin only — create users from within the app
router.post('/register', auth, roleCheck('Operations Admin'), registerValidation, validate, register);

module.exports = router;
