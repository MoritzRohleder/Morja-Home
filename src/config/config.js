require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'dev-secret-change-in-production';
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Two Factor Authentication
  TWO_FA_SERVICE_NAME: process.env.TWO_FA_SERVICE_NAME || 'MorjaHome',
  TWO_FA_ISSUER: process.env.TWO_FA_ISSUER || 'MorjaHome Dashboard',
  
  // File Upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || './src/public/uploads',
  
  // Data Storage
  DATA_PATH: process.env.DATA_PATH || './data',
  
  // User Roles
  ROLES: {
    ADMIN: 'admin',
    LINKS: 'links',
    PHOTOS: 'photos', 
    MINECRAFT: 'minecraft',
    VAULTWARDEN: 'vaultwarden'
  },
  
  // Default Admin User
  DEFAULT_ADMIN: {
    username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
    password: process.env.DEFAULT_ADMIN_PASSWORD || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('DEFAULT_ADMIN_PASSWORD environment variable is required in production');
      }
      console.warn('⚠️  WARNING: Using default admin password. Change it immediately in production!');
      return 'admin123';
    })(),
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@morjahome.local'
  }
};

module.exports = config;