const { Booking, Patient, Doctor, Specialty, DoctorSchedule } = require('../models');
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
            order: [['id', 'ASC']]
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

        // ✅ Validate ngày không được là quá khứ
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(appointment_date + 'T00:00:00');
        if (selectedDate < today) {
            return res.status(400).json({ message: 'Không thể đặt lịch cho ngày trong quá khứ' });
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

// Admin - Gán bác sĩ cho booking (chỉ gán bác sĩ có cùng chuyên khoa)
exports.assignDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctor_id } = req.body;

        if (!doctor_id) {
            return res.status(400).json({ message: 'Vui lòng chọn bác sĩ' });
        }

        const booking = await Booking.findByPk(id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        // Check xem bác sĩ có cùng chuyên khoa không
        const doctor = await Doctor.findByPk(doctor_id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        // Validate: bác sĩ phải có cùng chuyên khoa với booking
        if (doctor.specialty_id !== booking.specialty_id) {
            return res.status(400).json({
                message: `Bác sĩ này không có chuyên khoa ${booking.specialty?.name || 'được chọn'}. Bác sĩ này chuyên về ${doctor.specialty?.name || 'không xác định'}`
            });
        }

        await booking.update({
            doctor_id,
            status: 'confirmed'
        });

        console.log('✅ Admin assigned doctor to booking:', booking.id, 'Doctor:', doctor_id);

        res.json({
            message: 'Gán bác sĩ thành công',
            booking,
            doctor: {
                id: doctor.id,
                full_name: doctor.full_name,
                specialty: doctor.specialty?.name
            }
        });

    } catch (error) {
        console.error('❌ Admin assign doctor error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin - Lấy danh sách bác sĩ khả dụng cho booking (cùng chuyên khoa)
exports.getAvailableDoctorsForBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findByPk(id, {
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        // Lấy tất cả bác sĩ có cùng chuyên khoa
        const doctors = await Doctor.findAll({
            where: {
                specialty_id: booking.specialty_id,
                is_active: true
            },
            include: [
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            attributes: ['id', 'full_name', 'email', 'phone', 'specialty_id', 'experience'],
            order: [['full_name', 'ASC']]
        });

        res.json({
            doctors,
            specialty: booking.specialty,
            booking_id: booking.id
        });

    } catch (error) {
        console.error('❌ Get available doctors for booking error:', error);
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

// Admin - Lấy danh sách bác sĩ còn trống cho booking (để gán)
exports.getAvailableDoctorsForAssignment = async (req, res) => {
    try {
        const { booking_id } = req.params;

        // Lấy thông tin booking
        const booking = await Booking.findByPk(booking_id, {
            include: [{ model: Specialty, as: 'specialty' }]
        });

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        const bookingDate = new Date(booking.appointment_date);
        const dayOfWeek = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][bookingDate.getDay()];

        // Tìm tất cả bác sĩ trong chuyên khoa kèm lịch làm việc
        const doctors = await Doctor.findAll({
            where: {
                specialty_id: booking.specialty_id,
                is_active: true
            },
            attributes: ['id', 'full_name', 'phone', 'email'],
            include: [{
                model: DoctorSchedule,
                as: 'schedules',
                attributes: ['day_of_week', 'start_time', 'end_time'],
                required: false
            }]
        });

        // Lọc bác sĩ đã có booking trùng giờ
        const busyDoctorIds = await Booking.findAll({
            where: {
                appointment_date: booking.appointment_date,
                appointment_time: booking.appointment_time,
                status: {
                    [Op.notIn]: ['cancelled', 'doctor_rejected']
                },
                doctor_id: { [Op.ne]: null }
            },
            attributes: ['doctor_id']
        }).then(bookings => bookings.map(b => b.doctor_id));

        // Kiểm tra bác sĩ có lịch làm việc vào ngày đặt hay không
        const bookingTimeStr = booking.appointment_time?.substring(0, 5) || '08:00';

        const doctorsWithStatus = doctors.map(doc => {
            const docJson = doc.toJSON();
            const isBusy = busyDoctorIds.includes(doc.id);

            // Kiểm tra có lịch làm việc vào ngày này không
            const scheduleForDay = docJson.schedules?.find(s => s.day_of_week === dayOfWeek);
            const hasScheduleForDay = !!scheduleForDay;

            // Kiểm tra giờ khám có trong khung giờ làm việc không
            let isWithinWorkingHours = false;
            if (scheduleForDay && booking.appointment_time) {
                const startTime = scheduleForDay.start_time?.substring(0, 5);
                const endTime = scheduleForDay.end_time?.substring(0, 5);
                isWithinWorkingHours = bookingTimeStr >= startTime && bookingTimeStr < endTime;
            }

            // Trạng thái khả dụng
            let status = 'available';
            let statusText = '✓ Còn trống';
            let disabled = false;

            if (isBusy) {
                status = 'busy';
                statusText = '🔴 Đã có lịch khám khác';
                disabled = true;
            } else if (!hasScheduleForDay) {
                status = 'no_schedule';
                statusText = `⚠️ Không làm việc ${dayOfWeek}`;
                disabled = true;
            } else if (!isWithinWorkingHours) {
                status = 'outside_hours';
                statusText = `⚠️ Ngoài giờ làm việc (${scheduleForDay.start_time?.substring(0, 5)} - ${scheduleForDay.end_time?.substring(0, 5)})`;
                disabled = true;
            }

            return {
                ...docJson,
                isBusy,
                hasScheduleForDay,
                isWithinWorkingHours,
                scheduleForDay,
                status,
                statusText,
                disabled,
                workingDays: docJson.schedules?.map(s => s.day_of_week).join(', ') || 'Chưa có lịch'
            };
        });

        // Sắp xếp: available trước, rồi đến disabled
        doctorsWithStatus.sort((a, b) => {
            if (a.disabled === b.disabled) return 0;
            return a.disabled ? 1 : -1;
        });

        const availableCount = doctorsWithStatus.filter(d => !d.disabled).length;

        res.json({
            booking: {
                id: booking.id,
                booking_code: booking.booking_code,
                specialty: booking.specialty?.name,
                date: booking.appointment_date,
                time: booking.appointment_time,
                dayOfWeek
            },
            availableDoctors: doctorsWithStatus,
            availableCount,
            totalDoctors: doctorsWithStatus.length,
            noAvailableDoctor: availableCount === 0
        });

    } catch (error) {
        console.error('❌ Get available doctors for assignment error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Admin - Gán bác sĩ cho booking
exports.assignDoctorToBooking = async (req, res) => {
    try {
        const { booking_id } = req.params;
        const { doctor_id } = req.body;

        if (!doctor_id) {
            return res.status(400).json({ message: 'Vui lòng chọn bác sĩ' });
        }

        const booking = await Booking.findByPk(booking_id);

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
        }

        // Kiểm tra bác sĩ có trống không (cùng ngày, cùng giờ)
        const conflictBooking = await Booking.findOne({
            where: {
                doctor_id,
                appointment_date: booking.appointment_date,
                appointment_time: booking.appointment_time,
                status: { [Op.notIn]: ['cancelled', 'doctor_rejected'] },
                id: { [Op.ne]: booking_id }
            }
        });

        if (conflictBooking) {
            return res.status(400).json({
                message: 'Bác sĩ này đã có lịch khác vào khung giờ này'
            });
        }

        // Gán bác sĩ và chuyển status
        await booking.update({
            doctor_id,
            status: 'waiting_doctor_confirmation'
        });

        const updatedBooking = await Booking.findByPk(booking_id, {
            include: [
                { model: Doctor, as: 'doctor', attributes: ['id', 'full_name', 'phone'] },
                { model: Specialty, as: 'specialty', attributes: ['id', 'name'] }
            ]
        });

        console.log('✅ Admin assigned doctor to booking:', booking_id, 'Doctor:', doctor_id);

        res.json({
            message: 'Gán bác sĩ thành công! Đang chờ bác sĩ xác nhận.',
            booking: updatedBooking
        });

    } catch (error) {
        console.error('❌ Assign doctor to booking error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = exports;
