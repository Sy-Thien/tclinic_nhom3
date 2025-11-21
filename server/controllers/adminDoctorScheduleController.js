const { DoctorSchedule, Doctor, Specialty } = require('../models');

// Lấy tất cả bác sĩ (để chọn thêm lịch)
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.findAll({
            attributes: ['id', 'full_name', 'phone', 'email', 'specialty_id'],
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }],
            order: [['full_name', 'ASC']]
        });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách bác sĩ', error: error.message });
    }
};

// Lấy tất cả lịch làm việc
exports.getAllSchedules = async (req, res) => {
    try {
        const schedules = await DoctorSchedule.findAll({
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name'],
                    include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
                }
            ],
            order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách lịch làm việc', error: error.message });
    }
};

// Lấy lịch làm việc của một bác sĩ
exports.getScheduleByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const schedules = await DoctorSchedule.findAll({
            where: { doctor_id: doctorId },
            include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] }],
            order: [['day_of_week', 'ASC']]
        });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy lịch làm việc của bác sĩ', error: error.message });
    }
};

// Tạo lịch làm việc
exports.createSchedule = async (req, res) => {
    try {
        const { doctor_id, day_of_week, start_time, end_time, break_start, break_end } = req.body;

        // Kiểm tra doctor tồn tại
        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({ message: 'Bác sĩ không tồn tại' });
        }

        // Kiểm tra không trùng lịch
        const existing = await DoctorSchedule.findOne({
            where: { doctor_id, day_of_week }
        });

        if (existing) {
            return res.status(400).json({ message: 'Bác sĩ này đã có lịch vào ngày này' });
        }

        const schedule = await DoctorSchedule.create({
            doctor_id,
            day_of_week,
            start_time,
            end_time,
            break_start: break_start || null,
            break_end: break_end || null,
            is_active: true
        });

        const scheduleWithDoctor = await DoctorSchedule.findByPk(schedule.id, {
            include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] }]
        });

        res.status(201).json({
            message: 'Tạo lịch làm việc thành công',
            schedule: scheduleWithDoctor
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

        const schedule = await DoctorSchedule.findByPk(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: 'Lịch làm việc không tồn tại' });
        }

        // Nếu thay đổi day_of_week, kiểm tra không trùng
        if (day_of_week && day_of_week !== schedule.day_of_week) {
            const existing = await DoctorSchedule.findOne({
                where: {
                    doctor_id: schedule.doctor_id,
                    day_of_week,
                    id: { [require('sequelize').Op.ne]: scheduleId }
                }
            });
            if (existing) {
                return res.status(400).json({ message: 'Bác sĩ này đã có lịch vào ngày khác' });
            }
        }

        await schedule.update({
            day_of_week: day_of_week || schedule.day_of_week,
            start_time: start_time || schedule.start_time,
            end_time: end_time || schedule.end_time,
            break_start: break_start !== undefined ? break_start : schedule.break_start,
            break_end: break_end !== undefined ? break_end : schedule.break_end,
            is_active: is_active !== undefined ? is_active : schedule.is_active
        });

        const updatedSchedule = await DoctorSchedule.findByPk(scheduleId, {
            include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'full_name'] }]
        });

        res.json({
            message: 'Cập nhật lịch làm việc thành công',
            schedule: updatedSchedule
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật lịch làm việc', error: error.message });
    }
};

// Xóa lịch làm việc
exports.deleteSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const schedule = await DoctorSchedule.findByPk(scheduleId);

        if (!schedule) {
            return res.status(404).json({ message: 'Lịch làm việc không tồn tại' });
        }

        await schedule.destroy();
        res.json({ message: 'Xóa lịch làm việc thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa lịch làm việc', error: error.message });
    }
};

// Xóa tất cả lịch của một bác sĩ
exports.deleteAllSchedulesForDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Bác sĩ không tồn tại' });
        }

        const count = await DoctorSchedule.destroy({
            where: { doctor_id: doctorId }
        });

        res.json({ message: `Đã xóa ${count} lịch làm việc của bác sĩ`, count });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa lịch làm việc', error: error.message });
    }
};

// Bulk upload lịch (tạo nhanh nhiều lịch)
exports.bulkCreateSchedules = async (req, res) => {
    try {
        const { doctor_id, schedules } = req.body;

        const doctor = await Doctor.findByPk(doctor_id);
        if (!doctor) {
            return res.status(404).json({ message: 'Bác sĩ không tồn tại' });
        }

        const created = [];
        const errors = [];

        for (let i = 0; i < schedules.length; i++) {
            const { day_of_week, start_time, end_time, break_start, break_end } = schedules[i];

            try {
                // Kiểm tra không trùng
                const existing = await DoctorSchedule.findOne({
                    where: { doctor_id, day_of_week }
                });

                if (existing) {
                    errors.push({ index: i, message: `Lịch ${day_of_week} đã tồn tại` });
                    continue;
                }

                const schedule = await DoctorSchedule.create({
                    doctor_id,
                    day_of_week,
                    start_time,
                    end_time,
                    break_start: break_start || null,
                    break_end: break_end || null,
                    is_active: true
                });

                created.push(schedule);
            } catch (error) {
                errors.push({ index: i, message: error.message });
            }
        }

        res.status(201).json({
            message: `Tạo ${created.length} lịch thành công${errors.length > 0 ? `, ${errors.length} lỗi` : ''}`,
            created,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi bulk create schedules', error: error.message });
    }
};
