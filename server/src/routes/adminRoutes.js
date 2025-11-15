const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Appointment controllers
const {
    getAllAppointments,
    getAppointmentStats,
    confirmAppointment,
    cancelAppointmentByAdmin,
    assignDoctor,
    updateAppointmentStatus
} = require('../controllers/adminAppointmentController');

// Doctor controllers (THÊM MỚI)
const {
    getAllDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    resetDoctorPassword
} = require('../controllers/adminDoctorController');

// Tất cả routes cần xác thực và role admin
router.use(authenticateToken, isAdmin);

// ===== APPOINTMENT ROUTES =====
router.get('/admin/appointments/stats', getAppointmentStats);
router.get('/admin/appointments', getAllAppointments);
router.put('/admin/appointments/:id/confirm', confirmAppointment);
router.put('/admin/appointments/:id/cancel', cancelAppointmentByAdmin);
router.put('/admin/appointments/:id/assign-doctor', assignDoctor);
router.put('/admin/appointments/:id/status', updateAppointmentStatus);

// ===== DOCTOR ROUTES (THÊM MỚI) =====
router.get('/admin/doctors', getAllDoctors);
router.get('/admin/doctors/:id', getDoctorById);
router.post('/admin/doctors', createDoctor);
router.put('/admin/doctors/:id', updateDoctor);
router.delete('/admin/doctors/:id', deleteDoctor);
router.put('/admin/doctors/:id/reset-password', resetDoctorPassword);

module.exports = router;