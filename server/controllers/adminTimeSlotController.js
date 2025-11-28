const { TimeSlot, Doctor, Room, Specialty, Booking, Patient, DoctorSchedule } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách time slots
exports.getTimeSlots = async (req, res) => {
    try {
        const { doctor_id, date, from_date, to_date, is_available } = req.query;

        const where = {};

        // Filter theo doctor
        if (doctor_id) {
            where.doctor_id = doctor_id;
        }

        // Filter theo ngày cụ thể
        if (date) {
            where.date = date;
        }

        // Filter theo khoảng ngày
        if (from_date && to_date) {
            where.date = {
                [Op.between]: [from_date, to_date]
            };
        } else if (from_date) {
            where.date = {
                [Op.gte]: from_date
            };
        } else if (to_date) {
            where.date = {
                [Op.lte]: to_date
            };
        }

        // Filter theo trạng thái
        if (is_available !== undefined) {
            where.is_available = is_available === 'true';
        }

        const timeSlots = await TimeSlot.findAll({
            where,
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'email', 'phone'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name', 'floor']
                }
            ],
            order: [['date', 'DESC'], ['start_time', 'ASC']]
        });

        console.log(`✅ Loaded ${timeSlots.length} time slots`);
        res.json(timeSlots);
    } catch (error) {
        console.error('❌ Error loading time slots:', error);
        res.status(500).json({ message: 'Lỗi khi tải danh sách khung giờ', error: error.message });
    }
};

// Lấy chi tiết 1 time slot
exports.getTimeSlotById = async (req, res) => {
    try {
        const { id } = req.params;

        const timeSlot = await TimeSlot.findByPk(id, {
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'email', 'phone'],
                    include: [{
                        model: Specialty,
                        as: 'specialty',
                        attributes: ['id', 'name']
                    }]
                },
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name', 'floor']
                },
                {
                    model: Booking,
                    as: 'bookings',
                    include: [{
                        model: Patient,
                        as: 'patient',
                        attributes: ['id', 'full_name', 'phone']
                    }]
                }
            ]
        });

        if (!timeSlot) {
            return res.status(404).json({ message: 'Không tìm thấy khung giờ' });
        }

        res.json(timeSlot);
    } catch (error) {
        console.error('❌ Error loading time slot:', error);
        res.status(500).json({ message: 'Lỗi khi tải thông tin khung giờ', error: error.message });
    }
};

// Tạo time slot mới
exports.createTimeSlot = async (req, res) => {
    try {
        const { doctor_id, date, start_time, end_time, max_patients, room_id, note } = req.body;

        // Validate required fields
        if (!doctor_id || !date || !start_time || !end_time) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp đầy đủ thông tin: bác sĩ, ngày, giờ bắt đầu, giờ kết thúc'
            });
        }

        // Kiểm tra bác sĩ tồn tại
        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        // Kiểm tra trùng lịch
        const existingSlot = await TimeSlot.findOne({
            where: {
                doctor_id,
                date,
                start_time
            }
        });

        if (existingSlot) {
            return res.status(400).json({
                message: 'Khung giờ này đã tồn tại cho bác sĩ trong ngày này'
            });
        }

        const timeSlot = await TimeSlot.create({
            doctor_id,
            date,
            start_time,
            end_time,
            max_patients: max_patients || 1,
            current_patients: 0,
            is_available: true,
            room_id: room_id || null,
            note: note || null
        });

        // Reload với associations
        const createdSlot = await TimeSlot.findByPk(timeSlot.id, {
            include: [
                { model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] },
                { model: Room, as: 'room', attributes: ['id', 'name'] }
            ]
        });

        console.log(`✅ Created time slot ${timeSlot.id} for doctor ${doctor_id} on ${date}`);
        res.status(201).json(createdSlot);
    } catch (error) {
        console.error('❌ Error creating time slot:', error);
        res.status(500).json({ message: 'Lỗi khi tạo khung giờ', error: error.message });
    }
};

