const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const patientProfileController = require('../../controllers/patientProfileController');

// Middleware kiểm tra role patient
const checkPatientRole = (req, res, next) => {
    if (req.user && req.user.role === 'patient') {
        next();
    } else {
        return res.status(403).json({ message: 'Chỉ khách hàng mới có quyền truy cập' });
    }
};

// ✅ GET - Lấy thông tin khách hàng
router.get('/', verifyToken, checkPatientRole, patientProfileController.getPatientProfile);

// ✅ PUT - Cập nhật thông tin khách hàng
router.put('/', verifyToken, checkPatientRole, patientProfileController.updatePatientProfile);

// ✅ PUT - Đổi mật khẩu
router.put('/change-password', verifyToken, checkPatientRole, patientProfileController.changePassword);

module.exports = router;



