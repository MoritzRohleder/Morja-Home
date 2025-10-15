const Link = require('../models/Link');
const User = require('../models/User');
const config = require('../config/config');

// Get available modules based on user roles (standalone function)
function getAvailableModules(userRoles) {
    const modules = [];

    if (userRoles.includes(config.ROLES.LINKS) || userRoles.includes(config.ROLES.ADMIN)) {
      modules.push({
        name: 'Links',
        description: 'Manage and organize your links',
        path: '/links',
        icon: 'link'
      });
    }

    if (userRoles.includes(config.ROLES.PHOTOS) || userRoles.includes(config.ROLES.ADMIN)) {
      modules.push({
        name: 'Photos',
        description: 'Photo gallery and management',
        path: '/photos',
        icon: 'image'
      });
    }

    if (userRoles.includes(config.ROLES.MINECRAFT) || userRoles.includes(config.ROLES.ADMIN)) {
      modules.push({
        name: 'Minecraft',
        description: 'Minecraft server management',
        path: '/minecraft',
        icon: 'server'
      });
    }

    if (userRoles.includes(config.ROLES.VAULTWARDEN) || userRoles.includes(config.ROLES.ADMIN)) {
      modules.push({
        name: 'Vaultwarden',
        description: 'Password manager access',
        path: '/vaultwarden',
        icon: 'shield'
      });
    }

    if (userRoles.includes(config.ROLES.ADMIN)) {
      modules.push({
        name: 'Admin',
        description: 'System administration',
        path: '/admin',
        icon: 'settings'
      });
    }

    return modules;
}

class DashboardController {
  // Get dashboard overview
  async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const userRoles = req.user.roles || [];
      
      // Get user's statistics
      const userLinks = await Link.getLinksByUser(userId);
      const totalClicks = userLinks.reduce((sum, link) => sum + link.clickCount, 0);
      
      // Get recent links
      const recentLinks = userLinks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Get most clicked links
      const popularLinks = userLinks
        .filter(link => link.clickCount > 0)
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, 5);

      // Dashboard data based on user roles
      const dashboardData = {
        user: {
          username: req.user.username,
          roles: userRoles,
          lastLogin: req.user.lastLogin
        },
        stats: {
          totalLinks: userLinks.length,
          totalClicks,
          publicLinks: userLinks.filter(link => link.isPublic).length
        },
        recentLinks,
        popularLinks,
        availableModules: getAvailableModules(userRoles)
      };

      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  // Get system status
  async getSystemStatus(req, res) {
    try {
      const userRoles = req.user.roles || [];
      
      // Basic system info that any authenticated user can see
      const status = {
        server: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        },
        timestamp: new Date().toISOString()
      };

      // Additional info for admin users
      if (userRoles.includes(config.ROLES.ADMIN)) {
        const allUsers = await User.getAllUsers();
        const allLinks = await Link.getAllLinks();
        
        status.admin = {
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter(u => u.isActive).length,
          totalLinks: allLinks.length,
          publicLinks: allLinks.filter(l => l.isPublic).length
        };
      }

      res.json(status);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
}

module.exports = new DashboardController();