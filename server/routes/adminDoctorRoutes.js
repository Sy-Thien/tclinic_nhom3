const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const adminDoctorController = require('../controllers/adminDoctorController');

// Tất cả routes đều yêu cầu admin
router.use(verifyToken, isAdmin);

// GET - Danh sách bác sĩ (có filter, search)
router.get('/doctors', adminDoctorController.getAllDoctors);

// GET - Chi tiết 1 bác sĩ
router.get('/doctors/:id', adminDoctorController.getDoctorById);

// POST - Thêm bác sĩ mới
router.post('/doctors', adminDoctorController.createDoctor);

// PUT - Cập nhật thông tin bác sĩ
router.put('/doctors/:id', adminDoctorController.updateDoctor);

// PUT - Toggle trạng thái active/inactive
router.put('/doctors/:id/toggle-status', adminDoctorController.toggleDoctorStatus);

// DELETE - Cleanup test doctor (for API testing)
router.delete('/doctors/cleanup', adminDoctorController.cleanupDoctor);

// DELETE - Xóa bác sĩ
router.delete('/doctors/:id', adminDoctorController.deleteDoctor);

module.exports = router;
