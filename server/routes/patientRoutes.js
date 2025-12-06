const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { Booking, Service, Specialty } = require('../models');
const { Op } = require('sequelize');

// Middleware kiểm tra role patient
const checkPatientRole = (req, res, next) => {
    if (req.user.role !== 'patient') {
        return res.status(403).json({ message: 'Chỉ bệnh nhân mới có quyền truy cập' });
    }
    next();
};

// GET - Lịch hẹn của bệnh nhân
router.get('/my-appointments', verifyToken, checkPatientRole, async (req, res) => {
    try {
        const patient_id = req.user.id;
        const { status } = req.query;

        console.log('📋 GET /api/patient/my-appointments', { patient_id, status });

        let whereClause = { patient_id };

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        const appointments = await Booking.findAll({
            where: whereClause,
            include: [
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name', 'description', 'price', 'duration'],
                    include: [
                        {
                            model: Specialty,
                            as: 'specialty',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [
                ['appointment_date', 'DESC'],
                ['appointment_hour', 'DESC']
            ]
        });

        console.log(`✅ Found ${appointments.length} appointments`);

        res.json(appointments);
    } catch (error) {
        console.error('❌ Error fetching appointments:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// PUT - Hủy lịch hẹn
router.put('/my-appointments/:id/cancel', verifyToken, checkPatientRole, async (req, res) => {
    try {
        const { id } = req.params;
        const patient_id = req.user.id;

        console.log(`❌ PUT /api/patient/my-appointments/${id}/cancel`);

        const appointment = await Booking.findOne({
            where: {
                id,
                patient_id
            },
            include: [
                { model: Service, as: 'service' },
                { model: Specialty, as: 'specialty' }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Lịch hẹn đã được hủy' });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ message: 'Không thể hủy lịch hẹn đã hoàn thành' });
        }

        await appointment.update({
            status: 'cancelled',
            update_at: new Date()
        });

        // Gửi email thông báo hủy lịch
        if (appointment.patient_email) {
            const emailService = require('../services/emailService');
            const appointmentData = {
                patient_name: appointment.patient_name,
                patient_email: appointment.patient_email,
                booking_code: appointment.booking_code,
                appointment_date: appointment.appointment_date,
                appointment_time: appointment.appointment_time || 'Chưa xác định',
                specialty_name: appointment.specialty?.name || 'Chưa xác định'
            };
            emailService.sendCancellationEmail(appointmentData).catch(err =>
                console.error('❌ Failed to send cancellation email:', err)
            );
        }

        console.log(`✅ Appointment ${id} cancelled by patient`);

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

// PUT - Đổi thời gian lịch hẹn
router.put('/my-appointments/:id/reschedule', verifyToken, checkPatientRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { new_date, new_time } = req.body;
        const patient_id = req.user.id;

        console.log(`🔄 PUT /api/patient/my-appointments/${id}/reschedule`, { new_date, new_time });

        if (!new_date || !new_time) {
            return res.status(400).json({ message: 'Vui lòng chọn ngày và giờ mới' });
        }

        // ✅ Validate ngày không được là quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(new_date + 'T00:00:00');
        if (selectedDate < today) {
            return res.status(400).json({ message: 'Không thể đổi sang ngày trong quá khứ' });
        }

        const appointment = await Booking.findOne({
            where: {
                id,
                patient_id
            },
            include: [
                { model: Service, as: 'service' },
                { model: Specialty, as: 'specialty' }
            ]
        });

        if (!appointment) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Không thể đổi lịch đã hủy' });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ message: 'Không thể đổi lịch đã hoàn thành' });
        }

        // Kiểm tra xung đột nếu có doctor_id
        if (appointment.doctor_id) {
            const conflict = await Booking.findOne({
                where: {
                    doctor_id: appointment.doctor_id,
                    appointment_date: new_date,
                    appointment_time: new_time,
                    status: { [Op.notIn]: ['cancelled', 'doctor_rejected'] },
                    id: { [Op.ne]: id }
                }
            });

            if (conflict) {
                return res.status(400).json({
                    message: 'Khung giờ này đã có người đặt. Vui lòng chọn giờ khác.'
                });
            }
        }

        const oldDate = appointment.appointment_date;
        const oldTime = appointment.appointment_time;

        await appointment.update({
            appointment_date: new_date,
            appointment_time: new_time,
            status: 'waiting_doctor_confirmation', // Cần bác sĩ xác nhận lại
            updated_at: new Date()
        });

        // Gửi email thông báo đổi lịch
        if (appointment.patient_email) {
            const emailService = require('../services/emailService');
            const appointmentData = {
                patient_name: appointment.patient_name,
                patient_email: appointment.patient_email,
                booking_code: appointment.booking_code,
                old_date: oldDate,
                old_time: oldTime || 'Chưa xác định',
                appointment_date: new_date,
                appointment_time: new_time,
                specialty_name: appointment.specialty?.name || 'Chưa xác định'
            };
            emailService.sendRescheduleEmail(appointmentData).catch(err =>
                console.error('❌ Failed to send reschedule email:', err)
            );
        }

        console.log(`✅ Appointment ${id} rescheduled`);

        res.json({
            success: true,
            message: 'Đổi lịch thành công! Vui lòng đợi bác sĩ xác nhận.',
            appointment
        });
    } catch (error) {
        console.error('❌ Error rescheduling appointment:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;