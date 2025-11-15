const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
    Doctor,
    Patient,
    Specialty,
    Appointment,
    Service,
    Room,
    Drug
} = require('../models');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// ========== DOCTORS ==========
// GET - Lấy danh sách tất cả bác sĩ
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.findAll({
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }],
            where: { active: true },
            order: [['create_at', 'DESC']]
        });
        res.json(doctors);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST - Thêm bác sĩ mới
router.post('/doctors', async (req, res) => {
    try {
        const doctor = await Doctor.create(req.body);
        res.status(201).json(doctor);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Lỗi khi tạo bác sĩ' });
    }
});

// PUT - Cập nhật thông tin bác sĩ
router.put('/doctors/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Không tìm thấy' });
        await doctor.update(req.body);
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật' });
    }
});

// DELETE - Xóa bác sĩ
router.delete('/doctors/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ message: 'Không tìm thấy' });
        await doctor.update({ active: false });
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa' });
    }
});

// ========== PATIENTS ==========
// GET - Lấy danh sách bệnh nhân
router.get('/patients', async (req, res) => {
    try {
        const patients = await Patient.findAll({
            order: [['create_at', 'DESC']]
        });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST - Thêm bệnh nhân mới
router.post('/patients', async (req, res) => {
    try {
        const patient = await Patient.create(req.body);
        res.status(201).json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo bệnh nhân' });
    }
});

// PUT - Cập nhật thông tin bệnh nhân
router.put('/patients/:id', async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Không tìm thấy' });
        await patient.update(req.body);
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật' });
    }
});

// DELETE - Xóa bệnh nhân (soft delete - chuyển status = inactive)
router.delete('/patients/:id', async (req, res) => {
    try {
        await Patient.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa' });
    }
});

// ========== SPECIALTIES ==========
// GET - Lấy danh sách chuyên khoa
router.get('/specialties', async (req, res) => {
    try {
        const specialties = await Specialty.findAll({
            order: [['name', 'ASC']]
        });
        res.json(specialties);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== APPOINTMENTS ==========
router.get('/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.findAll({
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'name', 'phone'] },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'name'],
                    include: [{ model: Specialty, as: 'specialty', attributes: ['name'] }]
                }
            ],
            order: [['date', 'DESC'], ['appointment_time', 'DESC']]
        });
        res.json(appointments);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ========== DASHBOARD STATS ==========
router.get('/dashboard/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');

        const [totalPatients, totalDoctors, todayAppointments, pendingAppointments] = await Promise.all([
            Patient.count(),
            Doctor.count({ where: { active: true } }),
            Appointment.count({ where: { date: today } }),
            Appointment.count({ where: { status: 'pending' } })
        ]);

        res.json({
            totalPatients,
            totalDoctors,
            todayAppointments,
            pendingAppointments
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;