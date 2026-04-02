const express = require('express');
const router = express.Router();
const doctorController = require('../../controllers/doctorAppointmentController');
const { verifyToken, isDoctor } = require('../../middlewares/auth');

// Tất cả routes cần xác thực là doctor
router.use(verifyToken);
router.use(isDoctor);

// This router is mounted at /api/doctor/appointments
// Routes below resolve to /api/doctor/appointments/<path>
router.get('/my-patients', doctorController.getMyPatients);

module.exports = router;



