const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const emailService = require('../services/emailService');

// ✅ Test kết nối email (public - để test)
router.get('/test-email-connection', async (req, res) => {
    try {
        const isConnected = await emailService.testConnection();
        res.json({
            success: isConnected,
            message: isConnected ? 'Email server sẵn sàng!' : 'Không thể kết nối email server'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ Gửi test email đến địa chỉ bất kỳ
router.post('/send-test-email', async (req, res) => {
    try {
        const { to_email } = req.body;

        if (!to_email) {
            return res.status(400).json({ message: 'Vui lòng nhập email nhận' });
        }

        const result = await emailService.sendBookingConfirmation({
            patient_name: 'Test User',
            patient_email: to_email,
            booking_code: 'TEST' + Date.now().toString().slice(-6),
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: '10:00',
            specialty_name: 'Test Chuyên Khoa'
        });

        res.json({
            success: true,
            message: `Email đã được gửi đến ${to_email}`,
            result
        });
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Bảo vệ tất cả routes bên dưới - chỉ cho phép admin
router.use(verifyToken, isAdmin);

// Test gửi nhắc lịch cho 1 booking
router.post('/send/:bookingId', reminderController.sendTestReminder);

// Chạy kiểm tra và gửi tất cả nhắc lịch
router.post('/check-and-send', reminderController.checkAndSendAll);

// Lấy thống kê nhắc lịch
router.get('/stats', reminderController.getReminderStats);

module.exports = router;
