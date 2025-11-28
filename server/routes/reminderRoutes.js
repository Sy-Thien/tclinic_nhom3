const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Bảo vệ tất cả routes - chỉ cho phép admin
router.use(verifyToken, isAdmin);

// Test gửi nhắc lịch cho 1 booking
router.post('/send/:bookingId', reminderController.sendTestReminder);

// Chạy kiểm tra và gửi tất cả nhắc lịch
router.post('/check-and-send', reminderController.checkAndSendAll);

// Lấy thống kê nhắc lịch
router.get('/stats', reminderController.getReminderStats);

module.exports = router;
