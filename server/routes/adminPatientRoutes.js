const express = require('express');
const router = express.Router();
const adminPatientController = require('../controllers/adminPatientController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Tất cả route yêu cầu admin auth
router.use(verifyToken, isAdmin);

// GET - Danh sách bệnh nhân
router.get('/patients', adminPatientController.getAllPatients);

// DELETE - Cleanup test patient (for API testing) - MUST be before /:id
router.delete('/patients/cleanup', adminPatientController.cleanupPatient);

// GET - Thông tin chi tiết bệnh nhân
router.get('/patients/:id', adminPatientController.getPatientById);

// GET - Lịch sử khám của bệnh nhân
router.get('/patients/:id/history', adminPatientController.getPatientHistory);

// GET - Hồ sơ bệnh án chi tiết của bệnh nhân (Admin xem TẤT CẢ)
router.get('/patients/:id/medical-records', adminPatientController.getPatientMedicalRecords);

// PUT - Cập nhật hồ sơ bệnh án
router.put('/medical-records/:id', adminPatientController.updateMedicalRecord);

// POST - Thêm bệnh nhân mới
router.post('/patients', adminPatientController.createPatient);

// PUT - Cập nhật thông tin bệnh nhân
router.put('/patients/:id', adminPatientController.updatePatient);

// PUT - Toggle trạng thái active/inactive
router.put('/patients/:id/toggle-status', adminPatientController.togglePatientStatus);

// DELETE - Xóa bệnh nhân
router.delete('/patients/:id', adminPatientController.deletePatient);

module.exports = router;
