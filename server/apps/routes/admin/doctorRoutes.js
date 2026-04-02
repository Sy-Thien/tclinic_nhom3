const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../../middlewares/auth');
const adminDoctorController = require('../../controllers/adminDoctorController');

// Tất cả routes đều yêu cầu admin
router.use(verifyToken, isAdmin);

// GET - Danh sách bác sĩ (có filter, search)
router.get('/', adminDoctorController.getAllDoctors);

// GET - Chi tiết 1 bác sĩ
router.get('/:id', adminDoctorController.getDoctorById);

// POST - Thêm bác sĩ mới
router.post('/', adminDoctorController.createDoctor);

// PUT - Cập nhật thông tin bác sĩ
router.put('/:id', adminDoctorController.updateDoctor);

// PUT - Toggle trạng thái active/inactive
router.put('/:id/toggle-status', adminDoctorController.toggleDoctorStatus);

// DELETE - Cleanup test doctor (for API testing)
router.delete('/cleanup', adminDoctorController.cleanupDoctor);

// DELETE - Xóa bác sĩ
router.delete('/:id', adminDoctorController.deleteDoctor);

module.exports = router;


