const { validationResult } = require('express-validator');
const User = require('../models/User');
const Link = require('../models/Link');
const authService = require('../services/authService');

class AdminController {
  // Get all users
  async getUsers(req, res) {
    try {
      const users = await User.getAllUsers();
      
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, twoFactorSecret, ...userWithoutSensitiveData } = user;
        return userWithoutSensitiveData;
      });

      res.json({
        users: sanitizedUsers
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  // Get single user
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const user = await User.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      // Remove sensitive data
      const { password, twoFactorSecret, ...userWithoutSensitiveData } = user;
      
      res.json({
        user: userWithoutSensitiveData
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  // Create new user
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, email, password, roles, isActive } = req.body;
      
      const user = await authService.register({
        username,
        email,
        password,
        roles: roles || [],
        isActive: isActive !== undefined ? isActive : true
      });

      res.status(201).json({
        message: 'User created successfully',
        user
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await authService.hashPassword(updateData.password);
      }

      const user = await User.updateUser(id, updateData);

      res.json({
        message: 'User updated successfully',
        user
      });
    } catch (error) {
      if (error.message === 'User not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (id === req.user.id) {
        return res.status(400).json({
          message: 'Cannot delete your own account'
        });
      }

      await User.deleteUser(id);

      res.json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      if (error.message === 'User not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  // Get all links (admin view)
  async getAllLinks(req, res) {
    try {
      const links = await Link.getAllLinks();
      
      res.json({
        links: links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  // Delete any link
  async deleteAnyLink(req, res) {
    try {
      const { id } = req.params;

      await Link.deleteLink(id); // Admin can delete any link (no userId restriction)

      res.json({
        message: 'Link deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Link not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  // Get system statistics
  async getSystemStats(req, res) {
    try {
      const users = await User.getAllUsers();
      const links = await Link.getAllLinks();

      const stats = {
        users: {
          total: users.length,
          active: users.filter(u => u.isActive).length,
          with2FA: users.filter(u => u.twoFactorEnabled).length,
          byRole: {}
        },
        links: {
          total: links.length,
          public: links.filter(l => l.isPublic).length,
          totalClicks: links.reduce((sum, link) => sum + link.clickCount, 0),
          byCategory: {}
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform
        }
      };

      // Calculate role distribution
      const roleCount = {};
      users.forEach(user => {
        user.roles.forEach(role => {
          roleCount[role] = (roleCount[role] || 0) + 1;
        });
      });
      stats.users.byRole = roleCount;

      // Calculate category distribution
      const categoryCount = {};
      links.forEach(link => {
        const category = link.category || 'uncategorized';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      stats.links.byCategory = categoryCount;

      res.json(stats);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
}

module.exports = new AdminController();