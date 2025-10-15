const { validationResult } = require('express-validator');
const authService = require('../services/authService');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, email, password, roles } = req.body;
      
      const user = await authService.register({
        username,
        email,
        password,
        roles: roles || []
      });

      res.status(201).json({
        message: 'User registered successfully',
        user
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, password, twoFactorCode } = req.body;
      
      const result = await authService.login(username, password, twoFactorCode);

      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      res.status(401).json({
        message: error.message
      });
    }
  }

  // Setup 2FA
  async setup2FA(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await authService.setup2FA(userId);

      res.json({
        message: '2FA setup initiated',
        ...result
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Enable 2FA
  async enable2FA(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { twoFactorCode } = req.body;
      
      const result = await authService.enable2FA(userId, twoFactorCode);

      res.json({
        message: '2FA enabled successfully',
        ...result
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Disable 2FA
  async disable2FA(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { password } = req.body;
      
      const result = await authService.disable2FA(userId, password);

      res.json({
        message: '2FA disabled successfully',
        ...result
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      res.json({
        user: req.user
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  // Logout (client-side should remove token)
  async logout(req, res) {
    res.json({
      message: 'Logout successful'
    });
  }
}

module.exports = new AuthController();