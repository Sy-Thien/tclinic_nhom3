require('dotenv').config();
const { Booking, Patient } = require('./models');

async function checkBookings() {
    try {
        console.log('📋 Checking bookings with patient_id...\n');

        const allBookings = await Booking.findAll({
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'email']
                }
            ],
            order: [['id', 'DESC']],
            limit: 10
        });

        console.log(`Found ${allBookings.length} bookings:\n`);

        allBookings.forEach(b => {
            console.log(`  Booking ID: ${b.id}`);
            console.log(`  Patient ID: ${b.patient_id}`);
            console.log(`  Patient Name: ${b.patient?.full_name || 'N/A'}`);
            console.log(`  Patient Email: ${b.patient?.email || 'N/A'}`);
            console.log(`  Status: ${b.status}`);
            console.log(`  Date: ${b.appointment_date}`);
            console.log(`  ---`);
        });

        // Group by patient
        const byPatient = {};
        allBookings.forEach(b => {
            const pid = b.patient_id || 'null';
            byPatient[pid] = (byPatient[pid] || 0) + 1;
        });

        console.log('\n📊 Bookings by patient:');
        for (const [patientId, count] of Object.entries(byPatient)) {
            console.log(`  Patient ID ${patientId}: ${count} bookings`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkBookings();
