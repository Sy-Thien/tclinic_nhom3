const { Booking, Patient, Specialty, Appointment } = require('../models');
const { Op } = require('sequelize');

// Doctor - Lấy danh sách booking được gán
exports.getMyAppointments = async (req, res) => {
    try {
        const doctor_id = req.user.id;
        const { date, status } = req.query;

        const where = { doctor_id };

        if (date) {
            where.appointment_date = date;
        }

        if (status) {
            where.status = status;
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
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email'],
                    required: false
                }
            ],
            order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']]
        });

        res.json({ bookings });

    } catch (error) {
        console.error('❌ Get doctor appointments error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Doctor - Xem chi tiết booking
exports.getBookingDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor_id = req.user.id;

        const booking = await Booking.findOne({
            where: { id, doctor_id },
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                },
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email', 'address', 'gender', 'birthday'],
                    required: false
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        res.json({ booking });

    } catch (error) {
        console.error('❌ Get booking detail error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Doctor - Cập nhật trạng thái và thêm chẩn đoán
exports.updateBookingDiagnosis = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor_id = req.user.id;
        const { status, diagnosis, conclusion, note } = req.body;

        const booking = await Booking.findOne({
            where: { id, doctor_id }
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        // Update booking
        await booking.update({
            status: status || booking.status,
            diagnosis: diagnosis || booking.diagnosis,
            conclusion: conclusion || booking.conclusion,
            note: note || booking.note
        });

        // Nếu có chẩn đoán, lưu vào bảng appointment_records hoặc medical_records
        // (Tùy vào cấu trúc database của bạn)

        console.log('✅ Booking updated:', booking.id);

        res.json({
            message: 'Cập nhật thành công',
            booking
        });

    } catch (error) {
        console.error('❌ Update booking diagnosis error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Doctor - Xác nhận tiếp nhận bệnh nhân
exports.confirmAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor_id = req.user.id;

        const booking = await Booking.findOne({
            where: { id, doctor_id }
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await booking.update({ status: 'confirmed' });

        res.json({ message: 'Đã xác nhận tiếp nhận', booking });

    } catch (error) {
        console.error('❌ Confirm appointment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Doctor - Hoàn thành khám
exports.completeAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor_id = req.user.id;
        const { diagnosis, conclusion, prescription } = req.body;

        const booking = await Booking.findOne({
            where: { id, doctor_id }
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        await booking.update({
            status: 'completed',
            diagnosis: diagnosis || booking.diagnosis,
            conclusion: conclusion || booking.conclusion
        });

        res.json({ message: 'Hoàn thành khám bệnh', booking });

    } catch (error) {
        console.error('❌ Complete appointment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = exports;
