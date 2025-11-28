const { Booking } = require('./models');

async function checkBooking() {
    try {
        const booking = await Booking.findOne({
            where: { booking_code: 'BK37506478' }
        });

        if (booking) {
            console.log('📋 Booking details:');
            console.log('  ID:', booking.id);
            console.log('  Code:', booking.booking_code);
            console.log('  Patient:', booking.patient_name);
            console.log('  Doctor ID:', booking.doctor_id);
            console.log('  Date:', booking.appointment_date);
            console.log('  Time:', booking.appointment_time);
            console.log('  Status:', booking.status);
            console.log('  Created:', booking.created_at);
        } else {
            console.log('❌ Booking not found');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkBooking();
