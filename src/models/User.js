const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

class User {
  constructor() {
    this.dataPath = path.join(config.DATA_PATH, 'users.json');
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

  async getAllUsers() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  async getUserById(id) {
    const users = await this.getAllUsers();
    return users.find(user => user.id === id);
  }

  async getUserByUsername(username) {
    const users = await this.getAllUsers();
    return users.find(user => user.username === username);
  }

  async getUserByEmail(email) {
    const users = await this.getAllUsers();
    return users.find(user => user.email === email);
  }

  async createUser(userData) {
    const users = await this.getAllUsers();
    
    // Check if username or email already exists
    if (users.some(user => user.username === userData.username)) {
      throw new Error('Username already exists');
    }
    if (users.some(user => user.email === userData.email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      password: userData.password, // Should be hashed before calling this method
      roles: userData.roles || [],
      twoFactorSecret: userData.twoFactorSecret || null,
      twoFactorEnabled: userData.twoFactorEnabled || false,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: userData.isActive !== undefined ? userData.isActive : true
    };

    users.push(newUser);
    await this.saveUsers(users);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async updateUser(id, updateData) {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Don't allow changing id, createdAt
    const { id: _, createdAt: __, ...allowedUpdates } = updateData;
    
    users[userIndex] = {
      ...users[userIndex],
      ...allowedUpdates,
      updatedAt: new Date().toISOString()
    };

    await this.saveUsers(users);
    
    // Return user without password
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  }

  async deleteUser(id) {
    const users = await this.getAllUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === users.length) {
      throw new Error('User not found');
    }

    await this.saveUsers(filteredUsers);
    return true;
  }

  async saveUsers(users) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
      throw new Error('Failed to save user data');
    }
  }

  async updateLastLogin(id) {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      await this.saveUsers(users);
    }
  }
}

module.exports = new User();