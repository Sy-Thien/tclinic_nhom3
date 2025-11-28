const express = require('express');
const router = express.Router();
const adminBookingController = require('../controllers/adminBookingController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Tất cả routes cần xác thực là admin
router.use(verifyToken);
router.use(isAdmin);

router.get('/bookings', adminBookingController.getAllBookings);
router.get('/bookings/:id/available-doctors', adminBookingController.getAvailableDoctorsForBooking);
router.get('/bookings/:booking_id/available-doctors-for-assignment', adminBookingController.getAvailableDoctorsForAssignment);
router.post('/bookings', adminBookingController.createBooking);
router.put('/bookings/:id', adminBookingController.updateBooking);
router.put('/bookings/:id/assign-doctor', adminBookingController.assignDoctor);
router.put('/bookings/:booking_id/assign-doctor-new', adminBookingController.assignDoctorToBooking);
router.put('/bookings/:id/cancel', adminBookingController.cancelBooking);
router.delete('/bookings/:id', adminBookingController.deleteBooking);

module.exports = router;
