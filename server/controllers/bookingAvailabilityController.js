const { Booking, Doctor, DoctorSchedule, Specialty } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

// Lấy danh sách bác sĩ theo chuyên khoa
exports.getDoctorsBySpecialty = async (req, res) => {
    try {
        const { specialtyId } = req.query;

        const doctors = await Doctor.findAll({
            where: { specialty_id: specialtyId, is_active: true },
            attributes: ['id', 'full_name', 'phone', 'email', 'specialty_id'],
            include: [
                {
                    model: DoctorSchedule,
                    as: 'schedules',
                    where: { is_active: true },
                    required: false,
                    attributes: ['id', 'day_of_week', 'start_time', 'end_time']
                },
                {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }
            ],
            order: [['full_name', 'ASC']]
        });

        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách bác sĩ', error: error.message });
    }
};

// Lấy giờ rảnh của bác sĩ trong một ngày cụ thể
exports.getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        const slotDuration = 30; // Mỗi slot 30 phút

        // Lấy lịch làm việc của bác sĩ theo ngày
        const dayOfWeek = moment(date).format('dddd');
        const dayMapping = {
            Monday: 'Thứ 2',
            Tuesday: 'Thứ 3',
            Wednesday: 'Thứ 4',
            Thursday: 'Thứ 5',
            Friday: 'Thứ 6',
            Saturday: 'Thứ 7',
            Sunday: 'Chủ nhật'
        };

        const schedule = await DoctorSchedule.findOne({
            where: {
                doctor_id: doctorId,
                day_of_week: dayMapping[dayOfWeek],
                is_active: true
            }
        });

        if (!schedule) {
            return res.json({ availableSlots: [], bookedSlots: [] });
        }

        // Tạo danh sách slots trong ngày
        const startTime = moment(schedule.start_time, 'HH:mm:ss');
        const endTime = moment(schedule.end_time, 'HH:mm:ss');
        const breakStart = schedule.break_start ? moment(schedule.break_start, 'HH:mm:ss') : null;
        const breakEnd = schedule.break_end ? moment(schedule.break_end, 'HH:mm:ss') : null;

        const allSlots = [];
        let current = startTime.clone();

        while (current < endTime) {
            const slotStart = current.clone();
            const slotEnd = current.clone().add(slotDuration, 'minutes');

            // Bỏ qua slot nếu nằm trong giờ nghỉ
            if (breakStart && breakEnd) {
                if (!(slotEnd <= breakStart || slotStart >= breakEnd)) {
                    current = slotEnd;
                    continue;
                }
            }

            allSlots.push({
                start: slotStart.format('HH:mm'),
                end: slotEnd.format('HH:mm')
            });

            current = slotEnd;
        }

        // Lấy các lịch đã đặt của bác sĩ trong ngày đó (pending, confirmed, in_progress)
        const bookedAppointments = await Booking.findAll({
            where: {
                doctor_id: doctorId,
                appointment_date: date,
                status: { [Op.notIn]: ['cancelled', 'doctor_rejected'] }
            },
            attributes: ['appointment_time', 'status', 'patient_name']
        });

        const bookedTimes = bookedAppointments.map(b => ({
            time: b.appointment_time?.substring(0, 5),
            status: b.status,
            patient_name: b.patient_name
        }));

        // Lọc các slot còn rảnh và đánh dấu slot đã đặt
        const now = moment();
        const isToday = moment(date).isSame(now, 'day');

        const slots = allSlots.map(slot => {
            const booked = bookedTimes.find(b => b.time === slot.start);
            const slotMoment = moment(slot.start, 'HH:mm');

            // Nếu là hôm nay và slot đã qua thì không cho đặt
            const isPast = isToday && slotMoment.isBefore(now);

            return {
                ...slot,
                available: !booked && !isPast,
                status: booked ? booked.status : (isPast ? 'past' : 'available'),
                patient_name: booked?.patient_name || null
            };
        });

        const availableSlots = slots.filter(s => s.available);
        const unavailableSlots = slots.filter(s => !s.available);

        res.json({
            allSlots: slots,
            availableSlots,
            bookedSlots: unavailableSlots
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy giờ rảnh bác sĩ', error: error.message });
    }
};

// Lấy giờ rảnh của TẤT CẢ bác sĩ trong một ngày cụ thể (lựa chọn 1: đặt không chỉ định bác sĩ)
exports.getAvailableDoctors = async (req, res) => {
    try {
        const { date } = req.query;
        const slotDuration = 30;

        const dayOfWeek = moment(date).format('dddd');
        const dayMapping = {
            Monday: 'Thứ 2',
            Tuesday: 'Thứ 3',
            Wednesday: 'Thứ 4',
            Thursday: 'Thứ 5',
            Friday: 'Thứ 6',
            Saturday: 'Thứ 7',
            Sunday: 'Chủ nhật'
        };

        // Lấy tất cả bác sĩ có lịch làm việc vào ngày đó
        const schedules = await DoctorSchedule.findAll({
            where: {
                day_of_week: dayMapping[dayOfWeek],
                is_active: true
            },
            include: [{ model: Doctor, as: 'doctor' }]
        });

        const result = [];

        for (const schedule of schedules) {
            const startTime = moment(schedule.start_time, 'HH:mm:ss');
            const endTime = moment(schedule.end_time, 'HH:mm:ss');
            const breakStart = schedule.break_start ? moment(schedule.break_start, 'HH:mm:ss') : null;
            const breakEnd = schedule.break_end ? moment(schedule.break_end, 'HH:mm:ss') : null;

            const allSlots = [];
            let current = startTime.clone();

            while (current < endTime) {
                const slotStart = current.clone();
                const slotEnd = current.clone().add(slotDuration, 'minutes');

                if (breakStart && breakEnd) {
                    if (!(slotEnd <= breakStart || slotStart >= breakEnd)) {
                        current = slotEnd;
                        continue;
                    }
                }

                allSlots.push(slotStart.format('HH:mm'));
                current = slotEnd;
            }

            // Lấy các lịch đã đặt
            const bookedSlots = await Booking.findAll({
                where: {
                    doctor_id: schedule.doctor_id,
                    appointment_date: date,
                    status: { [Op.notIn]: ['cancelled', 'doctor_rejected'] }
                },
                attributes: ['appointment_time']
            });

            const bookedTimes = bookedSlots.map(b => b.appointment_time);
            const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

            if (availableSlots.length > 0) {
                result.push({
                    doctor_id: schedule.doctor.id,
                    doctor_name: schedule.doctor.full_name,
                    specialty: schedule.doctor.specialty_id,
                    availableSlots
                });
            }
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách bác sĩ rảnh', error: error.message });
    }
};
