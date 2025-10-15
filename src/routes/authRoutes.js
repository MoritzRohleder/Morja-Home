const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters long')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const twoFactorValidation = [
  body('twoFactorCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Two-factor code must be 6 digits')
    .isNumeric()
    .withMessage('Two-factor code must be numeric')
];

const passwordValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes
router.post('/register', requireAdmin, registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/logout', authenticateToken, authController.logout);

// 2FA routes
router.post('/2fa/setup', authenticateToken, authController.setup2FA);
router.post('/2fa/enable', authenticateToken, twoFactorValidation, authController.enable2FA);
router.post('/2fa/disable', authenticateToken, passwordValidation, authController.disable2FA);

module.exports = router;