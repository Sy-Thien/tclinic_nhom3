const { sequelize, Doctor, DoctorSchedule } = require('./models');

async function addSchedules() {
    try {
        console.log('🔄 Đang kết nối database...');
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // Lấy tất cả bác sĩ
        const doctors = await Doctor.findAll();
        console.log(`📋 Tìm thấy ${doctors.length} bác sĩ`);

        const doctorSchedules = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

        for (const doctor of doctors) {
            console.log(`\n👨‍⚕️ Đang xử lý: ${doctor.full_name} (ID: ${doctor.id})`);

            // Kiểm tra lịch hiện có
            const existingSchedules = await DoctorSchedule.findAll({
                where: { doctor_id: doctor.id }
            });

            if (existingSchedules.length > 0) {
                console.log(`   ℹ️ Đã có ${existingSchedules.length} lịch làm việc`);
                continue;
            }

            // Tạo lịch làm việc
            console.log(`   🕒 Đang tạo lịch làm việc...`);
            for (const dayOfWeek of doctorSchedules) {
                await DoctorSchedule.create({
                    doctor_id: doctor.id,
                    day_of_week: dayOfWeek,
                    start_time: '08:00:00',
                    end_time: '17:00:00',
                    break_start: '12:00:00',
                    break_end: '13:00:00',
                    room: `Phòng ${100 + doctor.id}`,
                    is_active: true
                });
            }
            console.log(`   ✅ Đã tạo lịch cho ${doctorSchedules.length} ngày`);
        }

        console.log('\n🎉 Hoàn thành! Đã thêm lịch làm việc cho tất cả bác sĩ');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    }
}

addSchedules();
