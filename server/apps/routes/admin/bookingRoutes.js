const express = require('express');
const router = express.Router();
const adminBookingController = require('../../controllers/adminBookingController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// Tất cả routes cần xác thực là admin
router.use(verifyToken);
router.use(isAdmin);

// Mounted tại /api/admin/bookings
router.get('/', adminBookingController.getAllBookings);
router.get('/:id/available-doctors', adminBookingController.getAvailableDoctorsForBooking);
router.get('/:booking_id/available-doctors-for-assignment', adminBookingController.getAvailableDoctorsForAssignment);
router.post('/', adminBookingController.createBooking);
router.put('/:id', adminBookingController.updateBooking);
router.put('/:id/assign-doctor', adminBookingController.assignDoctor);
router.put('/:booking_id/assign-doctor-new', adminBookingController.assignDoctorToBooking);
router.put('/:id/cancel', adminBookingController.cancelBooking);
router.delete('/:id', adminBookingController.deleteBooking);

module.exports = router;


