// Test script để debug my-patients API
require('dotenv').config();
const { Booking, Patient, sequelize } = require('./models');
const { Op } = require('sequelize');

async function test() {
    try {
        const doctor_id = 39;
        console.log('👥 Testing my-patients for doctor:', doctor_id);

        // Lấy tất cả booking của bác sĩ này
        const bookings = await Booking.findAll({
            where: {
                doctor_id,
                status: { [Op.in]: ['completed', 'confirmed', 'pending', 'waiting_doctor_confirmation'] }
            },
            include: [
                {
                    model: Patient,
                    as: 'patient',
                    attributes: ['id', 'full_name', 'phone', 'email', 'gender', 'birthday', 'address'],
                    required: false
                }
            ],
            order: [['appointment_date', 'DESC']],
            raw: false
        });

        console.log('\n📋 Bookings found:', bookings.length);
        bookings.forEach(b => {
            console.log(`  - ${b.booking_code}: patient_name="${b.patient_name}", patient.full_name="${b.patient?.full_name}" (status: ${b.status})`);
        });

        // Tạo map bệnh nhân unique
        const patientMap = new Map();

        bookings.forEach(booking => {
            const patientId = booking.patient?.id || booking.patient_id;
            // ✅ ƯU TIÊN dùng patient_name từ booking
            const patientName = booking.patient_name || booking.patient?.full_name;

            if (!patientId && !patientName) return;

            const key = patientName || patientId;

            if (patientMap.has(key)) {
                const existing = patientMap.get(key);
                existing.visitCount++;
            } else {
                patientMap.set(key, {
                    id: patientId,
                    full_name: patientName || 'N/A',
                    visitCount: 1,
                    lastVisit: booking.appointment_date
                });
            }
        });

        const patients = Array.from(patientMap.values());

        console.log('\n✅ Unique patients:', patients.length);
        patients.forEach(p => {
            console.log(`  - ${p.full_name} (${p.visitCount} visits, last: ${p.lastVisit})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

test();
