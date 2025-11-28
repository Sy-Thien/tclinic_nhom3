const { sequelize, Doctor, Specialty, DoctorSchedule } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        console.log('🔄 Đang kết nối database...');
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // Lấy tất cả specialties
        const specialties = await Specialty.findAll();
        if (specialties.length === 0) {
            console.error('❌ Không có chuyên khoa. Chạy seedSpecialties.js trước!');
            process.exit(1);
        }

        const doctorSchedules = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
        const doctors = [
            { full_name: 'Nguyễn Văn An', email: 'doctor1@clinic.com', phone: '0901234567', experience: '10 năm kinh nghiệm', education: 'Bác sĩ ĐH Y Hà Nội' },
            { full_name: 'Trần Thị Bình', email: 'doctor2@clinic.com', phone: '0901234568', experience: '8 năm kinh nghiệm', education: 'Bác sĩ ĐH Y TP.HCM' },
            { full_name: 'Lê Văn Cương', email: 'doctor3@clinic.com', phone: '0901234569', experience: '12 năm kinh nghiệm', education: 'Bác sĩ ĐH Y Đà Nẵng' },
            { full_name: 'Phạm Thị Dung', email: 'doctor4@clinic.com', phone: '0901234570', experience: '7 năm kinh nghiệm', education: 'Bác sĩ ĐH Y Hà Nội' },
            { full_name: 'Hoàng Văn Em', email: 'doctor5@clinic.com', phone: '0901234571', experience: '15 năm kinh nghiệm', education: 'Bác sĩ ĐH Y Hà Nội' },
            { full_name: 'Nguyễn Nhật Thịnh', email: 'doctor6@clinic.com', phone: '0901234580', experience: '6 năm kinh nghiệm', education: 'Bác sĩ ĐH Y TP.HCM' },
        ];

        console.log('➕ Đang tạo bác sĩ...');
        for (let i = 0; i < doctors.length; i++) {
            const doctorData = doctors[i];
            const specialty = specialties[i % specialties.length];

            const [doctor, created] = await Doctor.findOrCreate({
                where: { email: doctorData.email },
                defaults: {
                    ...doctorData,
                    password: await bcrypt.hash('123456', 10),
                    gender: i % 2 === 0 ? 'male' : 'female',
                    specialty_id: specialty.id,
                    description: `Bác sĩ chuyên ngành ${specialty.name}`,
                    is_active: true
                }
            });

            if (created) {
                console.log(`   ✓ Tạo mới: ${doctor.full_name}`);

                // Tạo lịch làm việc
                console.log(`      🕒 Tạo lịch làm việc cho ${doctor.full_name}...`);
                for (const dayOfWeek of doctorSchedules) {
                    await DoctorSchedule.findOrCreate({
                        where: { doctor_id: doctor.id, day_of_week: dayOfWeek },
                        defaults: {
                            doctor_id: doctor.id,
                            day_of_week: dayOfWeek,
                            start_time: '08:00:00',
                            end_time: '17:00:00',
                            break_start: '12:00:00',
                            break_end: '13:00:00',
                            room: `Phòng ${100 + doctor.id}`,
                            is_active: true
                        }
                    });
                }
                console.log(`      ✓ Đã tạo lịch cho 5 ngày hôm nay`);
            } else {
                console.log(`   ✓ Đã tồn tại: ${doctor.full_name}`);
            }
        }

        console.log('');
        console.log('🎉 Hoàn thành! Đã tạo', doctors.length, 'bác sĩ với lịch làm việc');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seed();
