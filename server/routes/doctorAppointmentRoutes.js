const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorAppointmentController');
const { verifyToken, isDoctor } = require('../middleware/authMiddleware');

// Tất cả routes cần xác thực là doctor
router.use(verifyToken);
router.use(isDoctor);

router.get('/appointments', doctorController.getMyAppointments);
router.get('/appointments/:id', doctorController.getBookingDetail);
router.put('/appointments/:id/confirm-booking', doctorController.confirmBooking);
router.put('/appointments/:id/reject-booking', doctorController.rejectBooking);
router.put('/appointments/:id/confirm', doctorController.confirmAppointment);
router.put('/appointments/:id/diagnosis', doctorController.updateBookingDiagnosis);
router.put('/appointments/:id/complete', doctorController.completeAppointment);

module.exports = router;
