const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { Booking, Patient, Service, Specialty } = require('../models');
const { Op } = require('sequelize');

// Middleware kiểm tra role doctor
const checkDoctorRole = (req, res, next) => {
    if (req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Chỉ bác sĩ mới có quyền truy cập' });
    }
    next();
};

// GET - Danh sách lịch hẹn của bác sĩ
router.get('/appointments', verifyToken, checkDoctorRole, async (req, res) => {
    try {
        const { status, date } = req.query;
        const doctor_id = req.user.doctor_id;

        console.log('📋 GET /api/doctor/appointments', { doctor_id, status, date });

        let whereClause = {};

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
                    attributes: ['id', 'name', 'email', 'phone', 'birthday', 'gender', 'address']
                },
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
                ['appointment_date', 'ASC'],
                ['appointment_hour', 'ASC']
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
            update_at: new Date()
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

module.exports = router;