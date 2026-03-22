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
        const { doctor_id, day_of_week, start_time, end_time, break_start, break_end, room, is_active } = req.body;

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
            room: room || null,
            is_active: is_active !== false
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
        const { day_of_week, start_time, end_time, break_start, break_end, is_active, room } = req.body;

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
            is_active: is_active !== undefined ? is_active : schedule.is_active,
            room: room !== undefined ? room : schedule.room
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

// ============ PHẦN PHÊ DUYỆT LỊCH LÀM VIỆC ============

// Lấy danh sách lịch chờ phê duyệt
exports.getPendingSchedules = async (req, res) => {
    try {
        const pendingSchedules = await DoctorSchedule.findAll({
            where: { approval_status: 'pending' },
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'email', 'phone'],
                    include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: pendingSchedules.length,
            schedules: pendingSchedules
        });
    } catch (error) {
        console.error('❌ Error fetching pending schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy danh sách lịch chờ duyệt',
            error: error.message
        });
    }
};

// Phê duyệt lịch làm việc
exports.approveSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const adminId = req.user.id; // Admin đang đăng nhập

        const schedule = await DoctorSchedule.findByPk(scheduleId, {
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name']
                }
            ]
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch làm việc'
            });
        }

        if (schedule.approval_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Lịch này đã được ${schedule.approval_status === 'approved' ? 'phê duyệt' : 'từ chối'} trước đó`
            });
        }

        // Cập nhật trạng thái
        await schedule.update({
            approval_status: 'approved',
            approved_by: adminId,
            approved_at: new Date(),
            rejection_reason: null
        });

        console.log(`✅ Admin ${adminId} approved schedule ${scheduleId} for doctor ${schedule.doctor_id}`);

        // 🔔 Socket: Thông báo cho bác sĩ
        const { emitToUser } = require('../services/socketService');
        emitToUser('doctor', schedule.doctor_id, 'schedule_approved', {
            type: 'schedule_approved',
            title: '✅ Lịch làm việc được phê duyệt',
            message: `Lịch ${schedule.day_of_week} (${schedule.start_time?.substring(0, 5)} - ${schedule.end_time?.substring(0, 5)}) đã được phê duyệt`,
            scheduleId: schedule.id
        });

        res.json({
            success: true,
            message: `Đã phê duyệt lịch làm việc ${schedule.day_of_week} cho BS. ${schedule.doctor?.full_name}`,
            schedule
        });
    } catch (error) {
        console.error('❌ Error approving schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi phê duyệt lịch làm việc',
            error: error.message
        });
    }
};

// Từ chối lịch làm việc
exports.rejectSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { rejection_reason } = req.body;
        const adminId = req.user.id;

        if (!rejection_reason || rejection_reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp lý do từ chối'
            });
        }

        const schedule = await DoctorSchedule.findByPk(scheduleId, {
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name']
                }
            ]
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch làm việc'
            });
        }

        if (schedule.approval_status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Lịch này đã được ${schedule.approval_status === 'approved' ? 'phê duyệt' : 'từ chối'} trước đó`
            });
        }

        // Cập nhật trạng thái
        await schedule.update({
            approval_status: 'rejected',
            approved_by: adminId,
            approved_at: new Date(),
            rejection_reason: rejection_reason.trim()
        });

        console.log(`❌ Admin ${adminId} rejected schedule ${scheduleId} for doctor ${schedule.doctor_id}`);

        // 🔔 Socket: Thông báo cho bác sĩ
        const { emitToUser } = require('../services/socketService');
        emitToUser('doctor', schedule.doctor_id, 'schedule_rejected', {
            type: 'schedule_rejected',
            title: '❌ Lịch làm việc bị từ chối',
            message: `Lịch ${schedule.day_of_week} bị từ chối. Lý do: ${rejection_reason.trim()}`,
            scheduleId: schedule.id
        });

        res.json({
            success: true,
            message: `Đã từ chối lịch làm việc ${schedule.day_of_week} của BS. ${schedule.doctor?.full_name}`,
            schedule
        });
    } catch (error) {
        console.error('❌ Error rejecting schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi từ chối lịch làm việc',
            error: error.message
        });
    }
};

// Lấy lịch sử phê duyệt (tất cả lịch đã duyệt/từ chối)
exports.getApprovalHistory = async (req, res) => {
    try {
        const { status } = req.query; // 'approved' hoặc 'rejected'

        const whereClause = {};
        if (status === 'approved' || status === 'rejected') {
            whereClause.approval_status = status;
        } else {
            whereClause.approval_status = ['approved', 'rejected'];
        }

        const schedules = await DoctorSchedule.findAll({
            where: whereClause,
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'email'],
                    include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
                }
            ],
            order: [['approved_at', 'DESC']]
        });

        res.json({
            success: true,
            count: schedules.length,
            schedules
        });
    } catch (error) {
        console.error('❌ Error fetching approval history:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy lịch sử phê duyệt',
            error: error.message
        });
    }
};
