const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./src/config/config');
const initService = require('./src/services/initService');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const linkRoutes = require('./src/routes/linkRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Import middleware
const { authenticateToken } = require('./src/middleware/auth');
const { logRequest } = require('./src/middleware/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(logRequest);

// Static files
app.use('/static', express.static(path.join(__dirname, 'src/public')));
app.use('/uploads', express.static(path.join(__dirname, 'src/public/uploads')));

// View engine setup for simple HTML templates
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'html');
app.engine('html', require('fs').readFileSync);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/links', authenticateToken, linkRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Dashboard home route (public - authentication handled by frontend)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/dashboard.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: config.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = config.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`MorjaHome dashboard server running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  
  // Initialize application (create default admin user, etc.)
  await initService.initializeApplication();
});

module.exports = app;