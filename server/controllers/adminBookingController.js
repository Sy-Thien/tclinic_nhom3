const { Booking, Patient, Doctor, Specialty } = require('../models');
const { Op } = require('sequelize');

// Admin - Lấy tất cả booking
exports.getAllBookings = async (req, res) => {
    try {
        const { status, date, specialty_id, doctor_id, search } = req.query;

        const where = {};

        if (status) where.status = status;
        if (date) where.appointment_date = date;
        if (specialty_id) where.specialty_id = specialty_id;
        if (doctor_id) where.doctor_id = doctor_id;

        if (search) {
            where[Op.or] = [
                { patient_name: { [Op.like]: `%${search}%` } },
                { patient_phone: { [Op.like]: `%${search}%` } },
                { booking_code: { [Op.like]: `%${search}%` } }
            ];
        }

        const bookings = await Booking.findAll({
            where,
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                },
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'phone'],
                    required: false
                },
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({ bookings, total: bookings.length });

    } catch (error) {
        console.error('❌ Get all bookings error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin - Tạo booking mới
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
            note,
            status
        } = req.body;

        // Validate
        if (!patient_name || !patient_phone || !specialty_id || !appointment_date || !appointment_time) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        // Generate booking code
        const bookingCode = 'BK' + Date.now().toString().slice(-8);

        const booking = await Booking.create({
            booking_code: bookingCode,
            patient_name,
            patient_email,
            patient_phone,
            patient_gender: patient_gender || 'other',
            patient_dob,
            patient_address,
            specialty_id,
            service_id: 1,
            doctor_id: doctor_id || null,
            appointment_date,
            appointment_time,
            symptoms: symptoms || '',
            note,
            status: status || 'pending'
        });

        console.log('✅ Admin created booking:', booking.id);

        res.status(201).json({
            message: 'Tạo lịch khám thành công',
            booking
        });

    } catch (error) {
        console.error('❌ Admin create booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin - Cập nhật booking
exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const booking = await Booking.findByPk(id);

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await booking.update(updateData);

        console.log('✅ Admin updated booking:', booking.id);

        res.json({ message: 'Cập nhật thành công', booking });

    } catch (error) {
        console.error('❌ Admin update booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin - Gán bác sĩ cho booking
exports.assignDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctor_id } = req.body;

        if (!doctor_id) {
            return res.status(400).json({ message: 'Vui lòng chọn bác sĩ' });
        }

        const booking = await Booking.findByPk(id);

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await booking.update({
            doctor_id,
            status: 'confirmed'
        });

        console.log('✅ Admin assigned doctor to booking:', booking.id);

        res.json({ message: 'Gán bác sĩ thành công', booking });

    } catch (error) {
        console.error('❌ Admin assign doctor error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin - Hủy booking
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancel_reason } = req.body;

        const booking = await Booking.findByPk(id);

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await booking.update({
            status: 'cancelled',
            cancel_reason
        });

        console.log('✅ Admin cancelled booking:', booking.id);

        res.json({ message: 'Hủy lịch khám thành công', booking });

    } catch (error) {
        console.error('❌ Admin cancel booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin - Xóa booking
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findByPk(id);

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await booking.destroy();

        console.log('✅ Admin deleted booking:', id);

        res.json({ message: 'Xóa lịch khám thành công' });

    } catch (error) {
        console.error('❌ Admin delete booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = exports;
