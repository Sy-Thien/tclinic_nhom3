const express = require('express');
const router = express.Router();
const adminSpecialtyController = require('../../controllers/adminSpecialtyController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// Tất cả route yêu cầu admin auth
router.use(verifyToken, isAdmin);

// GET - Danh sách chuyên khoa
router.get('/', adminSpecialtyController.getAllSpecialties);

// GET - Thông tin chi tiết chuyên khoa
router.get('/:id', adminSpecialtyController.getSpecialtyById);

// POST - Thêm chuyên khoa mới
router.post('/', adminSpecialtyController.createSpecialty);

// PUT - Cập nhật thông tin chuyên khoa
router.put('/:id', adminSpecialtyController.updateSpecialty);

// DELETE - Xóa chuyên khoa
router.delete('/:id', adminSpecialtyController.deleteSpecialty);

module.exports = router;


