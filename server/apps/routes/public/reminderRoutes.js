const express = require('express');
const router = express.Router();
const reminderController = require('../../controllers/reminderController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// Test kết nối email (public - để test)
router.get('/test-email-connection', reminderController.testEmailConnection);

// Gửi test email đến địa chỉ bất kỳ
router.post('/send-test-email', reminderController.sendTestEmail);

// Bảo vệ tất cả routes bên dưới - chỉ cho phép admin
router.use(verifyToken, isAdmin);

// Test gửi nhắc lịch cho 1 booking
router.post('/send/:bookingId', reminderController.sendTestReminder);

// Chạy kiểm tra và gửi tất cả nhắc lịch
router.post('/check-and-send', reminderController.checkAndSendAll);

// Lấy thống kê nhắc lịch
router.get('/stats', reminderController.getReminderStats);

module.exports = router;



