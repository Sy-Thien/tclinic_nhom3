const express = require('express');
const router = express.Router();

// Patient routes
router.use('/bookings', require('./bookingRoutes'));
router.use('/booking-availability', require('./bookingAvailabilityRoutes'));
router.use('/profile', require('./profileRoutes'));
router.use('/medical-history', require('./medicalHistoryRoutes'));
router.use('/medical-records', require('./medicalRecordRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/consultations', require('./consultationRequestRoutes'));
router.use('/invoices', require('./invoiceRoutes'));
router.use('/vnpay', require('./vnpayRoutes'));
router.use('/', require('./patientRoutes'));

module.exports = router;

