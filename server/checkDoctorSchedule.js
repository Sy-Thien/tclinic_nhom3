require('dotenv').config();
const { Booking, Doctor, Patient } = require('./models');

async function checkSchedules() {
    try {
        console.log('📋 Kiểm tra lịch khám trong database...\n');

        // Lấy tất cả bookings
        const allBookings = await Booking.findAll({
            include: [
                {
                    model: Doctor,
                    as: 'doctor',
                    attributes: ['id', 'full_name', 'email']
                },
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name']
                }
            ],
            order: [['appointment_date', 'DESC']],
            limit: 10
        });

        console.log(`📊 Tổng số bookings (10 mới nhất):\n`);
        allBookings.forEach(booking => {
            console.log(`  ID: ${booking.id}`);
            console.log(`  Doctor ID: ${booking.doctor_id} - ${booking.doctor?.full_name || 'N/A'} (${booking.doctor?.email || 'N/A'})`);
            console.log(`  Patient: ${booking.patient?.full_name || 'N/A'}`);
            console.log(`  Date: ${booking.appointment_date} ${booking.appointment_time}`);
            console.log(`  Status: ${booking.status}`);
            console.log(`  ---`);
        });

        // Thống kê theo doctor
        const bookingsByDoctor = {};
        allBookings.forEach(b => {
            const did = b.doctor_id || 'null';
            bookingsByDoctor[did] = (bookingsByDoctor[did] || 0) + 1;
        });

        console.log('\n📊 Thống kê theo bác sĩ:');
        for (const [doctorId, count] of Object.entries(bookingsByDoctor)) {
            console.log(`  Doctor ID ${doctorId}: ${count} lịch hẹn`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkSchedules();
