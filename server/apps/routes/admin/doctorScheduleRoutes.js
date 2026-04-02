const express = require('express');
const router = express.Router();
const adminDoctorScheduleController = require('../../controllers/adminDoctorScheduleController');
const doctorScheduleController = require('../../controllers/doctorScheduleController');
const { verifyToken } = require('../../middlewares/auth');

// Lấy tất cả bác sĩ
router.get('/doctors-list', verifyToken, adminDoctorScheduleController.getAllDoctors);

// Lấy tất cả lịch làm việc
router.get('/', verifyToken, adminDoctorScheduleController.getAllSchedules);

// Lấy lịch làm việc của một bác sĩ
router.get('/:doctorId', verifyToken, adminDoctorScheduleController.getScheduleByDoctor);

// Tạo lịch làm việc
router.post('/', verifyToken, adminDoctorScheduleController.createSchedule);

// Bulk create lịch
router.post('/bulk', verifyToken, adminDoctorScheduleController.bulkCreateSchedules);

// Cập nhật lịch làm việc
router.put('/:scheduleId', verifyToken, adminDoctorScheduleController.updateSchedule);

// Xóa lịch làm việc
router.delete('/:scheduleId', verifyToken, adminDoctorScheduleController.deleteSchedule);

// Xóa tất cả lịch của một bác sĩ
router.delete('/doctor/:doctorId', verifyToken, adminDoctorScheduleController.deleteAllSchedulesForDoctor);

module.exports = router;