// Cập nhật time slot
exports.updateTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_time, end_time, max_patients, room_id, is_available, note } = req.body;

        const timeSlot = await TimeSlot.findByPk(id);

        if (!timeSlot) {
            return res.status(404).json({ message: 'Không tìm thấy khung giờ' });
        }

        // Kiểm tra nếu giảm max_patients mà đã có booking
        if (max_patients !== undefined && max_patients < timeSlot.current_patients) {
            return res.status(400).json({
                message: `Không thể giảm số lượng bệnh nhân tối đa xuống dưới ${timeSlot.current_patients} (đã có ${timeSlot.current_patients} lượt đặt)`
            });
        }

        await timeSlot.update({
            start_time: start_time || timeSlot.start_time,
            end_time: end_time || timeSlot.end_time,
            max_patients: max_patients !== undefined ? max_patients : timeSlot.max_patients,
            room_id: room_id !== undefined ? room_id : timeSlot.room_id,
            is_available: is_available !== undefined ? is_available : timeSlot.is_available,
            note: note !== undefined ? note : timeSlot.note
        });

        // Reload với associations
        const updatedSlot = await TimeSlot.findByPk(id, {
            include: [
                { model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] },
                { model: Room, as: 'room', attributes: ['id', 'name'] }
            ]
        });

        console.log(`✅ Updated time slot ${id}`);
        res.json(updatedSlot);
    } catch (error) {
        console.error('❌ Error updating time slot:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật khung giờ', error: error.message });
    }
};

// Xóa time slot
exports.deleteTimeSlot = async (req, res) => {
    try {
        const { id } = req.params;

        const timeSlot = await TimeSlot.findByPk(id, {
            include: [{
                model: Booking,
                as: 'bookings'
            }]
        });

        if (!timeSlot) {
            return res.status(404).json({ message: 'Không tìm thấy khung giờ' });
        }

        // Kiểm tra có booking nào không
        if (timeSlot.bookings && timeSlot.bookings.length > 0) {
            return res.status(400).json({
                message: `Không thể xóa khung giờ này vì đã có ${timeSlot.bookings.length} lượt đặt lịch`
            });
        }

        await timeSlot.destroy();

        console.log(`✅ Deleted time slot ${id}`);
        res.json({ message: 'Đã xóa khung giờ thành công' });
    } catch (error) {
        console.error('❌ Error deleting time slot:', error);
        res.status(500).json({ message: 'Lỗi khi xóa khung giờ', error: error.message });
    }
};

// Toggle available status
exports.toggleAvailable = async (req, res) => {
    try {
        const { id } = req.params;

        const timeSlot = await TimeSlot.findByPk(id);

        if (!timeSlot) {
            return res.status(404).json({ message: 'Không tìm thấy khung giờ' });
        }

        await timeSlot.update({
            is_available: !timeSlot.is_available
        });

        // Reload với associations
        const updatedSlot = await TimeSlot.findByPk(id, {
            include: [
                { model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] },
                { model: Room, as: 'room', attributes: ['id', 'name'] }
            ]
        });

        console.log(`✅ Toggled time slot ${id} availability to ${updatedSlot.is_available}`);
        res.json(updatedSlot);
    } catch (error) {
        console.error('❌ Error toggling time slot:', error);
        res.status(500).json({ message: 'Lỗi khi thay đổi trạng thái khung giờ', error: error.message });
    }
};

