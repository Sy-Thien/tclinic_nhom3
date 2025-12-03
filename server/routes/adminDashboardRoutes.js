const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Require admin authentication
router.use(verifyToken, isAdmin);

// GET - Dashboard statistics
router.get('/dashboard/stats', adminDashboardController.getDashboardStats);

// GET - Tình trạng bác sĩ (đang khám / rảnh)
router.get('/dashboard/doctor-status', adminDashboardController.getDoctorStatus);

module.exports = router;
