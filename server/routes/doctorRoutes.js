const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { Booking, Patient, Service, Specialty } = require('../models');
const { Op } = require('sequelize');
const doctorScheduleViewController = require('../controllers/doctorScheduleViewController');
const doctorReviewController = require('../controllers/doctorReviewController');
const doctorAppointmentController = require('../controllers/doctorAppointmentController');
const doctorWalkInController = require('../controllers/doctorWalkInController');
const doctorSelfScheduleController = require('../controllers/doctorSelfScheduleController');

// Middleware kiểm tra role doctor
const checkDoctorRole = (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Chỉ bác sĩ mới có quyền truy cập' });
    }
    next();
};

// GET - Lịch làm việc định kỳ (DoctorSchedule)
router.get('/work-schedule', verifyToken, checkDoctorRole, doctorAppointmentController.getWorkSchedule);

// ============ QUẢN LÝ LỊCH LÀM VIỆC CỦA BÁC SĨ (TỰ ĐĂNG KÝ) ============
// GET - Lấy danh sách phòng khám available
router.get('/rooms', verifyToken, checkDoctorRole, doctorSelfScheduleController.getRooms);

// GET - Lấy tất cả lịch làm việc của bác sĩ đang đăng nhập
router.get('/my-schedules', verifyToken, checkDoctorRole, doctorSelfScheduleController.getMySchedules);

// GET - Lấy thông tin profile bác sĩ
router.get('/my-profile', verifyToken, checkDoctorRole, doctorSelfScheduleController.getMyProfile);

// POST - Tạo lịch làm việc mới
router.post('/my-schedules', verifyToken, checkDoctorRole, doctorSelfScheduleController.createMySchedule);

// PUT - Cập nhật lịch làm việc
router.put('/my-schedules/:scheduleId', verifyToken, checkDoctorRole, doctorSelfScheduleController.updateMySchedule);

// DELETE - Xóa lịch làm việc
router.delete('/my-schedules/:scheduleId', verifyToken, checkDoctorRole, doctorSelfScheduleController.deleteMySchedule);

// PATCH - Toggle trạng thái hoạt động
router.patch('/my-schedules/:scheduleId/toggle', verifyToken, checkDoctorRole, doctorSelfScheduleController.toggleScheduleActive);
// ===================================================================

