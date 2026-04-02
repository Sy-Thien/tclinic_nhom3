const express = require('express');
const router = express.Router();

// Public routes (no auth required)
router.use('/', require('./publicRoutes'));
router.use('/articles', require('./articleRoutes'));
router.use('/doctors', require('./doctorRoutes'));
router.use('/time-slots', require('./timeSlotRoutes'));
router.use('/reminders', require('./reminderRoutes'));

module.exports = router;

