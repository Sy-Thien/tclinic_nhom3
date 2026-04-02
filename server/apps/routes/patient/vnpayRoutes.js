/**
 * VNPay Routes
 */

const express = require('express');
const router = express.Router();
const vnpayController = require('../../controllers/vnpayController');
const { verifyToken } = require('../../middlewares/auth');

// Tạo URL thanh toán
router.post('/create-payment', verifyToken, vnpayController.createPayment);

// VNPay callback - không cần auth vì VNPay gọi
router.get('/return', vnpayController.vnpayReturn);

// VNPay IPN (Instant Payment Notification)
router.get('/ipn', vnpayController.vnpayIPN);

// Query transaction status
router.get('/query/:orderId', verifyToken, vnpayController.queryTransaction);

// Danh sách ngân hàng
router.get('/banks', vnpayController.getBankList);

module.exports = router;



