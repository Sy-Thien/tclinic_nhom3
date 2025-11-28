const Doctor = require('./models/Doctor');

async function checkDoctors() {
    try {
        console.log('📊 Danh sách bác sĩ trong database:\n');

        const doctors = await Doctor.findAll({
            attributes: ['id', 'full_name', 'email'],
            order: [['id', 'ASC']],
            limit: 30
        });

        console.log('ID | Tên | Email');
        console.log('-'.repeat(60));

        doctors.forEach(d => {
            console.log(`${d.id.toString().padEnd(3)} | ${d.full_name.padEnd(30)} | ${d.email}`);
        });

        console.log(`\nTotal: ${doctors.length} doctors`);
        console.log(`ID Min: ${doctors[0]?.id}, ID Max: ${doctors[doctors.length - 1]?.id}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkDoctors();