// GET - Danh sách lịch hẹn của bác sĩ
router.get('/appointments', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const { status, date, view } = req.query;
        const doctor_id = req.user.id; // ✅ FIX: Dùng req.user.id thay vì req.user.doctor_id

        console.log('📋 GET /api/doctor/appointments', { doctor_id, status, date, view });

        let whereClause = { doctor_id }; // ✅ FIX: Thêm doctor_id vào where

        // Lọc theo status
        if (status && status !== 'all') {
            whereClause.status = status;
        }

        // Lọc theo ngày
        if (date) {
            whereClause.appointment_date = date;
        }

        const appointments = await Booking.findAll({
            where: whereClause,
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'email', 'phone', 'birthday', 'gender', 'address'],
                    required: false
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            order: [
                ['appointment_date', 'ASC'],
                ['appointment_time', 'ASC']
            ]
        });

        console.log(`✅ Found ${appointments.length} appointments`);

        res.json({ appointments }); // ✅ FIX: Wrap trong object
    } catch (error) {
        console.error('❌ Error fetching appointments:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// GET - Lịch làm việc theo ngày (với bookings)
router.get('/my-schedule', verifyToken, checkDoctorRole, doctorAppointmentController.getMyAppointments);

// GET - Thống kê lịch làm việc theo tuần/tháng
router.get('/schedule-statistics', verifyToken, checkDoctorRole, doctorScheduleViewController.getDoctorScheduleStatistics);

// GET - Lấy chi tiết 1 booking theo ID (dùng cho examination page)
router.get('/bookings/:id', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const { id } = req.params;
        const doctor_id = req.user.id;

        console.log(`📋 GET /api/doctor/bookings/${id}`);

        const booking = await Booking.findOne({
            where: { id, doctor_id },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'email', 'phone', 'birthday', 'gender', 'address'],
                    required: false
                },
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name', 'price'],
                    required: false
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name'],
                    required: false
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn' });
        }

        // Format lại data giống như appointments list
        const formattedBooking = {
            id: booking.id,
            booking_code: booking.booking_code,
            patient_id: booking.patient_id || booking.patient?.id,
            patient_name: booking.patient_name || booking.patient?.full_name,
            patient_phone: booking.patient_phone || booking.patient?.phone,
            patient_email: booking.patient_email || booking.patient?.email,
            patient_gender: booking.patient_gender || booking.patient?.gender,
            patient_dob: booking.patient_dob || booking.patient?.birthday,
            patient_address: booking.patient_address || booking.patient?.address,
            appointment_date: booking.appointment_date,
            appointment_time: booking.appointment_time,
            symptoms: booking.symptoms,
            diagnosis: booking.diagnosis,
            conclusion: booking.conclusion,
            note: booking.note,
            status: booking.status,
            service: booking.service,
            specialty: booking.specialty
        };

        res.json({ success: true, booking: formattedBooking });
    } catch (error) {
        console.error('❌ Error getting booking:', error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
});

// PUT - Xác nhận lịch hẹn
router.put('/appointments/:id/confirm', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        console.log(`✅ PUT /api/doctor/appointments/${id}/confirm`);

        const appointment = await Booking.findByPk(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        if (appointment.status === 'confirmed') {
            return res.status(400).json({ message: 'Lịch hẹn đã được xác nhận' });
        }

        await appointment.update({
            status: 'confirmed',
            update_at: new Date()
        });

        console.log(`✅ Appointment ${id} confirmed`);

        res.json({
            message: 'Xác nhận lịch hẹn thành công',
            appointment
        });
    } catch (error) {
        console.error('❌ Error confirming appointment:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// PUT - Hủy lịch hẹn
router.put('/appointments/:id/cancel', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        console.log(`❌ PUT /api/doctor/appointments/${id}/cancel`);

        const appointment = await Booking.findByPk(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await appointment.update({
            status: 'cancelled',
            update_at: new Date()
        });

        console.log(`✅ Appointment ${id} cancelled`);

        res.json({
            message: 'Hủy lịch hẹn thành công',
            appointment
        });
    } catch (error) {
        console.error('❌ Error cancelling appointment:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// PUT - Hoàn thành khám
router.put('/appointments/:id/complete', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnosis, prescription, notes } = req.body;

        console.log(`✅ PUT /api/doctor/appointments/${id}/complete`);

        const appointment = await Booking.findByPk(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await appointment.update({
            status: 'completed',
            updated_at: new Date()
        });

        console.log(`✅ Appointment ${id} completed`);

        res.json({
            message: 'Hoàn thành khám bệnh',
            appointment
        });
    } catch (error) {
        console.error('❌ Error completing appointment:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// ✅ PUT - Từ chối lịch hẹn
router.put('/appointments/:id/reject', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, reject_reason } = req.body;

        const appointment = await Booking.findByPk(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await appointment.update({
            status: 'doctor_rejected',
            reject_reason: reject_reason || reason,

            updated_at: new Date()
        });

        res.json({
            success: true,
            message: 'Đã từ chối lịch hẹn',
            appointment
        });
    } catch (error) {
        console.error('❌ Error rejecting appointment:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// ✅ PUT - Lưu kết quả khám (chẩn đoán, kết luận)
router.put('/appointments/:id/exam', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnosis, conclusion, note } = req.body;

        const appointment = await Booking.findByPk(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await appointment.update({
            diagnosis,
            conclusion,
            note,
            updated_at: new Date()
        });

        res.json({
            success: true,
            message: 'Đã lưu kết quả khám',
            appointment
        });
    } catch (error) {
        console.error('❌ Error saving exam:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// GET - Lấy đánh giá của bác sĩ
router.get('/reviews', verifyToken, checkDoctorRole, doctorReviewController.getDoctorReviews);

// GET - Thống kê rating của bác sĩ
router.get('/rating-stats', verifyToken, checkDoctorRole, doctorReviewController.getDoctorRatingStats);

// POST - Bác sĩ phản hồi đánh giá
router.post('/reviews/:review_id/reply', verifyToken, checkDoctorRole, doctorReviewController.replyToReview);

// PUT - Bác sĩ sửa phản hồi
router.put('/reviews/:review_id/reply', verifyToken, checkDoctorRole, doctorReviewController.updateReply);

// DELETE - Bác sĩ xóa phản hồi
router.delete('/reviews/:review_id/reply', verifyToken, checkDoctorRole, doctorReviewController.deleteReply);

// ========== WALK-IN (Khám trực tiếp) ==========
// POST - Tạo bệnh nhân walk-in và booking
router.post('/walk-in', verifyToken, checkDoctorRole, doctorWalkInController.createWalkInPatient);

// GET - Tìm bệnh nhân theo SĐT
router.get('/search-patient', verifyToken, checkDoctorRole, doctorWalkInController.searchPatientByPhone);

// GET - Danh sách walk-in hôm nay
router.get('/walk-in/today', verifyToken, checkDoctorRole, doctorWalkInController.getTodayWalkIns);

// GET - Lịch sử khám của bệnh nhân
router.get('/patient-history/:patient_id', verifyToken, checkDoctorRole, doctorWalkInController.getPatientHistory);

module.exports = router;