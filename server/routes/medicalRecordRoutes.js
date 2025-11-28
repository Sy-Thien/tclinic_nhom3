const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { verifyToken } = require('../middleware/authMiddleware');

// Patient routes - cần đăng nhập
router.use(verifyToken);

// Lấy lịch sử khám của bệnh nhân
router.get('/my-history', medicalRecordController.getMyMedicalHistory);

// Lấy chi tiết một lần khám
router.get('/my-history/:id', medicalRecordController.getMedicalRecordDetail);

// Doctor - xem lịch sử bệnh nhân
router.get('/patient/:patient_id/history', medicalRecordController.getPatientMedicalHistory);

module.exports = router;
