const express = require('express');
const router = express.Router();
const consultationRequestController = require('../../controllers/consultationRequestController');
const { verifyToken, optionalAuth } = require('../../middlewares/auth');

// Public route - Tạo yêu cầu (cả logged in và guest)
// ✅ optionalAuth sẽ đọc token nếu có, gán req.user nếu đăng nhập
router.post('/', optionalAuth, consultationRequestController.createRequest);

// Protected routes - Người dùng đã đăng nhập
router.get('/my-requests', verifyToken, consultationRequestController.getMyRequests);
router.get('/:id', verifyToken, consultationRequestController.getRequestDetail);

module.exports = router;



