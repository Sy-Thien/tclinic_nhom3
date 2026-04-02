const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/auth');
const doctorPrescriptionController = require('../../controllers/doctorPrescriptionController');

// Middleware: Kiểm tra role doctor
const checkDoctorRole = (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({ success: false, message: 'Chỉ bác sĩ mới có quyền kê đơn' });
    }
    next();
};

// POST - Tạo đơn thuốc
router.post('/', verifyToken, checkDoctorRole, doctorPrescriptionController.createPrescription);

// GET - Danh sách đơn thuốc của bác sĩ
router.get('/', verifyToken, checkDoctorRole, doctorPrescriptionController.getDoctorPrescriptions);

// GET - Chi tiết đơn thuốc
router.get('/:id', verifyToken, checkDoctorRole, doctorPrescriptionController.getPrescriptionById);

// GET - Đơn thuốc theo booking ID
router.get('/booking/:bookingId', verifyToken, checkDoctorRole, doctorPrescriptionController.getPrescriptionByBookingId);

// PUT - Cập nhật đơn thuốc
router.put('/:id', verifyToken, checkDoctorRole, doctorPrescriptionController.updatePrescription);

module.exports = router;



