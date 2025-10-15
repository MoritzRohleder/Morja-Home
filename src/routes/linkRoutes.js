const express = require('express');
const { body } = require('express-validator');
const linkController = require('../controllers/linkController');
const { requireRole, optionalAuth } = require('../middleware/auth');
const config = require('../config/config');

const router = express.Router();

// Validation rules
const linkValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be 1-200 characters long'),
  body('url')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Must be a valid URL with http or https protocol'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be 50 characters or less'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

const linkUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be 1-200 characters long'),
  body('url')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Must be a valid URL with http or https protocol'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be 500 characters or less'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be 50 characters or less'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
];

// Public routes (no authentication required)
router.get('/public', linkController.getPublicLinks);

// Protected routes (require authentication and Links role)
router.use(requireRole([config.ROLES.LINKS, config.ROLES.ADMIN]));

router.get('/', linkController.getLinks);
router.get('/:id', linkController.getLink);
router.post('/', linkValidation, linkController.createLink);
router.put('/:id', linkUpdateValidation, linkController.updateLink);
router.delete('/:id', linkController.deleteLink);
router.post('/:id/click', linkController.clickLink);

module.exports = router;