const express = require('express');
const router = express.Router();
const adminDashboardController = require('../../controllers/adminDashboardController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// Require admin authentication
router.use(verifyToken, isAdmin);

// GET - Dashboard statistics
router.get('/stats', adminDashboardController.getDashboardStats);

// GET - Tình trạng bác sĩ (đang khám / rảnh)
router.get('/doctor-status', adminDashboardController.getDoctorStatus);

module.exports = router;


