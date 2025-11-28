const express = require('express');
const router = express.Router();
const { verifyToken, checkDoctorRole } = require('../middleware/authMiddleware');
const doctorScheduleViewController = require('../controllers/doctorScheduleViewController');

// Tất cả routes yêu cầu xác thực bác sĩ
router.use(verifyToken, checkDoctorRole);

// GET - Lịch khám của bác sĩ
router.get('/my-schedule', doctorScheduleViewController.getDoctorSchedule);

// GET - Thống kê lịch khám
router.get('/schedule-statistics', doctorScheduleViewController.getDoctorScheduleStatistics);

module.exports = router;
