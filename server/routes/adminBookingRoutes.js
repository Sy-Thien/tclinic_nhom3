const express = require('express');
const router = express.Router();
const adminBookingController = require('../controllers/adminBookingController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Tất cả routes cần xác thực là admin
router.use(verifyToken);
router.use(isAdmin);

router.get('/bookings', adminBookingController.getAllBookings);
router.post('/bookings', adminBookingController.createBooking);
router.put('/bookings/:id', adminBookingController.updateBooking);
router.put('/bookings/:id/assign-doctor', adminBookingController.assignDoctor);
router.put('/bookings/:id/cancel', adminBookingController.cancelBooking);
router.delete('/bookings/:id', adminBookingController.deleteBooking);

module.exports = router;
