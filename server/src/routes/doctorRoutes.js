const express = require('express');
const router = express.Router();
const { authenticateToken, isDoctor } = require('../middleware/authMiddleware');
const {
    getMyProfile,
    getMyAppointments,
    updateAppointmentStatus,
    updateDiagnosis,
    getMyStats
} = require('../controllers/doctorController');

// Tất cả routes cần xác thực và role doctor
router.use(authenticateToken, isDoctor);

// Profile
router.get('/doctor/profile', getMyProfile);

// Thống kê
router.get('/doctor/stats', getMyStats);

// Lịch hẹn
router.get('/doctor/appointments', getMyAppointments);
router.put('/doctor/appointments/:id/status', updateAppointmentStatus);
router.put('/doctor/appointments/:id/diagnosis', updateDiagnosis);

module.exports = router;