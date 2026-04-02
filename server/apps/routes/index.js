const express = require('express');
const router = express.Router();

// Import route groups
const adminRoutes = require('./admin');
const authRoutes = require('./auth');
const doctorRoutes = require('./doctor');
const patientRoutes = require('./patient');
const publicRoutes = require('./public');

// Mount role-based routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/doctor', doctorRoutes);
router.use('/patient', patientRoutes);
router.use('/public', publicRoutes);

// ============================================================
// Top-level routes (called by frontend without role prefix)
// ============================================================

// Notifications (called from NotificationBell component)
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/auth');
router.get('/notifications/unread', verifyToken, notificationController.getUnreadNotifications);
router.get('/notifications', verifyToken, notificationController.getAllNotifications);
router.put('/notifications/:id/read', verifyToken, notificationController.markAsRead);
router.put('/notifications/mark-all-read', verifyToken, notificationController.markAllAsRead);

// Medical history (called from doctor ExaminationPage & PatientMedicalHistory)
router.use('/medical-history', require('./patient/medicalHistoryRoutes'));

// Reviews (called from customer ReviewModal)
router.use('/reviews', require('./patient/reviewRoutes'));

// Bookings (called from public ServiceDetail page)
router.use('/bookings', require('./patient/bookingRoutes'));

// Customer alias (backward compatibility)
router.use('/customer', require('./patient/bookingRoutes'));

// Invoices (called from admin RevenueManagement & doctor PaymentModal)
router.use('/invoices', require('./patient/invoiceRoutes'));

// Consultation requests (backward compatibility)
router.use('/consultation-requests', require('./patient/consultationRequestRoutes'));

// VNPay (called from payment pages)
router.use('/vnpay', require('./patient/vnpayRoutes'));

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
