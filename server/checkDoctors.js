const { sequelize, Doctor, Specialty } = require('./models');

async function checkDoctors() {
    try {
        await sequelize.authenticate();

        const specialties = await Specialty.findAll({
            include: [{
                model: Doctor,
                as: 'doctors'
            }],
            order: [['id', 'ASC']]
        });

        console.log('📊 THỐNG KÊ BÁC SĨ THEO CHUYÊN KHOA\n');

        let totalDoctors = 0;
        for (const specialty of specialties) {
            const doctorCount = specialty.doctors.length;
            totalDoctors += doctorCount;

            console.log(`📌 ${specialty.name}: ${doctorCount} bác sĩ`);
            specialty.doctors.forEach((doc, idx) => {
                console.log(`   ${idx + 1}. ${doc.full_name} - ${doc.phone}`);
            });
            console.log('');
        }

        console.log(`\n✅ Tổng cộng: ${totalDoctors} bác sĩ trong ${specialties.length} chuyên khoa`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

checkDoctors();
