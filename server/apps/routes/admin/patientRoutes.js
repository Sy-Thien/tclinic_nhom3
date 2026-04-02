const express = require('express');
const router = express.Router();
const adminPatientController = require('../../controllers/adminPatientController');
const { verifyToken, isAdmin } = require('../../middlewares/auth');

// Tất cả route yêu cầu admin auth
router.use(verifyToken, isAdmin);

// GET - Danh sách bệnh nhân
router.get('/', adminPatientController.getAllPatients);

// DELETE - Cleanup test patient (for API testing) - MUST be before /:id
router.delete('/cleanup', adminPatientController.cleanupPatient);

// GET - Thông tin chi tiết bệnh nhân
router.get('/:id', adminPatientController.getPatientById);

// GET - Lịch sử khám của bệnh nhân
router.get('/:id/history', adminPatientController.getPatientHistory);

// GET - Hồ sơ bệnh án chi tiết của bệnh nhân (Admin xem TẤT CẢ)
router.get('/:id/medical-records', adminPatientController.getPatientMedicalRecords);

// POST - Thêm bệnh nhân mới
router.post('/', adminPatientController.createPatient);

// PUT - Cập nhật thông tin bệnh nhân
router.put('/:id', adminPatientController.updatePatient);

// PUT - Toggle trạng thái active/inactive
router.put('/:id/toggle-status', adminPatientController.togglePatientStatus);

// DELETE - Xóa bệnh nhân
router.delete('/:id', adminPatientController.deletePatient);

module.exports = router;


