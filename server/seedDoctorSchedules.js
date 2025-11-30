const { Doctor, DoctorSchedule } = require('./models');

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

// Tạo lịch làm việc mặc định cho bác sĩ
async function createDefaultSchedule(doctorId, doctorName) {
    let created = 0;

    for (const day of DAYS) {
        // Kiểm tra đã có lịch chưa
        const existing = await DoctorSchedule.findOne({
            where: { doctor_id: doctorId, day_of_week: day }
        });

        if (!existing) {
            // Thứ 7 & CN: Làm nửa ngày (sáng)
            const isWeekend = day === 'Thứ 7' || day === 'Chủ nhật';

            await DoctorSchedule.create({
                doctor_id: doctorId,
                day_of_week: day,
                start_time: '08:00:00',
                end_time: isWeekend ? '12:00:00' : '17:00:00',
                break_start: isWeekend ? null : '12:00:00',
                break_end: isWeekend ? null : '13:30:00',
                is_active: true,
                room: null
            });
            created++;
        }
    }

    if (created > 0) {
        console.log(`✅ Tạo ${created} lịch cho: ${doctorName}`);
    }
    return created;
}

async function seedAllSchedules() {
    try {
        console.log('📅 Đang tạo lịch làm việc cho tất cả bác sĩ...\n');

        // Lấy tất cả bác sĩ
        const doctors = await Doctor.findAll({
            attributes: ['id', 'full_name'],
            order: [['id', 'ASC']]
        });

        console.log(`👨‍⚕️ Tìm thấy ${doctors.length} bác sĩ\n`);

        let totalCreated = 0;
        let doctorsUpdated = 0;

        for (const doctor of doctors) {
            const created = await createDefaultSchedule(doctor.id, doctor.full_name);
            if (created > 0) {
                totalCreated += created;
                doctorsUpdated++;
            }
        }

        console.log(`\n📊 Kết quả:`);
        console.log(`   - Bác sĩ được cập nhật: ${doctorsUpdated}`);
        console.log(`   - Tổng lịch tạo mới: ${totalCreated}`);

        // Thống kê
        const scheduleCount = await DoctorSchedule.count();
        console.log(`\n📅 Tổng số lịch trong hệ thống: ${scheduleCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

// Export để có thể sử dụng trong controller
module.exports = { createDefaultSchedule };

// Chạy nếu gọi trực tiếp
if (require.main === module) {
    seedAllSchedules();
}
