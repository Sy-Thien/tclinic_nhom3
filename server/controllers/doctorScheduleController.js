const { DoctorSchedule, Doctor, Booking, TimeSlot } = require('../models');
const { Op } = require('sequelize');

// Lấy lịch làm việc của một bác sĩ
exports.getSchedule = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const schedule = await DoctorSchedule.findAll({
            where: { doctor_id: doctorId, is_active: true },
            include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] }],
            order: [['day_of_week', 'ASC']]
        });
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy lịch làm việc', error: error.message });
    }
};

// Tạo lịch làm việc cho bác sĩ
exports.createSchedule = async (req, res) => {
    try {
        const { doctorId, day_of_week, start_time, end_time, break_start, break_end } = req.body;

        const schedule = await DoctorSchedule.create({
            doctor_id: doctorId,
            day_of_week,
            start_time,
            end_time,
            break_start,
            break_end,
            is_active: true
        });

        res.status(201).json({
            message: 'Tạo lịch làm việc thành công',
            schedule
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tạo lịch làm việc', error: error.message });
    }
};

// Cập nhật lịch làm việc
exports.updateSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { day_of_week, start_time, end_time, break_start, break_end, is_active } = req.body;

        await DoctorSchedule.update(
            { day_of_week, start_time, end_time, break_start, break_end, is_active },
            { where: { id: scheduleId } }
        );

        res.json({ message: 'Cập nhật lịch làm việc thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật lịch làm việc', error: error.message });
    }
};

// Xóa lịch làm việc
exports.deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        await DoctorSchedule.destroy({ where: { id: scheduleId } });
        res.json({ message: 'Xóa lịch làm việc thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa lịch làm việc', error: error.message });
    }
};

// Lấy tất cả bác sĩ với lịch làm việc
exports.getAllDoctorsWithSchedule = async (req, res) => {
    try {
        const doctors = await Doctor.findAll({
            include: [
                {
                    model: DoctorSchedule,
                    as: 'schedules',
                    where: { is_active: true },
                    required: false
                },
                { model: require('../models').Specialty, as: 'specialty' }
            ]
        });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách bác sĩ', error: error.message });
    }
};

// ✅ NEW: Lấy time slots của bác sĩ theo ngày với số lượng booking
exports.getDoctorTimeSlotsWithBookings = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query; // Format: YYYY-MM-DD

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp ngày (date)'
            });
        }

        // Lấy thứ trong tuần (0 = Sunday, 1 = Monday, ...)
        const dateObj = new Date(date + 'T00:00:00');
        const dayOfWeek = dateObj.getDay();

        // Map dayOfWeek sang tiếng Việt
        const dayNames = {
            0: 'Chủ nhật',
            1: 'Thứ 2',
            2: 'Thứ 3',
            3: 'Thứ 4',
            4: 'Thứ 5',
            5: 'Thứ 6',
            6: 'Thứ 7'
        };
        const vietnameseDayName = dayNames[dayOfWeek];

        console.log(`📅 Getting schedule for doctor ${doctorId} on ${date} (${vietnameseDayName})`);

        // Lấy schedule của bác sĩ cho ngày này
        const schedule = await DoctorSchedule.findOne({
            where: {
                doctor_id: doctorId,
                day_of_week: vietnameseDayName,
                is_active: true
            }
        });

        if (!schedule) {
            return res.json({
                success: true,
                message: 'Bác sĩ không làm việc vào ngày này',
                data: {
                    isWorking: false,
                    slots: []
                }
            });
        }

        // Tạo danh sách time slots (mỗi slot 30 phút)
        const slots = [];
        const startHour = parseInt(schedule.start_time.split(':')[0]);
        const startMin = parseInt(schedule.start_time.split(':')[1]);
        const endHour = parseInt(schedule.end_time.split(':')[0]);
        const endMin = parseInt(schedule.end_time.split(':')[1]);

        const breakStart = schedule.break_start ? schedule.break_start : null;
        const breakEnd = schedule.break_end ? schedule.break_end : null;

        let currentHour = startHour;
        let currentMin = startMin;

        while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const slotStartTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

            // Tính end time (thêm 30 phút)
            let slotEndMin = currentMin + 30;
            let slotEndHour = currentHour;
            if (slotEndMin >= 60) {
                slotEndMin -= 60;
                slotEndHour += 1;
            }
            const slotEndTime = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMin).padStart(2, '0')}`;

            // Kiểm tra có phải break time không
            let isBreakTime = false;
            if (breakStart && breakEnd) {
                const slotStart = currentHour * 60 + currentMin;
                const breakStartMin = parseInt(breakStart.split(':')[0]) * 60 + parseInt(breakStart.split(':')[1]);
                const breakEndMin = parseInt(breakEnd.split(':')[0]) * 60 + parseInt(breakEnd.split(':')[1]);

                if (slotStart >= breakStartMin && slotStart < breakEndMin) {
                    isBreakTime = true;
                }
            }

            // Đếm số booking trong time slot này
            // Chỉ đếm những booking có appointment_time = slotStartTime
            const bookingCount = await Booking.count({
                where: {
                    doctor_id: doctorId,
                    appointment_date: date,
                    appointment_time: slotStartTime,
                    status: {
                        [Op.notIn]: ['cancelled', 'doctor_rejected']
                    }
                }
            });

            slots.push({
                time: `${slotStartTime}-${slotEndTime}`,
                startTime: slotStartTime,
                endTime: slotEndTime,
                isBreakTime,
                bookingCount,
                isAvailable: !isBreakTime && bookingCount === 0
            });

            // Tăng 30 phút
            currentMin += 30;
            if (currentMin >= 60) {
                currentMin -= 60;
                currentHour += 1;
            }
        }

        res.json({
            success: true,
            data: {
                isWorking: true,
                date,
                dayOfWeek,
                schedule: {
                    start_time: schedule.start_time,
                    end_time: schedule.end_time,
                    break_start: schedule.break_start,
                    break_end: schedule.break_end
                },
                slots
            }
        });

    } catch (error) {
        console.error('❌ Error getting doctor time slots:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin time slots',
            error: error.message
        });
    }
};
