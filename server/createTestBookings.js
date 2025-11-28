const { sequelize, Booking, Patient } = require('./models');

async function createTestBookings() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // Tìm patient_id ngẫu nhiên
        const patients = await Patient.findAll({ limit: 3 });

        if (patients.length === 0) {
            console.log('❌ Không có patient nào trong database');
            return;
        }

        const bookings = [
            {
                booking_code: 'TEST001',
                patient_id: patients[0].id,
                patient_name: patients[0].full_name || 'Nguyễn Văn Test',
                patient_phone: patients[0].phone || '0901234567',
                doctor_id: 18,
                specialty_id: 1,
                service_id: 1,
                appointment_date: '2025-11-23',
                appointment_time: '08:00',
                symptoms: 'Đau đầu, chóng mặt',
                status: 'waiting_doctor_confirmation'
            },
            {
                booking_code: 'TEST002',
                patient_id: patients[1]?.id || patients[0].id,
                patient_name: patients[1]?.full_name || 'Trần Thị Test',
                patient_phone: patients[1]?.phone || '0901234568',
                doctor_id: 18,
                specialty_id: 1,
                service_id: 1,
                appointment_date: '2025-11-23',
                appointment_time: '09:00',
                symptoms: 'Ho, sốt nhẹ',
                status: 'confirmed'
            },
            {
                booking_code: 'TEST003',
                patient_id: patients[2]?.id || patients[0].id,
                patient_name: patients[2]?.full_name || 'Lê Văn Test',
                patient_phone: patients[2]?.phone || '0901234569',
                doctor_id: 18,
                specialty_id: 1,
                service_id: 1,
                appointment_date: '2025-11-23',
                appointment_time: '10:00',
                symptoms: 'Đau bụng',
                status: 'completed',
                diagnosis: 'Viêm dạ dày',
                conclusion: 'Đã khám xong'
            }
        ];

        for (const booking of bookings) {
            await Booking.create(booking);
            console.log(`✅ Tạo booking: ${booking.appointment_time} - ${booking.status}`);
        }

        console.log('✅ Đã tạo 3 booking test cho doctor18');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

createTestBookings();
