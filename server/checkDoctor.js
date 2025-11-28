const { Doctor } = require('./models');

async function checkDoctor() {
    try {
        const doctor = await Doctor.findOne({
            where: { email: 'doctor1_1@clinic.com' }
        });

        if (doctor) {
            console.log('✅ Doctor found:', {
                id: doctor.id,
                name: doctor.full_name,
                email: doctor.email
            });
        } else {
            console.log('❌ Doctor not found with email: doctor1_1@clinic.com');

            // Tìm doctor đầu tiên
            const firstDoctor = await Doctor.findOne();
            if (firstDoctor) {
                console.log('📋 First doctor in database:', {
                    id: firstDoctor.id,
                    name: firstDoctor.full_name,
                    email: firstDoctor.email
                });
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDoctor();
