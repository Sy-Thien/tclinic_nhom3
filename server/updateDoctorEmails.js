const { sequelize, Doctor } = require('./models');

async function updateDoctorEmails() {
    try {
        console.log('🔄 Đang kết nối database...');
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công\n');

        // Lấy tất cả bác sĩ, sắp xếp theo id
        const doctors = await Doctor.findAll({
            order: [['id', 'ASC']]
        });

        console.log(`📋 Tìm thấy ${doctors.length} bác sĩ\n`);

        let count = 0;
        for (let i = 0; i < doctors.length; i++) {
            const doctor = doctors[i];
            const newEmail = `doctor${i + 1}@clinic.com`;

            // Cập nhật email
            await doctor.update({
                email: newEmail
            });

            console.log(`✅ ${i + 1}. ${doctor.full_name} → ${newEmail}`);
            count++;
        }

        console.log('\n🎉 Hoàn thành!');
        console.log(`📊 Đã cập nhật ${count} email bác sĩ`);
        console.log(`📧 Từ doctor1@clinic.com đến doctor${count}@clinic.com`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    }
}

updateDoctorEmails();
