const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const adminDoctorScheduleController = require('../../controllers/adminDoctorScheduleController');
const adminPatientController = require('../../controllers/adminPatientController');
const doctorScheduleController = require('../../controllers/doctorScheduleController');

// Admin routes
router.use('/accounts', require('./accountRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/consultations', require('./consultationRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/doctors', require('./doctorRoutes'));
router.use('/doctor-schedules', require('./doctorScheduleRoutes'));
router.use('/drugs', require('./drugRoutes'));
router.use('/patients', require('./patientRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/rooms', require('./roomRoutes'));
router.use('/services', require('./serviceRoutes'));
router.use('/specialties', require('./specialtyRoutes'));
router.use('/time-slots', require('./timeSlotRoutes'));

// Routes mounted directly at /api/admin/ level (schedule approval + extras)
router.get('/doctor-time-slots/:doctorId', verifyToken, doctorScheduleController.getDoctorTimeSlotsWithBookings);
router.get('/pending-schedules', verifyToken, adminDoctorScheduleController.getPendingSchedules);
router.get('/approval-history', verifyToken, adminDoctorScheduleController.getApprovalHistory);
router.post('/schedules/:scheduleId/approve', verifyToken, adminDoctorScheduleController.approveSchedule);
router.post('/schedules/:scheduleId/reject', verifyToken, adminDoctorScheduleController.rejectSchedule);
router.post('/schedules/auto-approve-unregistered', verifyToken, adminDoctorScheduleController.autoApproveUnregistered);

// Medical records update (admin level)
router.put('/medical-records/:id', verifyToken, adminPatientController.updateMedicalRecord);

module.exports = router;