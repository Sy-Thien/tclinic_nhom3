const { Patient, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function createPatientId1() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Check if patient id=1 exists
        const existing = await Patient.findByPk(1);
        if (existing) {
            console.log('✅ Patient ID=1 already exists:', existing.full_name);
            process.exit(0);
        }

        // Create patient with id=1
        const hashedPassword = await bcrypt.hash('123456', 10);

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        await Patient.create({
            id: 1,
            full_name: 'Bệnh Nhân Test',
            email: 'patient0@gmail.com',
            password: hashedPassword,
            phone: '0900000000',
            date_of_birth: '1990-01-01',
            gender: 'male',
            address: 'Hà Nội'
        });

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Created patient with ID=1 (patient0@gmail.com / 123456)');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createPatientId1();
