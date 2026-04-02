const express = require('express');
const router = express.Router();

// Doctor routes
router.use('/appointments', require('./appointmentRoutes'));
router.use('/consultations', require('./consultationRoutes'));
router.use('/prescriptions', require('./prescriptionRoutes'));
router.use('/schedules', require('./scheduleRoutes'));

// Profile routes mounted at / so paths like /profile and /change-password work
router.use('/', require('./profileRoutes'));

// Include doctor self-schedule, appointments, walk-in, reviews routes
// These expose: /my-schedules, /my-profile, /rooms, /work-schedule, /my-schedule, 
// /appointments, /walk-in, /search-patient, /reviews, /rating-stats, /bookings/:id, etc.
router.use('/', require('../public/doctorRoutes'));

module.exports = router;


