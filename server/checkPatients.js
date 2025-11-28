const { Patient } = require('./models');

async function checkPatients() {
    try {
        const patients = await Patient.findAll({
            attributes: ['id', 'full_name', 'email', 'phone'],
            order: [['id', 'ASC']],
            limit: 10
        });

        console.log('📋 First 10 patients:');
        patients.forEach(p => {
            console.log(`  ID: ${p.id}, Name: ${p.full_name}, Email: ${p.email}`);
        });

        console.log(`\n✅ Total patients in database: ${await Patient.count()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkPatients();
