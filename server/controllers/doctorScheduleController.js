const { DoctorSchedule, Doctor } = require('../models');

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
