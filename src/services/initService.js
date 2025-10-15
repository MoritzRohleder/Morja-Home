const User = require('../models/User');
const authService = require('./authService');
const config = require('../config/config');

class InitService {
  async initializeApplication() {
    try {
      // Check if admin user exists
      await this.createDefaultAdmin();
      console.log('Application initialization completed');
    } catch (error) {
      console.error('Application initialization failed:', error);
    }
  }

  async createDefaultAdmin() {
    try {
      // Check if any admin user exists
      const allUsers = await User.getAllUsers();
      const adminExists = allUsers.some(user => 
        user.roles && user.roles.includes(config.ROLES.ADMIN)
      );

      if (!adminExists) {
        console.log('No admin user found, creating default admin...');
        
        const adminUser = await authService.register({
          username: config.DEFAULT_ADMIN.username,
          email: config.DEFAULT_ADMIN.email,
          password: config.DEFAULT_ADMIN.password,
          roles: [
            config.ROLES.ADMIN,
            config.ROLES.LINKS,
            config.ROLES.PHOTOS,
            config.ROLES.MINECRAFT,
            config.ROLES.VAULTWARDEN
          ]
        });

        console.log(`Default admin user created: ${adminUser.username}`);
        console.log('Please change the default password after first login!');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Default admin user already exists');
      } else {
        console.error('Error creating default admin:', error);
      }
    }
  }
}

module.exports = new InitService();