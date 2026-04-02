const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/bookingController');
const doctorScheduleController = require('../../controllers/doctorScheduleController');
const { verifyToken, optionalAuth } = require('../../middlewares/auth');

// Public routes
router.get('/doctors', bookingController.getDoctorsBySpecialty);
router.get('/available-slots', bookingController.getDoctorAvailableSlots);
router.get('/doctor-time-slots/:doctorId', doctorScheduleController.getDoctorTimeSlotsWithBookings); // ✅ NEW

// Patient routes (phải đăng nhập mới đặt lịch được)
router.post('/create', verifyToken, bookingController.createBooking);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);

// ✅ Alias routes cho frontend
router.get('/appointments', verifyToken, bookingController.getMyBookings);        // /api/customer/appointments
router.put('/appointments/:id/cancel', verifyToken, bookingController.cancelBooking); // /api/customer/appointments/:id/cancel

module.exports = router;



