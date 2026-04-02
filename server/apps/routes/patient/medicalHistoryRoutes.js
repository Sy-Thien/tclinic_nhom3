const express = require('express');
const router = express.Router();
const medicalHistoryController = require('../../controllers/medicalHistoryController');
const { verifyToken, isDoctor } = require('../../middlewares/auth');

// Bảo vệ tất cả routes - chỉ cho phép doctor
router.use(verifyToken, isDoctor);

// Lưu bệnh án sau khi hoàn thành khám
router.post('/save', medicalHistoryController.saveMedicalHistory);

// Xem lịch sử khám của bệnh nhân
router.get('/patient/:patient_id', medicalHistoryController.getPatientHistory);

// Xem chi tiết 1 lần khám
router.get('/detail/:id', medicalHistoryController.getHistoryDetail);

// Danh sách bệnh nhân đã khám của bác sĩ
router.get('/my-patients', medicalHistoryController.getMyPatients);

module.exports = router;



