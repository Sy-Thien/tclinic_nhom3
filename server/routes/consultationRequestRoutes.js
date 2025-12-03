const express = require('express');
const router = express.Router();
const consultationRequestController = require('../controllers/consultationRequestController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public route - Tạo yêu cầu (cả logged in và guest)
router.post('/', consultationRequestController.createRequest);

// Protected routes - Người dùng đã đăng nhập
router.get('/my-requests', verifyToken, consultationRequestController.getMyRequests);
router.get('/:id', verifyToken, consultationRequestController.getRequestDetail);

module.exports = router;
