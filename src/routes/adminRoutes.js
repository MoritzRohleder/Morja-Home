const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(requireAdmin);

// Validation rules
const userValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters long')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const userUpdateValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters long')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// User management routes
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.post('/users', userValidation, adminController.createUser);
router.put('/users/:id', userUpdateValidation, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Link management routes
router.get('/links', adminController.getAllLinks);
router.delete('/links/:id', adminController.deleteAnyLink);

// System routes
router.get('/stats', adminController.getSystemStats);

module.exports = router;