const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, isAdmin, isDoctor } = require('../middleware/authMiddleware');

// Static routes first
// Get revenue statistics (admin)
router.get('/stats/revenue', verifyToken, isAdmin, invoiceController.getRevenueStats);

// Get all invoices with filters (admin)
router.get('/', verifyToken, isAdmin, invoiceController.getAllInvoices);

// Preview invoice (before creating - for doctors)
router.get('/preview/:bookingId', verifyToken, invoiceController.previewInvoice);

// Create invoice (doctors can create after examination)
router.post('/', verifyToken, invoiceController.createInvoice);

// Get invoice by booking ID (doctor viewing their patient's invoice)
router.get('/booking/:bookingId', verifyToken, invoiceController.getInvoiceByBooking);

// Update payment status (doctor can mark as paid)
router.put('/:id/payment', verifyToken, invoiceController.updatePaymentStatus);

// Get single invoice (param routes last)
router.get('/:id', verifyToken, invoiceController.getInvoiceById);

// Cancel invoice (admin only)
router.delete('/:id', verifyToken, isAdmin, invoiceController.cancelInvoice);

module.exports = router;
