const { Booking, Patient, Doctor, Specialty, Service } = require('../models');
const { Op } = require('sequelize');

// Patient - Tạo booking mới
exports.createBooking = async (req, res) => {
    try {
        const {
            patient_name,
            patient_email,
            patient_phone,
            patient_gender,
            patient_dob,
            patient_address,
            specialty_id,
            doctor_id,
            appointment_date,
            appointment_time,
            symptoms,
            note
        } = req.body;

        // Validate required fields
        if (!patient_name || !patient_phone || !specialty_id || !appointment_date || !symptoms) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        // Generate booking code
        const bookingCode = 'BK' + Date.now().toString().slice(-8);

        // Get patient_id if logged in
        const patient_id = req.user ? req.user.id : null;

        // Create booking
        const booking = await Booking.create({
            patient_id,
            booking_code: bookingCode,
            patient_name,
            patient_email,
            patient_phone,
            patient_gender: patient_gender || 'other',
            patient_dob,
            patient_address,
            specialty_id,
            service_id: 1, // Default service
            doctor_id: doctor_id || null,
            appointment_date,
            appointment_time,
            position: null,
            symptoms,
            note,
            status: 'pending',
            price: 0
        });

        console.log('✅ Booking created:', booking.id);

        res.status(201).json({
            message: 'Đặt lịch thành công',
            booking: {
                id: booking.id,
                booking_code: booking.booking_code,
                appointment_date: booking.appointment_date,
                appointment_time: booking.appointment_time,
                status: booking.status
            }
        });

    } catch (error) {
        console.error('❌ Create booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Patient - Lấy danh sách booking của mình
exports.getMyBookings = async (req, res) => {
    try {
        const patient_id = req.user.id;

        const bookings = await Booking.findAll({
            where: { patient_id },
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'phone']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({ bookings });

    } catch (error) {
        console.error('❌ Get my bookings error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy giờ làm việc của bác sĩ theo ngày
exports.getDoctorAvailableSlots = async (req, res) => {
    try {
        const { doctor_id, date } = req.query;

        if (!doctor_id || !date) {
            return res.status(400).json({ message: 'Thiếu thông tin doctor_id hoặc date' });
        }

        // Lấy các booking đã có của bác sĩ trong ngày
        const existingBookings = await Booking.findAll({
            where: {
                doctor_id,
                appointment_date: date,
                status: { [Op.notIn]: ['cancelled'] }
            },
            attributes: ['appointment_time']
        });

        const bookedSlots = existingBookings.map(b => b.appointment_time);

        // Tạo các slot giờ làm việc (8:00 - 17:00, mỗi slot 30 phút)
        const allSlots = [];
        for (let hour = 8; hour < 17; hour++) {
            allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
        }

        // Lọc các slot còn trống
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        res.json({ availableSlots, bookedSlots });

    } catch (error) {
        console.error('❌ Get available slots error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy danh sách bác sĩ theo chuyên khoa
exports.getDoctorsBySpecialty = async (req, res) => {
    try {
        const { specialty_id } = req.query;

        const where = specialty_id ? { specialty_id, is_active: true } : { is_active: true };

        const doctors = await Doctor.findAll({
            where,
            include: [{
                model: Specialty,
                as: 'specialty',
                attributes: ['id', 'name']
            }],
            attributes: ['id', 'full_name', 'experience', 'education']
        });

        res.json({ doctors });

    } catch (error) {
        console.error('❌ Get doctors error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = exports;
