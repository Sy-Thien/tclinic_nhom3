const express = require('express');
const router = express.Router();
const { verifyToken, checkDoctorRole } = require('../middleware/authMiddleware');
const {
    getDoctorProfile,
    updateDoctorProfile,
    changePassword
} = require('../controllers/doctorProfileController');

// ✅ GET - Lấy thông tin bác sĩ
router.get('/profile', verifyToken, checkDoctorRole, getDoctorProfile);

// ✅ PUT - Cập nhật thông tin bác sĩ
router.put('/profile', verifyToken, checkDoctorRole, updateDoctorProfile);

// ✅ PUT - Đổi mật khẩu
router.put('/change-password', verifyToken, checkDoctorRole, changePassword);

module.exports = router;
