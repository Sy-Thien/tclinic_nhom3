const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

let Specialty, Service, Booking, Patient, Doctor;
try {
    const models = require('../models');
    Specialty = models.Specialty;
    Service = models.Service;
    Booking = models.Booking;
    Patient = models.Patient;
    Doctor = models.Doctor;
    console.log('✅ Models loaded in publicRoutes');
} catch (error) {
    console.error('❌ Cannot load models:', error.message);
}

// GET - Danh sách chuyên khoa
router.get('/specialties', async (req, res) => {
    try {
        console.log('📋 GET /api/public/specialties');

        if (!Specialty) {
            return res.status(500).json({ message: 'Models not loaded' });
        }

        const specialties = await Specialty.findAll({
            attributes: ['id', 'name', 'description'],
            order: [['name', 'ASC']]
        });

        console.log(`✅ Found ${specialties.length} specialties`);
        res.json(specialties);
    } catch (error) {
        console.error('❌ Error fetching specialties:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// ✅ GET - Danh sách dịch vụ (tất cả hoặc theo chuyên khoa)
router.get('/services/:specialtyId?', async (req, res) => {
    try {
        const { specialtyId } = req.params;
        console.log(`📋 GET /api/public/services${specialtyId ? '/' + specialtyId : ''}`);

        if (!Service) {
            return res.status(500).json({ message: 'Models not loaded' });
        }

        let whereClause = {};
        if (specialtyId && specialtyId !== 'undefined') {
            whereClause.specialty_id = specialtyId;
        }

        const services = await Service.findAll({
            where: whereClause,
            attributes: ['id', 'name', 'description', 'price', 'duration'],
            order: [['name', 'ASC']]
        });

        console.log(`✅ Found ${services.length} services`);
        res.json(services);
    } catch (error) {
        console.error('❌ Error fetching services:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// POST - Đặt lịch khám
router.post('/booking', async (req, res) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 POST /api/public/booking');
    console.log('Body:', req.body);

    try {
        if (!Booking || !Service) {
            console.error('❌ Models not loaded');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        const {
            name,
            email,
            phone,
            birthday,
            gender,
            address,
            service_id,
            appointment_date,
            appointment_time,
            symptoms
        } = req.body;

        // Lấy patient_id từ token (nếu có)
        const token = req.headers.authorization?.split(' ')[1];
        let patient_id = null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                console.log('🔓 Token decoded:', decoded);
                if (decoded.role === 'patient') {
                    patient_id = decoded.id;
                }
            } catch (error) {
                console.log('⚠️ Token invalid:', error.message);
            }
        }

        // Validation
        if (!name || !phone || !service_id || !appointment_date || !appointment_time) {
            console.log('❌ Validation failed');
            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        console.log('✅ Validation passed');

        // Kiểm tra service tồn tại
        const service = await Service.findByPk(service_id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['name']
                }
            ]
        });

        if (!service) {
            console.log('❌ Service not found');
            return res.status(404).json({
                message: 'Dịch vụ không tồn tại'
            });
        }

        console.log('✅ Service found:', service.name);

        // Kiểm tra trùng lịch
        const existingBooking = await Booking.findOne({
            where: {
                appointment_date: appointment_date,
                appointment_time: appointment_time,
                service_id: service_id,
                status: { [Op.ne]: 'cancelled' }
            }
        });

        if (existingBooking) {
            console.log('❌ Time slot already booked');
            return res.status(400).json({
                message: 'Khung giờ này đã có người đặt. Vui lòng chọn giờ khác.'
            });
        }

        console.log('✅ Time slot available');

        // Tạo booking
        const booking = await Booking.create({
            patient_id: patient_id,
            service_id: service_id,
            appointment_date: appointment_date,
            appointment_time: appointment_time,
            status: 'pending'
        });

        console.log('✅ Booking created:', booking.id);

        res.status(201).json({
            message: `Đặt lịch thành công!`,
            booking: {
                id: booking.id,
                appointment_date: booking.appointment_date,
                appointment_time: booking.appointment_time,
                service: service.name,
                specialty: service.specialty?.name,
                price: service.price,
                status: booking.status
            }
        });

    } catch (error) {
        console.error('❌ Booking error:', error);
        console.error('Stack:', error.stack);

        res.status(500).json({
            message: 'Lỗi server. Vui lòng thử lại sau.',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET - Danh sách bác sĩ
router.get('/doctors', async (req, res) => {
    try {
        const { specialty_id, search } = req.query;
        console.log('📋 GET /api/public/doctors', { specialty_id, search });

        if (!Doctor) {
            return res.status(500).json({ message: 'Models not loaded' });
        }

        let whereClause = { is_active: true };

        // Lọc theo chuyên khoa
        if (specialty_id) {
            whereClause.specialty_id = specialty_id;
        }

        // Tìm kiếm theo tên
        if (search) {
            whereClause.full_name = { [Op.like]: `%${search}%` };
        }

        const doctors = await Doctor.findAll({
            where: whereClause,
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            attributes: ['id', 'full_name', 'email', 'phone', 'description', 'avatar', 'experience', 'specialty_id'],
            order: [['full_name', 'ASC']]
        });

        // ✅ Thêm rating mặc định (0 sao nếu không có review)
        const doctorsWithRating = doctors.map(doc => ({
            ...doc.toJSON(),
            rating: doc.rating || 0
        }));

        console.log(`✅ Found ${doctorsWithRating.length} doctors`);
        res.json(doctorsWithRating);
    } catch (error) {
        console.error('❌ Error fetching doctors:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// GET - Chi tiết bác sĩ
router.get('/doctors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 GET /api/public/doctors/${id}`);

        if (!Doctor) {
            return res.status(500).json({ message: 'Models not loaded' });
        }

        const doctor = await Doctor.findByPk(id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name', 'description']
                }
            ],
            attributes: ['id', 'full_name', 'email', 'phone', 'description', 'avatar', 'experience', 'education', 'specialty_id']
        });

        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        // ✅ Thêm rating mặc định
        const doctorWithRating = {
            ...doctor.toJSON(),
            rating: doctor.rating || 0
        };

        console.log(`✅ Found doctor:`, doctor.full_name);
        res.json(doctorWithRating);
    } catch (error) {
        console.error('❌ Error fetching doctor:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;