// Tạo nhiều time slots cùng lúc (bulk create)
exports.bulkCreateTimeSlots = async (req, res) => {
    try {
        const { doctor_id, date, slots, room_id } = req.body;

        // slots = [{start_time, end_time, max_patients}]
        if (!doctor_id || !date || !slots || !Array.isArray(slots)) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp đầy đủ thông tin: doctor_id, date, slots[]'
            });
        }

        // Kiểm tra bác sĩ tồn tại
        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        const createdSlots = [];
        const errors = [];

        for (const slot of slots) {
            try {
                // Kiểm tra trùng
                const existing = await TimeSlot.findOne({
                    where: { doctor_id, date, start_time: slot.start_time }
                });

                if (existing) {
                    errors.push(`Khung giờ ${slot.start_time} đã tồn tại`);
                    continue;
                }

                const newSlot = await TimeSlot.create({
                    doctor_id,
                    date,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    max_patients: slot.max_patients || 1,
                    current_patients: 0,
                    is_available: true,
                    room_id: room_id || null
                });

                createdSlots.push(newSlot);
            } catch (err) {
                errors.push(`Lỗi tạo khung giờ ${slot.start_time}: ${err.message}`);
            }
        }

        console.log(`✅ Bulk created ${createdSlots.length} time slots, ${errors.length} errors`);
        res.status(201).json({
            message: `Đã tạo ${createdSlots.length} khung giờ`,
            created: createdSlots.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('❌ Error bulk creating time slots:', error);
        res.status(500).json({ message: 'Lỗi khi tạo nhiều khung giờ', error: error.message });
    }
};

// Lấy thống kê time slots
exports.getTimeSlotStats = async (req, res) => {
    try {
        const { from_date, to_date, doctor_id } = req.query;

        const where = {};

        if (from_date && to_date) {
            where.date = { [Op.between]: [from_date, to_date] };
        }
        if (doctor_id) {
            where.doctor_id = doctor_id;
        }

        const total = await TimeSlot.count({ where });
        const available = await TimeSlot.count({ where: { ...where, is_available: true } });
        const unavailable = await TimeSlot.count({ where: { ...where, is_available: false } });

        // Khung giờ đã đầy (current_patients >= max_patients)
        const full = await TimeSlot.count({
            where: {
                ...where,
                current_patients: {
                    [Op.gte]: require('sequelize').col('max_patients')
                }
            }
        });

        res.json({
            total,
            available,
            unavailable,
            full,
            hasCapacity: total - full
        });
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        res.status(500).json({ message: 'Lỗi khi tải thống kê', error: error.message });
    }
};

