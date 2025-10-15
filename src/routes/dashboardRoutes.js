const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Dashboard routes - all require authentication (handled by parent router)
router.get('/', dashboardController.getDashboard);
router.get('/status', dashboardController.getSystemStatus);

module.exports = router;