const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.get('/doctors', bookingController.getDoctorsBySpecialty);
router.get('/available-slots', bookingController.getDoctorAvailableSlots);

// Patient routes (cần đăng nhập)
router.post('/create', verifyToken, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);

module.exports = router;
