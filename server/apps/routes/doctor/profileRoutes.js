const express = require('express');
const router = express.Router();
const { verifyToken, checkDoctorRole } = require('../../middlewares/auth');
const doctorProfileController = require('../../controllers/doctorProfileController');

// ✅ GET - Lấy thông tin bác sĩ
router.get('/profile', verifyToken, checkDoctorRole, doctorProfileController.getDoctorProfile);

// ✅ PUT - Cập nhật thông tin bác sĩ
router.put('/profile', verifyToken, checkDoctorRole, doctorProfileController.updateDoctorProfile);

// ✅ PUT - Đổi mật khẩu
router.put('/change-password', verifyToken, checkDoctorRole, doctorProfileController.changePassword);

module.exports = router;



