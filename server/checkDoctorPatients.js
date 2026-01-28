const { Booking, sequelize } = require('./models');
const { Op } = require('sequelize');

async function check() {
    try {
        const bookings = await Booking.findAll({
            where: {
                status: { [Op.in]: ['completed', 'confirmed', 'pending', 'waiting_doctor_confirmation'] }
            },
            attributes: ['doctor_id', 'patient_name', 'status'],
            raw: true,
            order: [['doctor_id', 'ASC']]
        });

        // Group by doctor
        const doctorMap = {};
        bookings.forEach(b => {
            if (!doctorMap[b.doctor_id]) {
                doctorMap[b.doctor_id] = new Set();
            }
            doctorMap[b.doctor_id].add(b.patient_name);
        });

        console.log('\n📊 Thống kê bệnh nhân theo bác sĩ:\n');
        Object.entries(doctorMap).forEach(([doctorId, patients]) => {
            console.log(`Doctor ${doctorId}: ${patients.size} bệnh nhân - ${[...patients].join(', ')}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

check();
