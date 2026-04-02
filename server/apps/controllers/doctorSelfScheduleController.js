const { DoctorSchedule, Doctor, TimeSlot, Booking, Room, Specialty } = require('../Database/Entity');
const { Op } = require('sequelize');

/**
 * Controller cho bác sĩ tự quản lý lịch làm việc của mình
 * Khác với admin controller: bác sĩ chỉ quản lý lịch của chính họ
 */

// Lấy tất cả lịch làm việc của bác sĩ đang đăng nhập

class DoctorSelfScheduleController {
    async getMySchedules(req, res) {
        try {
            const doctorId = req.user.id; // Bác sĩ đang đăng nhập

            const schedules = await DoctorSchedule.findAll({
                where: { doctor_id: doctorId },
                order: [
                    ['day_of_week', 'ASC'],
                    ['start_time', 'ASC']
                ]
            });

            res.json({
                success: true,
                schedules
            });
        } catch (error) {
            console.error('❌ Error fetching doctor schedules:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy lịch làm việc',
                error: error.message
            });
        }
    };

    // Tạo lịch làm việc mới cho chính mình
    async createMySchedule(req, res) {
        try {
            const doctorId = req.user.id;
            const { day_of_week, start_time, end_time, break_start, break_end, room, is_active } = req.body;

            // Ghi chú: Nên đăng ký lịch vào thứ 7 và chủ nhật để admin duyệt kịp tuần mới
            // (chỉ cảnh báo UI, không block server)

            // Validate dữ liệu
            if (!day_of_week || !start_time || !end_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ: ngày trong tuần, giờ bắt đầu, giờ kết thúc'
                });
            }

            // Kiểm tra xem đã có lịch cho ngày này chưa
            const existingSchedule = await DoctorSchedule.findOne({
                where: {
                    doctor_id: doctorId,
                    day_of_week: day_of_week
                }
            });

            if (existingSchedule) {
                return res.status(400).json({
                    success: false,
                    message: `Bạn đã có lịch làm việc vào ${day_of_week}. Vui lòng chỉnh sửa lịch hiện tại hoặc xóa để tạo mới.`
                });
            }

            // Tạo lịch mới
            const newSchedule = await DoctorSchedule.create({
                doctor_id: doctorId,
                day_of_week,
                start_time,
                end_time,
                break_start: break_start || null,
                break_end: break_end || null,
                room: room || null,
                is_active: is_active !== undefined ? is_active : true,
                approval_status: 'pending' // Lịch mới cần admin phê duyệt
            });

            console.log(`✅ Doctor ${doctorId} created schedule for ${day_of_week} - Status: pending`);

            res.status(201).json({
                success: true,
                message: 'Tạo lịch làm việc thành công. Lịch đang chờ admin phê duyệt.',
                schedule: newSchedule
            });
        } catch (error) {
            console.error('❌ Error creating schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi tạo lịch làm việc',
                error: error.message
            });
        }
    };

    // Cập nhật lịch làm việc của chính mình
    async updateMySchedule(req, res) {
        try {
            const doctorId = req.user.id;
            const { scheduleId } = req.params;
            const { day_of_week, start_time, end_time, break_start, break_end, room, is_active } = req.body;

            // Kiểm tra lịch có thuộc về bác sĩ này không
            const schedule = await DoctorSchedule.findOne({
                where: {
                    id: scheduleId,
                    doctor_id: doctorId
                }
            });

            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch làm việc hoặc bạn không có quyền chỉnh sửa'
                });
            }

            // Cập nhật
            await schedule.update({
                day_of_week: day_of_week || schedule.day_of_week,
                start_time: start_time || schedule.start_time,
                end_time: end_time || schedule.end_time,
                break_start: break_start !== undefined ? break_start : schedule.break_start,
                break_end: break_end !== undefined ? break_end : schedule.break_end,
                room: room !== undefined ? room : schedule.room,
                is_active: is_active !== undefined ? is_active : schedule.is_active
            });

            console.log(`✅ Doctor ${doctorId} updated schedule ${scheduleId}`);

            res.json({
                success: true,
                message: 'Cập nhật lịch làm việc thành công',
                schedule
            });
        } catch (error) {
            console.error('❌ Error updating schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi cập nhật lịch làm việc',
                error: error.message
            });
        }
    };

    // Xóa lịch làm việc của chính mình
    async deleteMySchedule(req, res) {
        try {
            const doctorId = req.user.id;
            const { scheduleId } = req.params;

            // Kiểm tra lịch có thuộc về bác sĩ này không
            const schedule = await DoctorSchedule.findOne({
                where: {
                    id: scheduleId,
                    doctor_id: doctorId
                }
            });

            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch làm việc hoặc bạn không có quyền xóa'
                });
            }

            // Kiểm tra xem có booking nào đang active không
            const hasActiveBookings = await Booking.count({
                include: [{
                    model: TimeSlot,
                    as: 'timeSlot',
                    where: {
                        doctor_id: doctorId
                    },
                    required: true
                }],
                where: {
                    doctor_id: doctorId,
                    status: {
                        [Op.notIn]: ['cancelled', 'doctor_rejected', 'completed']
                    }
                }
            });

            if (hasActiveBookings > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể xóa lịch vì còn có lịch hẹn chưa hoàn thành. Vui lòng chuyển thành "Không hoạt động" thay vì xóa.'
                });
            }

            await schedule.destroy();

            console.log(`✅ Doctor ${doctorId} deleted schedule ${scheduleId}`);

            res.json({
                success: true,
                message: 'Xóa lịch làm việc thành công'
            });
        } catch (error) {
            console.error('❌ Error deleting schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi xóa lịch làm việc',
                error: error.message
            });
        }
    };

    // Toggle trạng thái hoạt động của lịch làm việc
    async toggleScheduleActive(req, res) {
        try {
            const doctorId = req.user.id;
            const { scheduleId } = req.params;

            const schedule = await DoctorSchedule.findOne({
                where: {
                    id: scheduleId,
                    doctor_id: doctorId
                }
            });

            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy lịch làm việc'
                });
            }

            await schedule.update({
                is_active: !schedule.is_active
            });

            console.log(`✅ Doctor ${doctorId} toggled schedule ${scheduleId} to ${!schedule.is_active ? 'active' : 'inactive'}`);

            res.json({
                success: true,
                message: `Đã ${schedule.is_active ? 'bật' : 'tắt'} lịch làm việc`,
                schedule
            });
        } catch (error) {
            console.error('❌ Error toggling schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi thay đổi trạng thái lịch làm việc',
                error: error.message
            });
        }
    };

    // Lấy thông tin profile bác sĩ để hiển thị
    async getMyProfile(req, res) {
        try {
            const doctorId = req.user.id;

            const doctor = await Doctor.findByPk(doctorId, {
                attributes: ['id', 'full_name', 'email', 'phone', 'specialty_id'],
                include: [{
                    model: require('../Database/Entity').Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }]
            });

            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin bác sĩ'
                });
            }

            res.json({
                success: true,
                doctor
            });
        } catch (error) {
            console.error('❌ Error fetching doctor profile:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy thông tin bác sĩ',
                error: error.message
            });
        }
    };

    // Lấy danh sách phòng khám (active) để bác sĩ chọn
    async getRooms(req, res) {
        try {
            const rooms = await Room.findAll({
                where: { status: 'active' },
                include: [{
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                }],
                order: [['floor', 'ASC'], ['room_number', 'ASC'], ['name', 'ASC']]
            });

            res.json({
                success: true,
                rooms
            });
        } catch (error) {
            console.error('❌ Error fetching rooms:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi lấy danh sách phòng',
                error: error.message
            });
        }
    };

}

module.exports = new DoctorSelfScheduleController();



