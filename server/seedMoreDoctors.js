const { sequelize, Doctor, Specialty, DoctorSchedule } = require('./models');
const bcrypt = require('bcryptjs');

async function seedMoreDoctors() {
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

        console.log(`📋 Tìm thấy ${specialties.length} chuyên khoa`);

        const doctorSchedules = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

        // Danh sách họ và tên Việt Nam
        const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô'];
        const middleNames = ['Văn', 'Thị', 'Hữu', 'Minh', 'Thu', 'Thanh', 'Anh', 'Quốc', 'Đức', 'Tấn'];
        const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Hà', 'Hương', 'Lan', 'Long', 'Mai', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tùng', 'Vân', 'Yến'];

        let doctorCount = 0;

        // Tạo 3 bác sĩ cho mỗi chuyên khoa
        for (const specialty of specialties) {
            console.log(`\n📌 Chuyên khoa: ${specialty.name}`);

            for (let i = 1; i <= 3; i++) {
                // Tạo tên ngẫu nhiên
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const fullName = `${firstName} ${middleName} ${lastName}`;

                // Tạo email và phone duy nhất
                const email = `doctor${specialty.id}_${i}@clinic.com`;
                const phone = `090${specialty.id}${String(i).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`;

                // Kinh nghiệm ngẫu nhiên từ 3-20 năm
                const experience = `${Math.floor(Math.random() * 18) + 3} năm kinh nghiệm`;

                // Trường đại học ngẫu nhiên
                const universities = [
                    'Đại học Y Hà Nội',
                    'Đại học Y TP.HCM',
                    'Đại học Y Dược - ĐH Huế',
                    'Đại học Y Dược - ĐH Thái Nguyên',
                    'Đại học Y Dược Cần Thơ'
                ];
                const education = `Bác sĩ ${universities[Math.floor(Math.random() * universities.length)]}`;

                // Giới tính ngẫu nhiên
                const gender = Math.random() > 0.5 ? 'male' : 'female';

                // Kiểm tra xem bác sĩ đã tồn tại chưa
                const existingDoctor = await Doctor.findOne({ where: { email } });
                if (existingDoctor) {
                    console.log(`   ⏭️ Bỏ qua: ${fullName} (đã tồn tại)`);
                    continue;
                }

                // Tạo bác sĩ mới
                const doctor = await Doctor.create({
                    full_name: fullName,
                    email,
                    phone,
                    password: await bcrypt.hash('123456', 10),
                    gender,
                    specialty_id: specialty.id,
                    description: `Bác sĩ chuyên khoa ${specialty.name} với ${experience.toLowerCase()}. Tốt nghiệp từ ${education}.`,
                    experience,
                    education,
                    is_active: true
                });

                console.log(`   ✅ Tạo mới: ${fullName}`);

                // Tạo lịch làm việc
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

                console.log(`      📅 Đã tạo lịch làm việc (Thứ 2 - Thứ 6)`);
                doctorCount++;
            }
        }

        console.log('\n');
        console.log('🎉 Hoàn thành!');
        console.log(`📊 Đã tạo ${doctorCount} bác sĩ mới`);
        console.log(`📋 Tổng: ${specialties.length} chuyên khoa x 3 bác sĩ = ${specialties.length * 3} bác sĩ`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seedMoreDoctors();
