const { validationResult } = require('express-validator');
const Link = require('../models/Link');
const config = require('../config/config');

class LinkController {
  // Get all links for current user
  async getLinks(req, res) {
    try {
      const userId = req.user.id;
      const { category, public: includePublic } = req.query;
      
      let links;
      if (category) {
        links = await Link.getLinksByCategory(category, userId);
      } else if (includePublic === 'true') {
        const userLinks = await Link.getLinksByUser(userId);
        const publicLinks = await Link.getPublicLinks();
        // Combine and deduplicate
        const allLinks = [...userLinks, ...publicLinks];
        const uniqueLinks = allLinks.filter((link, index, self) => 
          index === self.findIndex(l => l.id === link.id)
        );
        links = uniqueLinks;
      } else {
        links = await Link.getLinksByUser(userId);
      }

      res.json({
        links: links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  // Get single link
  async getLink(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.roles.includes(config.ROLES.ADMIN);
      
      const link = await Link.getLinkById(id);
      
      if (!link) {
        return res.status(404).json({
          message: 'Link not found'
        });
      }

      // Check permissions
      if (!isAdmin && link.userId !== userId && !link.isPublic) {
        return res.status(403).json({
          message: 'Access denied'
        });
      }

      res.json({ link });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  // Create new link
  async createLink(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { title, url, description, category, isPublic } = req.body;
      const userId = req.user.id;

      const link = await Link.createLink({
        title,
        url,
        description,
        category,
        userId,
        isPublic: isPublic || false
      });

      res.status(201).json({
        message: 'Link created successfully',
        link
      });
    } catch (error) {
      res.status(400).json({
        message: error.message
      });
    }
  }

  // Update link
  async updateLink(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.roles.includes(config.ROLES.ADMIN);
      
      const updateData = req.body;

      // Admin can update any link, regular users only their own
      const link = await Link.updateLink(
        id, 
        updateData, 
        isAdmin ? null : userId
      );

      res.json({
        message: 'Link updated successfully',
        link
      });
    } catch (error) {
      if (error.message === 'Link not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'Unauthorized to update this link') {
        res.status(403).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  // Delete link
  async deleteLink(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.roles.includes(config.ROLES.ADMIN);

      // Admin can delete any link, regular users only their own
      await Link.deleteLink(id, isAdmin ? null : userId);

      res.json({
        message: 'Link deleted successfully'
      });
    } catch (error) {
      if (error.message === 'Link not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'Unauthorized to delete this link') {
        res.status(403).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  // Click link (increment counter and redirect)
  async clickLink(req, res) {
    try {
      const { id } = req.params;
      
      const link = await Link.incrementClickCount(id);
      
      res.json({
        message: 'Link clicked',
        url: link.url,
        clickCount: link.clickCount
      });
    } catch (error) {
      if (error.message === 'Link not found') {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: error.message });
      }
    }
  }

  // Get public links (no auth required)
  async getPublicLinks(req, res) {
    try {
      const { category } = req.query;
      
      let links;
      if (category) {
        links = await Link.getLinksByCategory(category);
      } else {
        links = await Link.getPublicLinks();
      }

      res.json({
        links: links.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
}

module.exports = new LinkController();