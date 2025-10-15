const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.getUserById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    // Attach user to request object (without password)
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = Array.isArray(roles) 
      ? roles.some(role => userRoles.includes(role))
      : userRoles.includes(roles);

    if (!hasRole && !userRoles.includes(config.ROLES.ADMIN)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: roles,
        current: userRoles
      });
    }

    next();
  };
};

// Check if user is admin
const requireAdmin = requireRole(config.ROLES.ADMIN);

// Optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await User.getUserById(decoded.id);
      
      if (user && user.isActive) {
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    } catch (error) {
      // Token is invalid, but we continue without user
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  optionalAuth
};