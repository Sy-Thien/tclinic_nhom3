const { Booking, Patient, Specialty, MedicalHistory, Prescription, DoctorSchedule, Service } = require('../models');
const { Op } = require('sequelize');

// ✅ NEW: Doctor - Lấy TẤT CẢ bệnh nhân đã từng khám với bác sĩ này
exports.getMyPatients = async (req, res) => {
    try {
        const doctor_id = req.user.doctor_id || req.user.id;
        console.log('👥 GET my patients for doctor:', doctor_id);

        // Lấy tất cả booking của bác sĩ này (không giới hạn ngày)
        const bookings = await Booking.findAll({
            where: {
                doctor_id,
                status: { [Op.in]: ['completed', 'confirmed', 'pending', 'waiting_doctor_confirmation'] }
            },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday', 'address'],
                    required: false
                }
            ],
            order: [['appointment_date', 'DESC']]
        });

        // Tạo map bệnh nhân unique
        const patientMap = new Map();

        bookings.forEach(booking => {
            const patientId = booking.patient?.id || booking.patient_id;
            // ✅ ƯU TIÊN dùng patient_name từ booking (tên thực tế khi đặt lịch)
            // vì có thể user đăng nhập đặt hộ người khác
            const patientName = booking.patient_name || booking.patient?.full_name;

            if (!patientId && !patientName) return;

            // ✅ Dùng patient_name làm key để phân biệt các bệnh nhân khác nhau
            const key = patientName || patientId;

            if (patientMap.has(key)) {
                const existing = patientMap.get(key);
                existing.visitCount++;
                // Cập nhật lần khám gần nhất
                if (new Date(booking.appointment_date) > new Date(existing.lastVisit)) {
                    existing.lastVisit = booking.appointment_date;
                    existing.lastDiagnosis = booking.diagnosis;
                }
            } else {
                patientMap.set(key, {
                    id: patientId,
                    full_name: patientName || 'N/A',
                    // ✅ Ưu tiên thông tin từ booking (người khám thực tế)
                    phone: booking.patient_phone || booking.patient?.phone || '',
                    email: booking.patient_email || booking.patient?.email || '',
                    gender: booking.patient_gender || booking.patient?.gender || '',
                    birthday: booking.patient_dob || booking.patient?.birthday || '',
                    address: booking.patient_address || booking.patient?.address || '',
                    visitCount: 1,
                    lastVisit: booking.appointment_date,
                    lastDiagnosis: booking.diagnosis
                });
            }
        });

        // Chuyển thành array
        const patients = Array.from(patientMap.values())
            .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));

        console.log(`✅ Found ${patients.length} unique patients for doctor ${doctor_id}`);
        console.log('📋 Patients list:', patients.map(p => `${p.full_name} (${p.lastVisit})`));

        res.json({
            success: true,
            patients,
            total: patients.length
        });

    } catch (error) {
        console.error('❌ Get my patients error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Doctor - Lấy lịch làm việc định kỳ
exports.getWorkSchedule = async (req, res) => {
    try {
        const doctor_id = req.user.doctor_id || req.user.id;
        console.log('📅 GET work schedule for doctor:', doctor_id);

        if (!DoctorSchedule) {
            console.error('❌ DoctorSchedule model is undefined!');
            return res.status(500).json({ message: 'DoctorSchedule model not loaded' });
        }

        const schedules = await DoctorSchedule.findAll({
            where: { doctor_id },
            order: [
                ['day_of_week', 'ASC']
            ]
        });

        console.log('✅ Found schedules:', schedules.length);

        // Sắp xếp theo thứ tự thực tế (Thứ 2 trước, Chủ nhật cuối)
        const dayOrder = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
        schedules.sort((a, b) => dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week));

        res.json({ schedules });

    } catch (error) {
        console.error('❌ Get work schedule error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Lỗi server', error: error.message, stack: error.stack });
    }
};

// Doctor - Lấy danh sách booking được gán
exports.getMyAppointments = async (req, res) => {
    try {
        const doctor_id = req.user.doctor_id || req.user.id;
        const { date, status, start_date, end_date, realtime } = req.query;

        const where = { doctor_id };

        // 🔥 REALTIME MODE: Chỉ lấy appointments ĐÚNG GIỜ HIỆN TẠI (± 30 phút)
        if (realtime === 'true') {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const currentTime = now.toTimeString().substring(0, 5); // HH:mm

            // Tính khoảng thời gian ± 30 phút
            const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
            const startMinutes = Math.max(0, currentMinutes - 30);
            const endMinutes = Math.min(1439, currentMinutes + 30); // 23:59 = 1439 minutes

            const startTime = String(Math.floor(startMinutes / 60)).padStart(2, '0') + ':' +
                String(startMinutes % 60).padStart(2, '0');
            const endTime = String(Math.floor(endMinutes / 60)).padStart(2, '0') + ':' +
                String(endMinutes % 60).padStart(2, '0');

            where.appointment_date = todayStr;
            where.appointment_time = {
                [Op.between]: [startTime, endTime]
            };

            console.log('🔥 REALTIME MODE: Current time:', currentTime);
            console.log('🔥 Showing appointments between', startTime, '-', endTime);
        }
        // Mặc định: hiển thị tất cả lịch HÔM NAY
        else if (date) {
            where.appointment_date = date;
        } else if (start_date && end_date) {
            where.appointment_date = {
                [Op.between]: [start_date, end_date]
            };
        } else {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            where.appointment_date = todayStr;
            console.log('📅 Default mode: Showing all appointments for TODAY:', todayStr);
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
                    model: Service,
                    as: 'service',
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
            where: { id, doctor_id },
            include: [{
                model: Service,
                as: 'service',
                attributes: ['id', 'name', 'price']
            }]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        // ✅ Calculate total price from service
        const servicePrice = booking.service?.price || booking.price || 0;

        await booking.update({
            status: 'completed',
            diagnosis: diagnosis || booking.diagnosis,
            conclusion: conclusion || booking.conclusion,
            price: servicePrice  // ✅ Update price when completed
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
