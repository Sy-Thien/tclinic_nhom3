const express = require('express');
const router = express.Router();
const adminSpecialtyController = require('../controllers/adminSpecialtyController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Tất cả route yêu cầu admin auth
router.use(verifyToken, isAdmin);

// GET - Danh sách chuyên khoa
router.get('/specialties', adminSpecialtyController.getAllSpecialties);

// GET - Thông tin chi tiết chuyên khoa
router.get('/specialties/:id', adminSpecialtyController.getSpecialtyById);

// POST - Thêm chuyên khoa mới
router.post('/specialties', adminSpecialtyController.createSpecialty);

// PUT - Cập nhật thông tin chuyên khoa
router.put('/specialties/:id', adminSpecialtyController.updateSpecialty);

// DELETE - Xóa chuyên khoa
router.delete('/specialties/:id', adminSpecialtyController.deleteSpecialty);

module.exports = router;
