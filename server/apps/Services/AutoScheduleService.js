const { DoctorSchedule, Doctor } = require('../Database/Entity');
const { Op } = require('sequelize');

// Các ngày trong tuần sẽ tự duyệt (Thứ 2 → Thứ 6)
const DEFAULT_WEEKDAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

/**
 * Service tự động duyệt lịch làm việc full tuần cho bác sĩ không đăng ký
 * Chạy vào sáng thứ 2 (giờ Việt Nam) hàng tuần
 */
class AutoScheduleService {

    /**
     * Kiểm tra và tự tạo lịch full tuần cho các bác sĩ chưa đăng ký
     */
    async checkAndAutoApprove() {
        try {
            console.log('🔄 [AutoSchedule] Checking doctors without schedules...');

            const doctors = await Doctor.findAll({
                where: { is_active: true },
                attributes: ['id', 'full_name']
            });

            let autoCreated = 0;

            for (const doctor of doctors) {
                // Kiểm tra bác sĩ có lịch approved hoặc pending không
                const existingCount = await DoctorSchedule.count({
                    where: {
                        doctor_id: doctor.id,
                        approval_status: {
                            [Op.in]: ['approved', 'pending']
                        }
                    }
                });

                if (existingCount === 0) {
                    // Không có lịch → tự tạo full tuần (Thứ 2 → Thứ 6)
                    await this.createDefaultSchedule(doctor.id);
                    autoCreated++;
                    console.log(`✅ [AutoSchedule] Created default schedule for doctor ${doctor.id} (${doctor.full_name})`);
                }
            }

            console.log(`✅ [AutoSchedule] Done — auto-created for ${autoCreated}/${doctors.length} doctors`);
            return { total: doctors.length, autoCreated };

        } catch (error) {
            console.error('❌ [AutoSchedule] Error:', error);
        }
    }

    /**
     * Tạo lịch mặc định Thứ 2 → Thứ 6, Ca cả ngày, đã duyệt
     */
    async createDefaultSchedule(doctorId) {
        const now = new Date();
        const rows = DEFAULT_WEEKDAYS.map(day => ({
            doctor_id: doctorId,
            day_of_week: day,
            start_time: '07:00:00',
            end_time: '17:00:00',
            break_start: '12:00:00',
            break_end: '13:00:00',
            is_active: true,
            approval_status: 'approved',
            approved_at: now
        }));

        // ignoreDuplicates: bỏ qua nếu ngày đó đã có lịch
        await DoctorSchedule.bulkCreate(rows, { ignoreDuplicates: true });
    }

    /**
     * Khởi động scheduler — kiểm tra mỗi giờ, chạy vào sáng thứ 2 giờ VN
     */
    startScheduler() {
        console.log('🚀 [AutoSchedule] Scheduler started — checks hourly, runs Monday morning VN time');

        let lastRunDate = null;

        const checkAndRun = async () => {
            try {
                // Tính thời gian Việt Nam (UTC+7)
                const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
                const dayOfWeek = vnNow.getUTCDay(); // 0=CN, 1=T2, ..., 6=T7
                const hour = vnNow.getUTCHours();
                const dateStr = vnNow.toISOString().split('T')[0];

                // Chạy vào thứ 2 (dayOfWeek === 1) từ 0:00 → 6:59 giờ VN, và chưa chạy hôm nay
                if (dayOfWeek === 1 && hour < 7 && lastRunDate !== dateStr) {
                    lastRunDate = dateStr;
                    console.log(`🔔 [AutoSchedule] Monday morning detected (${dateStr}), running...`);
                    await this.checkAndAutoApprove();
                }
            } catch (err) {
                console.error('❌ [AutoSchedule] Hourly check error:', err.message);
            }
        };

        // Chạy kiểm tra ngay lần đầu
        checkAndRun();

        // Sau đó kiểm tra mỗi giờ
        setInterval(checkAndRun, 60 * 60 * 1000);
    }
}

module.exports = new AutoScheduleService();

