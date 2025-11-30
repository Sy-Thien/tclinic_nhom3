const express = require('express');
const router = express.Router();
const adminServiceController = require('../controllers/adminServiceController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(verifyToken, isAdmin);

// GET - Danh sách dịch vụ
router.get('/', adminServiceController.getAllServices);

// GET - Thống kê
router.get('/stats', adminServiceController.getServiceStats);

// DELETE - Cleanup test service (for API testing) - MUST be before /:id
router.delete('/cleanup', adminServiceController.cleanupService);

// GET - Chi tiết dịch vụ
router.get('/:id', adminServiceController.getServiceById);

// POST - Thêm dịch vụ
router.post('/', adminServiceController.createService);

// PUT - Cập nhật dịch vụ
router.put('/:id', adminServiceController.updateService);

// DELETE - Xóa dịch vụ
router.delete('/:id', adminServiceController.deleteService);

module.exports = router;
