const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Require admin authentication
router.use(verifyToken, isAdmin);

// GET - Dashboard statistics
router.get('/dashboard/stats', adminDashboardController.getDashboardStats);

module.exports = router;
