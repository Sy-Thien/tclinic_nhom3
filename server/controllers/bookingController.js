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
            service_id,  // ✅ NEW: Service ID from URL
            doctor_id,
            appointment_date,
            appointment_time,
            symptoms,
            note,
            booking_type  // 'instant' (đặt luôn) hoặc 'with_doctor' (chọn bác sĩ)
        } = req.body;

        // Validate required fields
        if (!patient_name || !patient_phone || !specialty_id || !appointment_date || !symptoms) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }

        // ✅ Validate specialty tồn tại
        const specialty = await Specialty.findByPk(specialty_id);
        if (!specialty) {
            return res.status(404).json({ message: 'Chuyên khoa không tồn tại' });
        }

        // ✅ Validate service nếu có
        if (service_id) {
            const service = await Service.findByPk(service_id);
            if (!service) {
                return res.status(404).json({ message: 'Dịch vụ không tồn tại' });
            }
            if (service.specialty_id && service.specialty_id !== Number(specialty_id)) {
                return res.status(400).json({ message: 'Dịch vụ không thuộc chuyên khoa được chọn' });
            }
        }

        // ✅ Validate ngày không được là quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(appointment_date + 'T00:00:00');
        if (selectedDate < today) {
            return res.status(400).json({ message: 'Không thể đặt lịch cho ngày trong quá khứ' });
        }

        // ✅ Validate giờ không quá khứ (nếu là hôm nay)
        if (appointment_time && selectedDate.toDateString() === today.toDateString()) {
            const [hours, minutes] = appointment_time.split(':').map(Number);
            const appointmentMinutes = hours * 60 + minutes;
            const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes() + 30; // +30 phút buffer

            if (appointmentMinutes < currentMinutes) {
                return res.status(400).json({
                    message: `Không thể đặt lịch cho giờ ${appointment_time} (đã qua). Vui lòng chọn giờ sau ${Math.floor(currentMinutes / 60)}:${String(currentMinutes % 60).padStart(2, '0')}.`
                });
            }
        }

        // Generate booking code
        const bookingCode = 'BK' + Date.now().toString().slice(-8);

        // Get patient_id if logged in AND exists in database
        let patient_id = null;
        if (req.user && req.user.id) {
            const patientExists = await Patient.findByPk(req.user.id);
            if (patientExists) {
                patient_id = req.user.id;
            }
        }

        // ✅ RÀNG BUỘC 1: Không cho đặt trùng ngày cho cùng bệnh nhân
        if (patient_id) {
            const existingPatientBooking = await Booking.findOne({
                where: {
                    patient_id: patient_id,
                    appointment_date: appointment_date,
                    status: { [Op.in]: ['pending', 'confirmed', 'waiting_doctor_assignment', 'waiting_doctor_confirmation'] }
                }
            });

            if (existingPatientBooking) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã có lịch hẹn trong ngày này. Vui lòng chọn ngày khác hoặc hủy lịch cũ trước.',
                    existing_booking: {
                        id: existingPatientBooking.id,
                        booking_code: existingPatientBooking.booking_code,
                        time: existingPatientBooking.appointment_time
                    }
                });
            }
        }

        // ✅ RÀNG BUỘC 2: Giới hạn tối đa 3 booking tương lai
        if (patient_id) {
            const futureBookingsCount = await Booking.count({
                where: {
                    patient_id: patient_id,
                    appointment_date: { [Op.gte]: new Date() },
                    status: { [Op.in]: ['pending', 'confirmed', 'waiting_doctor_assignment', 'waiting_doctor_confirmation'] }
                }
            });

            if (futureBookingsCount >= 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã có 3 lịch hẹn chưa hoàn thành. Vui lòng hoàn tất hoặc hủy trước khi đặt lịch mới.',
                    future_bookings: futureBookingsCount
                });
            }
        }

        // ✅ Validate doctor nếu có
        if (doctor_id) {
            const doctor = await Doctor.findByPk(doctor_id);
            if (!doctor) {
                return res.status(404).json({ message: 'Bác sĩ không tồn tại' });
            }
            // Kiểm tra doctor có thuộc specialty không (nếu doctor có specialty_id)
            if (doctor.specialty_id && doctor.specialty_id !== Number(specialty_id)) {
                return res.status(400).json({ message: 'Bác sĩ không thuộc chuyên khoa được chọn' });
            }
        }

        // Xác định status dựa vào booking_type
        let status;
        if (booking_type === 'instant' || !doctor_id) {
            // Option 1: Đặt luôn (không chọn bác sĩ) → Chờ admin gán bác sĩ
            status = 'waiting_doctor_assignment';
        } else {
            // Option 2: Đặt bác sĩ cụ thể → Xác nhận ngay (đặt thẳng)
            status = 'confirmed';

            // ✅ Kiểm tra conflict: Cùng bác sĩ, cùng ngày, cùng giờ
            if (appointment_time) {
                const existingBooking = await Booking.findOne({
                    where: {
                        doctor_id,
                        appointment_date,
                        appointment_time,
                        status: {
                            [Op.notIn]: ['cancelled', 'doctor_rejected']
                        }
                    }
                });

                if (existingBooking) {
                    return res.status(400).json({
                        message: `Khung giờ ${appointment_time} ngày ${appointment_date} đã có người đặt. Vui lòng chọn giờ khác.`
                    });
                }
            }
        }

        // ✅ Get service price if service_id provided
        let servicePrice = 0;
        let actualServiceId = service_id || null;

        if (service_id) {
            const service = await Service.findByPk(service_id);
            if (service) {
                servicePrice = service.price || 0;
            }
        }

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
            service_id: actualServiceId,
            doctor_id: doctor_id || null,
            appointment_date,
            appointment_time,
            position: null,
            symptoms,
            note,
            status: status,
            price: servicePrice  // ✅ Save service price
        });

        console.log('✅ Booking created:', booking.id, 'Status:', status);

        // 🔔 Socket: Thông báo admin có lịch kám mới
        const { emitToRole, emitToUser: emitToUserSocket } = require('../services/socketService');
        emitToRole('admin', 'new_booking', {
            type: 'new_booking',
            title: '📅 Lịch hẹn mới',
            message: `${patient_name} vừa đặt lịch khám`,
            bookingId: booking.id,
            bookingCode: booking.booking_code
        });

        // Nếu có bác sĩ được chỉ định, thông báo cho bác sĩ
        if (doctor_id) {
            emitToUserSocket('doctor', doctor_id, 'new_appointment', {
                type: 'new_appointment',
                title: '🗓️ Lịch hẹn mới',
                message: `Bệnh nhân ${patient_name} đã đặt lịch khám`,
                bookingId: booking.id,
                bookingCode: booking.booking_code
            });
        }
        if (patient_email) {
            const emailService = require('../services/emailService');
            const specialty = await Specialty.findByPk(specialty_id);
            const appointmentData = {
                patient_name,
                patient_email,
                booking_code: bookingCode,
                appointment_date,
                appointment_time: appointment_time || 'Chưa xác định',
                specialty_name: specialty?.name || 'Chưa xác định'
            };
            emailService.sendBookingConfirmation(appointmentData).catch(err =>
                console.error('❌ Failed to send confirmation email:', err)
            );
        }

        res.status(201).json({
            message: doctor_id
                ? 'Đặt lịch thành công! Lịch hẹn của bạn đã được xác nhận.'
                : 'Đặt lịch thành công! Chúng tôi sẽ sắp xếp bác sĩ phù hợp cho bạn.',
            booking: {
                id: booking.id,
                booking_code: booking.booking_code,
                appointment_date: booking.appointment_date,
                appointment_time: booking.appointment_time,
                status: booking.status,
                doctor_assigned: !!doctor_id
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
        const userRole = req.user.role;

        console.log('📋 GET /api/customer/appointments', { patient_id, userRole });

        // ✅ FIX: Chỉ patient mới được xem
        if (userRole !== 'patient') {
            console.log('❌ Access denied - not a patient');
            return res.status(403).json({
                success: false,
                message: 'Chỉ bệnh nhân mới có thể xem lịch hẹn',
                bookings: []
            });
        }

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
                },
                {
                    model: Service,
                    as: 'service',
                    attributes: ['id', 'name', 'price'],
                    include: [
                        {
                            model: Specialty,
                            as: 'specialty',
                            attributes: ['id', 'name']
                        }
                    ]
                }
            ],
            order: [['id', 'ASC']]
        });

        // ✅ Map lại data để match frontend expectations
        const mappedBookings = bookings.map(booking => ({
            ...booking.toJSON(),
            service_name: booking.service?.name || 'Dịch vụ',
            specialty_name: booking.specialty?.name || 'Chuyên khoa',
            doctor_name: booking.doctor?.full_name || 'Chưa xác định',
            service_price: booking.service?.price || booking.price || 0,
            date: booking.appointment_date,
            appointment_time: booking.appointment_time || 'Chưa xác định',
            symptoms: booking.symptoms || ''
        }));

        res.json({ bookings: mappedBookings });

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
                status: { [Op.notIn]: ['cancelled', 'doctor_rejected'] }
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

// ✅ Cancel Booking
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const patient_id = req.user.id;

        const booking = await Booking.findOne({
            where: {
                id,
                patient_id
            }
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ message: 'Lịch hẹn đã được hủy' });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({ message: 'Không thể hủy lịch hẹn đã hoàn thành' });
        }

        await booking.update({
            status: 'cancelled',
            updated_at: new Date()
        });

        res.json({
            success: true,
            message: 'Hủy lịch hẹn thành công',
            booking
        });

    } catch (error) {
        console.error('❌ Cancel booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = exports;
