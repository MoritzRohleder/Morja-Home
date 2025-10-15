const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const config = require('../config/config');
const User = require('../models/User');

class AuthService {
  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        roles: user.roles 
      },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
  }

  // Hash password
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  async register(userData) {
    const { username, email, password, roles = [] } = userData;

    // Validate input
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const newUser = await User.createUser({
      username,
      email,
      password: hashedPassword,
      roles,
      isActive: true
    });

    return newUser;
  }

  // Login user
  async login(username, password, twoFactorCode = null) {
    // Find user
    const user = await User.getUserByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        throw new Error('Two-factor authentication code required');
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2 // Allow for time drift
      });

      if (!verified) {
        throw new Error('Invalid two-factor authentication code');
      }
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = this.generateToken(user);

    // Return user without password and token
    const { password: _, twoFactorSecret: __, ...userWithoutSensitiveData } = user;
    
    return {
      user: userWithoutSensitiveData,
      token
    };
  }

  // Setup 2FA
  async setup2FA(userId) {
    const user = await User.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new Error('Two-factor authentication is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${config.TWO_FA_SERVICE_NAME} (${user.username})`,
      issuer: config.TWO_FA_ISSUER,
      length: 32
    });

    // Update user with secret (but don't enable 2FA yet)
    await User.updateUser(userId, {
      twoFactorSecret: secret.base32
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  // Enable 2FA
  async enable2FA(userId, twoFactorCode) {
    const user = await User.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.twoFactorSecret) {
      throw new Error('Two-factor authentication setup not initiated');
    }

    if (user.twoFactorEnabled) {
      throw new Error('Two-factor authentication is already enabled');
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2
    });

    if (!verified) {
      throw new Error('Invalid two-factor authentication code');
    }

    // Enable 2FA
    await User.updateUser(userId, {
      twoFactorEnabled: true
    });

    return { success: true };
  }

  // Disable 2FA
  async disable2FA(userId, password) {
    const user = await User.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Disable 2FA
    await User.updateUser(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    return { success: true };
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();