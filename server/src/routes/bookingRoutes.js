const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
    createBooking,
    getMyAppointments,
    cancelAppointment
} = require('../controllers/bookingController');

// Đặt lịch (public - không cần đăng nhập)
router.post('/public/booking', createBooking);

// Lấy danh sách lịch hẹn của mình (yêu cầu đăng nhập)
router.get('/customer/appointments', authenticateToken, getMyAppointments);

// Hủy lịch hẹn (yêu cầu đăng nhập)
router.put('/customer/appointments/:id/cancel', authenticateToken, cancelAppointment);

module.exports = router;