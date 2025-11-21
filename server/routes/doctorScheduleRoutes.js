const express = require('express');
const router = express.Router();
const doctorScheduleController = require('../controllers/doctorScheduleController');
const { verifyToken } = require('../middleware/authMiddleware');

// Lấy lịch làm việc của một bác sĩ
router.get('/schedule/:doctorId', doctorScheduleController.getSchedule);

// Lấy tất cả bác sĩ với lịch làm việc
router.get('/schedule-doctors', doctorScheduleController.getAllDoctorsWithSchedule);

// Tạo lịch làm việc (Admin)
router.post('/schedule', verifyToken, doctorScheduleController.createSchedule);

// Cập nhật lịch làm việc (Admin)
router.put('/schedule/:scheduleId', verifyToken, doctorScheduleController.updateSchedule);

// Xóa lịch làm việc (Admin)
router.delete('/schedule/:scheduleId', verifyToken, doctorScheduleController.deleteSchedule);

module.exports = router;
