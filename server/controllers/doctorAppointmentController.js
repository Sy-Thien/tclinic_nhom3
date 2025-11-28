const { Booking, Patient, Specialty, Appointment, MedicalHistory, Prescription } = require('../models');
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

        // ✅ Tự động lưu vào lịch sử bệnh án
        const existingHistory = await MedicalHistory.findOne({
            where: { booking_id: id }
        });

        if (!existingHistory) {
            // Lấy prescription_id nếu có
            const prescriptionRecord = await Prescription.findOne({
                where: { booking_id: id }
            });

            await MedicalHistory.create({
                booking_id: booking.id,
                patient_id: booking.patient_id,
                doctor_id: doctor_id,
                visit_date: booking.appointment_date,
                visit_time: booking.appointment_time,
                symptoms: booking.symptoms,
                diagnosis: booking.diagnosis,
                conclusion: booking.conclusion,
                note: booking.note,
                prescription_id: prescriptionRecord ? prescriptionRecord.id : null
            });

            console.log('✅ Medical history auto-saved for booking:', id);
        }

        res.json({ message: 'Hoàn thành khám bệnh', booking });

    } catch (error) {
        console.error('❌ Complete appointment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Doctor - Xác nhận booking
exports.confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const doctor_id = req.user.id;

        const booking = await Booking.findOne({
            where: {
                id,
                doctor_id,
                status: 'waiting_doctor_confirmation'
            }
        });

        if (!booking) {
            return res.status(404).json({
                message: 'Không tìm thấy lịch hẹn hoặc lịch không cần xác nhận'
            });
        }

        await booking.update({ status: 'confirmed' });

        const updatedBooking = await Booking.findByPk(id, {
            include: [
                { model: Specialty, as: 'specialty', attributes: ['id', 'name'] },
                { model: Patient, as: 'patient', attributes: ['id', 'full_name', 'phone'], required: false }
            ]
        });

        console.log('✅ Doctor confirmed booking:', id);
        res.json({ message: 'Xác nhận lịch khám thành công!', booking: updatedBooking });

    } catch (error) {
        console.error('❌ Confirm booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Doctor - Từ chối booking
exports.rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reject_reason } = req.body;
        const doctor_id = req.user.id;

        if (!reject_reason || reject_reason.trim() === '') {
            return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });
        }

        const booking = await Booking.findOne({
            where: {
                id,
                doctor_id,
                status: { [Op.in]: ['waiting_doctor_confirmation', 'confirmed'] }
            }
        });

        if (!booking) {
            return res.status(404).json({
                message: 'Không tìm thấy lịch hẹn hoặc không thể từ chối'
            });
        }

        await booking.update({
            status: 'doctor_rejected',
            reject_reason
        });

        const updatedBooking = await Booking.findByPk(id, {
            include: [
                { model: Specialty, as: 'specialty', attributes: ['id', 'name'] },
                { model: Patient, as: 'patient', attributes: ['id', 'full_name', 'phone'], required: false }
            ]
        });

        console.log('❌ Doctor rejected booking:', id, 'Reason:', reject_reason);
        res.json({ message: 'Đã từ chối lịch khám', booking: updatedBooking });

    } catch (error) {
        console.error('❌ Reject booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = exports;