// Tự động tạo time slots dựa trên lịch làm việc của bác sĩ
exports.generateTimeSlots = async (req, res) => {
    try {
        const { doctor_id, start_date, end_date, slot_duration = 30 } = req.body;

        if (!doctor_id || !start_date || !end_date) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp đầy đủ: doctor_id, start_date, end_date'
            });
        }

        // Kiểm tra bác sĩ tồn tại
        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
        }

        // Lấy lịch làm việc của bác sĩ
        const schedules = await DoctorSchedule.findAll({
            where: {
                doctor_id,
                is_active: true
            }
        });

        if (schedules.length === 0) {
            return res.status(400).json({
                message: 'Bác sĩ chưa có lịch làm việc. Vui lòng tạo lịch làm việc trước.'
            });
        }

        // Map day_of_week sang số (0 = Chủ nhật, 1 = Thứ 2, ...)
        const dayMapping = {
            'Chủ nhật': 0,
            'Thứ 2': 1,
            'Thứ 3': 2,
            'Thứ 4': 3,
            'Thứ 5': 4,
            'Thứ 6': 5,
            'Thứ 7': 6
        };

        // Tạo map schedules theo ngày trong tuần
        const schedulesByDay = {};
        for (const schedule of schedules) {
            const dayNum = dayMapping[schedule.day_of_week];
            if (dayNum !== undefined) {
                schedulesByDay[dayNum] = schedule;
            }
        }

        const createdSlots = [];
        const errors = [];
        let currentDate = new Date(start_date);
        const endDateObj = new Date(end_date);

        // Duyệt qua từng ngày trong khoảng
        while (currentDate <= endDateObj) {
            const dayOfWeek = currentDate.getDay();
            const schedule = schedulesByDay[dayOfWeek];

            if (schedule) {
                const dateStr = currentDate.toISOString().split('T')[0];

                // Parse start_time và end_time
                const [startHour, startMin] = schedule.start_time.split(':').map(Number);
                const [endHour, endMin] = schedule.end_time.split(':').map(Number);

                // Parse break time nếu có
                let breakStart = null, breakEnd = null;
                if (schedule.break_start && schedule.break_end) {
                    const [bsHour, bsMin] = schedule.break_start.split(':').map(Number);
                    const [beHour, beMin] = schedule.break_end.split(':').map(Number);
                    breakStart = bsHour * 60 + bsMin;
                    breakEnd = beHour * 60 + beMin;
                }

                // Tạo các khung giờ
                let currentMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;

                while (currentMinutes + slot_duration <= endMinutes) {
                    const slotStartMinutes = currentMinutes;
                    const slotEndMinutes = currentMinutes + slot_duration;

                    // Bỏ qua nếu khung giờ nằm trong break time
                    if (breakStart !== null && breakEnd !== null) {
                        if (slotStartMinutes < breakEnd && slotEndMinutes > breakStart) {
                            currentMinutes += slot_duration;
                            continue;
                        }
                    }

                    const startTimeStr = `${String(Math.floor(slotStartMinutes / 60)).padStart(2, '0')}:${String(slotStartMinutes % 60).padStart(2, '0')}:00`;
                    const endTimeStr = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}:00`;

                    try {
                        // Kiểm tra trùng
                        const existing = await TimeSlot.findOne({
                            where: { doctor_id, date: dateStr, start_time: startTimeStr }
                        });

                        if (!existing) {
                            const newSlot = await TimeSlot.create({
                                doctor_id,
                                date: dateStr,
                                start_time: startTimeStr,
                                end_time: endTimeStr,
                                max_patients: 1,
                                current_patients: 0,
                                is_available: true
                            });
                            createdSlots.push(newSlot);
                        }
                    } catch (err) {
                        errors.push(`Lỗi tạo slot ${dateStr} ${startTimeStr}: ${err.message}`);
                    }

                    currentMinutes += slot_duration;
                }
            }

            // Sang ngày tiếp theo
            currentDate.setDate(currentDate.getDate() + 1);
        }

        console.log(`✅ Generated ${createdSlots.length} time slots for doctor ${doctor_id}`);
        res.status(201).json({
            message: `Đã tạo ${createdSlots.length} khung giờ từ ${start_date} đến ${end_date}`,
            created: createdSlots.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('❌ Error generating time slots:', error);
        res.status(500).json({ message: 'Lỗi khi tạo khung giờ tự động', error: error.message });
    }
};

// Xóa nhiều time slots cùng lúc
exports.bulkDeleteTimeSlots = async (req, res) => {
    try {
        const { doctor_id, date } = req.body;

        if (!doctor_id || !date) {
            return res.status(400).json({
                message: 'Vui lòng cung cấp doctor_id và date'
            });
        }

        // Kiểm tra xem có booking nào không
        const slotsWithBookings = await TimeSlot.findAll({
            where: { doctor_id, date },
            include: [{
                model: Booking,
                as: 'bookings',
                where: {
                    status: { [Op.notIn]: ['cancelled'] }
                },
                required: true
            }]
        });

        if (slotsWithBookings.length > 0) {
            return res.status(400).json({
                message: `Không thể xóa! Có ${slotsWithBookings.length} khung giờ đã có lượt đặt lịch`
            });
        }

        // Xóa tất cả khung giờ không có booking
        const deleted = await TimeSlot.destroy({
            where: { doctor_id, date }
        });

        console.log(`✅ Bulk deleted ${deleted} time slots for doctor ${doctor_id} on ${date}`);
        res.json({
            message: `Đã xóa ${deleted} khung giờ`,
            deleted
        });
    } catch (error) {
        console.error('❌ Error bulk deleting time slots:', error);
        res.status(500).json({ message: 'Lỗi khi xóa khung giờ', error: error.message });
    }
};
