const { Doctor } = require('./models');

async function findNguyenVanAn() {
    try {
        const doctor = await Doctor.findOne({
            where: { full_name: 'Nguyễn Văn An' }
        });

        if (doctor) {
            console.log('✅ Nguyễn Văn An:');
            console.log('   Email:', doctor.email);
            console.log('   Password: 123456');
            console.log('\n📧 Login với:', doctor.email, '/ 123456');
        } else {
            console.log('❌ Không tìm thấy bác sĩ Nguyễn Văn An');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

findNguyenVanAn();
