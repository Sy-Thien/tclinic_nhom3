const express = require('express');
const router = express.Router();
const adminDoctorScheduleController = require('../controllers/adminDoctorScheduleController');
const doctorScheduleController = require('../controllers/doctorScheduleController');
const { verifyToken } = require('../middleware/authMiddleware');

// Lấy tất cả bác sĩ
router.get('/doctors-list', verifyToken, adminDoctorScheduleController.getAllDoctors);

// Lấy tất cả lịch làm việc
router.get('/doctor-schedules', verifyToken, adminDoctorScheduleController.getAllSchedules);

// Lấy lịch làm việc của một bác sĩ
router.get('/doctor-schedules/:doctorId', verifyToken, adminDoctorScheduleController.getScheduleByDoctor);

// Tạo lịch làm việc
router.post('/doctor-schedules', verifyToken, adminDoctorScheduleController.createSchedule);

// Bulk create lịch
router.post('/doctor-schedules/bulk', verifyToken, adminDoctorScheduleController.bulkCreateSchedules);

// Cập nhật lịch làm việc
router.put('/doctor-schedules/:scheduleId', verifyToken, adminDoctorScheduleController.updateSchedule);

// Xóa lịch làm việc
router.delete('/doctor-schedules/:scheduleId', verifyToken, adminDoctorScheduleController.deleteSchedule);

// Xóa tất cả lịch của một bác sĩ
router.delete('/doctor-schedules-doctor/:doctorId', verifyToken, adminDoctorScheduleController.deleteAllSchedulesForDoctor);

// ✅ NEW: Lấy time slots của bác sĩ với booking count
router.get('/doctor-time-slots/:doctorId', verifyToken, doctorScheduleController.getDoctorTimeSlotsWithBookings);

// ============ PHÊ DUYỆT LỊCH LÀM VIỆC ============
// Lấy danh sách lịch chờ phê duyệt
router.get('/pending-schedules', verifyToken, adminDoctorScheduleController.getPendingSchedules);

// Lấy lịch sử phê duyệt
router.get('/approval-history', verifyToken, adminDoctorScheduleController.getApprovalHistory);

// Phê duyệt lịch làm việc
router.post('/schedules/:scheduleId/approve', verifyToken, adminDoctorScheduleController.approveSchedule);

// Từ chối lịch làm việc
router.post('/schedules/:scheduleId/reject', verifyToken, adminDoctorScheduleController.rejectSchedule);

module.exports = router;
