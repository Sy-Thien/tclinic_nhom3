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
            }
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

module.exports = router;