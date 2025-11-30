const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const publicController = require('../controllers/publicController');

let Specialty, Service, Booking, Patient, Doctor, Drug, DoctorSchedule, Room, TimeSlot;
try {
    const models = require('../models');
    Specialty = models.Specialty;
    Service = models.Service;
    Booking = models.Booking;
    Patient = models.Patient;
    Doctor = models.Doctor;
    Drug = models.Drug;
    DoctorSchedule = models.DoctorSchedule;
    Room = models.Room;
    TimeSlot = models.TimeSlot;
    console.log('✅ Models loaded in publicRoutes');
} catch (error) {
    console.error('❌ Cannot load models:', error.message);
}

// ✅ NEW: Home page APIs
router.get('/home-stats', publicController.getHomeStats);
router.get('/featured-doctors', publicController.getFeaturedDoctors);
router.get('/testimonials', publicController.getTestimonials);
router.get('/popular-specialties', publicController.getPopularSpecialties);
router.get('/specialties-with-doctors', publicController.getSpecialtiesWithDoctors);

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

// ✅ GET - Danh sách dịch vụ (tất cả)
router.get('/services', async (req, res) => {
    try {
        const { specialty_id, search } = req.query;
        console.log(`📋 GET /api/public/services`, { specialty_id, search });

        if (!Service) {
            return res.status(500).json({ message: 'Models not loaded' });
        }

        let whereClause = {};
        if (specialty_id) {
            whereClause.specialty_id = specialty_id;
        }
        if (search) {
            whereClause.name = { [Op.like]: `%${search}%` };
        }

        const services = await Service.findAll({
            where: whereClause,
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            attributes: ['id', 'name', 'description', 'price', 'duration', 'specialty_id'],
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

// ✅ GET - Chi tiết dịch vụ
router.get('/services/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 GET /api/public/services/${id}`);

        if (!Service) {
            return res.status(500).json({ message: 'Models not loaded' });
        }

        const service = await Service.findByPk(id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name', 'description']
                }
            ],
            attributes: ['id', 'name', 'description', 'price', 'duration', 'specialty_id']
        });

        if (!service) {
            return res.status(404).json({ message: 'Không tìm thấy dịch vụ' });
        }

        console.log(`✅ Found service: ${service.name}`);
        res.json(service);
    } catch (error) {
        console.error('❌ Error fetching service:', error);
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

        // ✅ Thêm rating mặc định và specialty_name
        const doctorsWithRating = doctors.map(doc => {
            const jsonDoc = doc.toJSON();
            return {
                ...jsonDoc,
                specialty_name: jsonDoc.specialty?.name || null,
                experience_years: jsonDoc.experience || null,
                bio: jsonDoc.description || null,
                rating: doc.rating || 0
            };
        });

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

        // ✅ Map dữ liệu cho frontend
        const jsonDoc = doctor.toJSON();
        const doctorWithRating = {
            ...jsonDoc,
            specialty_name: jsonDoc.specialty?.name || null,
            experience_years: jsonDoc.experience || null,
            bio: jsonDoc.description || null,
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

// ✅ GET - Lịch làm việc của bác sĩ (14 ngày tới)
router.get('/doctors/:id/schedule', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📋 GET /api/public/doctors/${id}/schedule`);

        if (!TimeSlot) {
            return res.status(500).json({ message: 'TimeSlot model not loaded' });
        }

        // Lấy lịch từ hôm nay đến 14 ngày tới
        const today = new Date().toISOString().split('T')[0];
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
        const endDate = twoWeeksLater.toISOString().split('T')[0];

        const timeSlots = await TimeSlot.findAll({
            where: {
                doctor_id: id,
                date: {
                    [Op.between]: [today, endDate]
                },
                is_available: true
            },
            include: [
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name', 'location'],
                    required: false
                }
            ],
            order: [['date', 'ASC'], ['start_time', 'ASC']]
        });

        const scheduleData = timeSlots.map(slot => ({
            id: slot.id,
            work_date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            room_name: slot.room ? slot.room.name : null,
            room_location: slot.room ? slot.room.location : null,
            max_patients: slot.max_patients,
            current_patients: slot.current_patients,
            available_slots: slot.max_patients - slot.current_patients
        }));

        console.log(`✅ Found ${scheduleData.length} time slots for doctor ${id}`);
        res.json(scheduleData);
    } catch (error) {
        console.error('❌ Error fetching doctor schedule:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// ✅ GET - Danh sách thuốc (public access cho doctor prescription)
router.get('/drugs', async (req, res) => {
    try {
        console.log('📋 GET /api/public/drugs');

        if (!Drug) {
            return res.status(500).json({ message: 'Models not loaded' });
        }

        const drugs = await Drug.findAll({
            attributes: ['id', 'name', 'description', 'unit', 'price', 'stock_quantity'],
            where: {
                stock_quantity: { [Op.gt]: 0 }  // Chỉ lấy thuốc còn hàng
            },
            order: [['name', 'ASC']]
        });

        console.log(`✅ Found ${drugs.length} drugs in stock`);
        res.json({ drugs });
    } catch (error) {
        console.error('❌ Error fetching drugs:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

module.exports = router;