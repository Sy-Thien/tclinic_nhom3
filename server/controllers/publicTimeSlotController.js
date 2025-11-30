const { TimeSlot, Booking, Doctor, DoctorSchedule, Specialty, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper: Generate slots từ schedule
function generateSlotsFromSchedule(schedule, slotDuration = 30) {
    if (!schedule) return [];

    const slots = [];
    const [startHour, startMin] = schedule.start_time.split(':').map(Number);
    const [endHour, endMin] = schedule.end_time.split(':').map(Number);

    let breakStart = null, breakEnd = null;
    if (schedule.break_start && schedule.break_end) {
        const [bsH, bsM] = schedule.break_start.split(':').map(Number);
        const [beH, beM] = schedule.break_end.split(':').map(Number);
        breakStart = bsH * 60 + bsM;
        breakEnd = beH * 60 + beM;
    }

    let current = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    while (current + slotDuration <= end) {
        const slotStart = current;
        const slotEnd = current + slotDuration;

        // Skip break time
        if (breakStart !== null && breakEnd !== null) {
            if (slotStart < breakEnd && slotEnd > breakStart) {
                current += slotDuration;
                continue;
            }
        }

        const startStr = `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}:00`;
        const endStr = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}:00`;

        slots.push({ start_time: startStr, end_time: endStr });
        current += slotDuration;
    }

    return slots;
}

// Helper: Map day of week
const dayMapping = {
    0: 'Chủ nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7'
};

// GET - Lấy danh sách khung giờ khả dụng cho ngày cụ thể
exports.getAvailableTimeSlots = async (req, res) => {
    try {
        const { date, doctor_id } = req.query;
        console.log('📋 GET /api/public/available-time-slots', { date, doctor_id });

        if (!date) {
            return res.status(400).json({
                message: 'Vui lòng chọn ngày'
            });
        }

        const dateObj = new Date(date);
        const dayOfWeek = dayMapping[dateObj.getDay()];

        // Nếu có doctor_id, lấy schedule của bác sĩ đó
        if (doctor_id) {
            const schedule = await DoctorSchedule.findOne({
                where: {
                    doctor_id,
                    day_of_week: dayOfWeek,
                    is_active: true
                }
            });

            if (!schedule) {
                return res.json([]);
            }

            // Generate slots từ schedule
            const generatedSlots = generateSlotsFromSchedule(schedule);

            // Lấy các booking đã có
            const existingBookings = await Booking.findAll({
                where: {
                    doctor_id,
                    appointment_date: date,
                    status: { [Op.in]: ['pending', 'confirmed'] }
                },
                attributes: ['appointment_time']
            });

            const bookedTimes = existingBookings.map(b => b.appointment_time);

            // Lấy các slot bị khóa
            const lockedSlots = await TimeSlot.findAll({
                where: {
                    doctor_id,
                    date,
                    is_available: false
                },
                attributes: ['start_time']
            });

            const lockedTimes = lockedSlots.map(s => s.start_time);

            // Tính toán available slots
            const availableSlots = generatedSlots.map(slot => {
                const isBooked = bookedTimes.includes(slot.start_time);
                const isLocked = lockedTimes.includes(slot.start_time);

                return {
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    is_available: !isBooked && !isLocked,
                    is_booked: isBooked,
                    is_locked: isLocked
                };
            });

            console.log(`✅ Found ${availableSlots.length} time slots for doctor ${doctor_id}`);
            return res.json(availableSlots);
        }

        // Nếu không có doctor_id, lấy tất cả bác sĩ có lịch làm ngày đó
        const schedules = await DoctorSchedule.findAll({
            where: {
                day_of_week: dayOfWeek,
                is_active: true
            },
            include: [{
                model: Doctor,
                as: 'doctor',
                attributes: ['id', 'full_name'],
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }]
            }]
        });

        // Tổng hợp tất cả các slot unique
        const allSlots = new Set();
        schedules.forEach(schedule => {
            const slots = generateSlotsFromSchedule(schedule);
            slots.forEach(s => allSlots.add(s.start_time));
        });

        const result = Array.from(allSlots).sort().map(time => ({
            start_time: time,
            end_time: time, // Will be calculated properly
            is_available: true
        }));

        console.log(`✅ Found ${result.length} unique time slots`);
        res.json(result);
    } catch (error) {
        console.error('❌ Error fetching available time slots:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách khung giờ',
            error: error.message
        });
    }
};

// GET - Lấy lịch khám theo ngày (cho calendar view)
exports.getBookingCalendar = async (req, res) => {
    try {
        const { start_date, end_date, doctor_id } = req.query;
        console.log('📅 GET /api/public/booking-calendar', { start_date, end_date, doctor_id });

        const whereClause = {
            status: {
                [Op.in]: ['pending', 'confirmed']
            }
        };

        if (start_date && end_date) {
            whereClause.appointment_date = {
                [Op.between]: [start_date, end_date]
            };
        }

        if (doctor_id) {
            whereClause.doctor_id = doctor_id;
        }

        const bookings = await Booking.findAll({
            where: whereClause,
            attributes: [
                'appointment_date',
                'appointment_time',
                [sequelize.fn('COUNT', sequelize.col('id')), 'booking_count']
            ],
            group: ['appointment_date', 'appointment_time'],
            order: [['appointment_date', 'ASC'], ['appointment_time', 'ASC']],
            raw: true
        });

        // Group by date
        const calendar = {};
        bookings.forEach(booking => {
            const date = booking.appointment_date;
            if (!calendar[date]) {
                calendar[date] = [];
            }
            calendar[date].push({
                time: booking.appointment_time,
                count: parseInt(booking.booking_count)
            });
        });

        res.json(calendar);
    } catch (error) {
        console.error('❌ Error fetching booking calendar:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy lịch khám',
            error: error.message
        });
    }
};
