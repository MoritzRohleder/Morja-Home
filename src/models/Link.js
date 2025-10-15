const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

class Link {
  constructor() {
    this.dataPath = path.join(config.DATA_PATH, 'links.json');
    this.initializeDataFile();
  }

  async initializeDataFile() {
    try {
      await fs.access(this.dataPath);
    } catch (error) {
      // File doesn't exist, create it with empty array
      await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
      await fs.writeFile(this.dataPath, JSON.stringify([], null, 2));
    }
  }

  async getAllLinks() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading links:', error);
      return [];
    }
  }

  async getLinksByUser(userId) {
    const links = await this.getAllLinks();
    return links.filter(link => link.userId === userId);
  }

  async getLinkById(id) {
    const links = await this.getAllLinks();
    return links.find(link => link.id === id);
  }

  async createLink(linkData) {
    const links = await this.getAllLinks();
    
    const newLink = {
      id: uuidv4(),
      title: linkData.title,
      url: linkData.url,
      description: linkData.description || '',
      category: linkData.category || 'general',
      userId: linkData.userId,
      isPublic: linkData.isPublic || false,
      clickCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    links.push(newLink);
    await this.saveLinks(links);
    return newLink;
  }

  async updateLink(id, updateData, userId = null) {
    const links = await this.getAllLinks();
    const linkIndex = links.findIndex(link => link.id === id);
    
    if (linkIndex === -1) {
      throw new Error('Link not found');
    }

    // If userId is provided, ensure the user owns the link
    if (userId && links[linkIndex].userId !== userId) {
      throw new Error('Unauthorized to update this link');
    }

    // Don't allow changing id, userId, createdAt, clickCount
    const { id: _, userId: __, createdAt: ___, clickCount: ____, ...allowedUpdates } = updateData;
    
    links[linkIndex] = {
      ...links[linkIndex],
      ...allowedUpdates,
      updatedAt: new Date().toISOString()
    };

    await this.saveLinks(links);
    return links[linkIndex];
  }

  async deleteLink(id, userId = null) {
    const links = await this.getAllLinks();
    const linkToDelete = links.find(link => link.id === id);
    
    if (!linkToDelete) {
      throw new Error('Link not found');
    }

    // If userId is provided, ensure the user owns the link
    if (userId && linkToDelete.userId !== userId) {
      throw new Error('Unauthorized to delete this link');
    }

    const filteredLinks = links.filter(link => link.id !== id);
    await this.saveLinks(filteredLinks);
    return true;
  }

  async incrementClickCount(id) {
    const links = await this.getAllLinks();
    const linkIndex = links.findIndex(link => link.id === id);
    
    if (linkIndex !== -1) {
      links[linkIndex].clickCount += 1;
      links[linkIndex].lastClicked = new Date().toISOString();
      await this.saveLinks(links);
      return links[linkIndex];
    }
    
    throw new Error('Link not found');
  }

  async getPublicLinks() {
    const links = await this.getAllLinks();
    return links.filter(link => link.isPublic);
  }

  async getLinksByCategory(category, userId = null) {
    const links = await this.getAllLinks();
    let filteredLinks = links.filter(link => link.category === category);
    
    if (userId) {
      filteredLinks = filteredLinks.filter(link => 
        link.userId === userId || link.isPublic
      );
    } else {
      filteredLinks = filteredLinks.filter(link => link.isPublic);
    }
    
    return filteredLinks;
  }

  async saveLinks(links) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(links, null, 2));
    } catch (error) {
      console.error('Error saving links:', error);
      throw new Error('Failed to save link data');
    }
  }
}

module.exports = new Link();