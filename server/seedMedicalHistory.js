const { Booking, Patient, Doctor, Drug, Prescription, PrescriptionDetail } = require('./models');
const bcrypt = require('bcryptjs');

async function seedMedicalHistory() {
    try {
        console.log('🌱 Starting to seed medical history...');

        // Lấy hoặc tạo patient
        let patient = await Patient.findOne();
        if (!patient) {
            console.log('📝 No patient found. Creating a test patient...');
            const hashedPassword = await bcrypt.hash('123456', 10);
            patient = await Patient.create({
                email: 'patient@test.com',
                password: hashedPassword,
                full_name: 'Nguyễn Văn A',
                phone: '0901234567',
                gender: 'male',
                birthday: '1990-01-01',
                address: '123 Nguyễn Huệ, TP.HCM'
            });
            console.log(`✅ Created test patient: ${patient.full_name} (${patient.email})`);
            console.log(`   📧 Email: patient@test.com | 🔑 Password: 123456`);
        }

        console.log(`✅ Using Patient ID: ${patient.id}, Name: ${patient.full_name}`);        // Lấy doctor đầu tiên
        const doctor = await Doctor.findOne();
        if (!doctor) {
            console.log('❌ No doctor found. Please seed doctors first.');
            process.exit(1);
        }

        console.log(`✅ Found Doctor ID: ${doctor.id}`);

        // Lấy một vài thuốc
        const drugs = await Drug.findAll({ limit: 3 });
        if (drugs.length === 0) {
            console.log('❌ No drugs found. Please seed drugs first.');
            process.exit(1);
        }

        console.log(`✅ Found ${drugs.length} drugs`);

        // Lấy hoặc tạo service
        const { Service } = require('./models');
        let service = await Service.findOne();
        if (!service) {
            console.log('📝 No service found. Creating a test service...');
            service = await Service.create({
                specialty_id: doctor.specialty_id,
                name: 'Khám tổng quát',
                description: 'Khám sức khỏe tổng quát',
                price: 200000,
                duration: 30
            });
            console.log(`✅ Created test service: ${service.name}`);
        }
        console.log(`✅ Using Service ID: ${service.id}`);

        // Tạo 3 booking completed với prescription
        const bookingsData = [
            {
                appointment_date: new Date('2025-11-20 09:00:00'),
                chief_complaint: 'Đau đầu, sốt nhẹ',
                diagnosis: 'Viêm họng cấp tính, sốt virus',
                conclusion: 'Nghỉ ngơi, uống nhiều nước, tái khám sau 5 ngày nếu không đỡ'
            },
            {
                appointment_date: new Date('2025-11-15 14:00:00'),
                chief_complaint: 'Ho khan, khó thở',
                diagnosis: 'Viêm phế quản cấp',
                conclusion: 'Uống đủ thuốc theo đơn, tránh khói bụi, tái khám sau 7 ngày'
            },
            {
                appointment_date: new Date('2025-11-10 10:30:00'),
                chief_complaint: 'Đau bụng, tiêu chảy',
                diagnosis: 'Nhiễm khuẩn đường ruột nhẹ',
                conclusion: 'Ăn nhạt, uống thuốc đầy đủ, tái khám nếu còn đau sau 3 ngày'
            }
        ];

        for (let i = 0; i < bookingsData.length; i++) {
            const bookingData = bookingsData[i];

            // Tạo booking code
            const bookingCode = `BK${Date.now()}${i}`;

            // Tạo booking
            const booking = await Booking.create({
                booking_code: bookingCode,
                patient_id: patient.id,
                patient_name: patient.full_name,
                patient_phone: patient.phone,
                patient_email: patient.email,
                patient_gender: patient.gender,
                patient_dob: patient.birthday,
                patient_address: patient.address,
                doctor_id: doctor.id,
                specialty_id: doctor.specialty_id,
                service_id: service.id,
                appointment_date: bookingData.appointment_date,
                time_slot: '09:00-10:00',
                symptoms: bookingData.chief_complaint,
                chief_complaint: bookingData.chief_complaint,
                diagnosis: bookingData.diagnosis,
                conclusion: bookingData.conclusion,
                status: 'completed',
                booking_type: 'with_doctor'
            });

            console.log(`✅ Created booking ID: ${booking.id}`);

            // Tạo prescription
            const prescriptionCode = `PR${Date.now()}${i}`;
            const prescription = await Prescription.create({
                prescription_code: prescriptionCode,
                booking_id: booking.id,
                patient_id: patient.id,
                doctor_id: doctor.id,
                notes: 'Uống thuốc đúng giờ, sau ăn. Tránh đồ cay nóng.'
            });

            console.log(`✅ Created prescription ID: ${prescription.id}`);

            // Tạo prescription details (2-3 thuốc mỗi đơn)
            const numDrugs = Math.min(2 + i, drugs.length);
            for (let j = 0; j < numDrugs; j++) {
                await PrescriptionDetail.create({
                    prescription_id: prescription.id,
                    drug_id: drugs[j].id,
                    quantity: 10 + (j * 5),
                    dosage: `${j + 1} viên/lần, ngày ${j + 2} lần`,
                    duration: `${5 + i} ngày`
                });
            }

            console.log(`✅ Added ${numDrugs} drugs to prescription`);
        }

        console.log('\n🎉 Successfully seeded medical history!');
        console.log(`📋 Created ${bookingsData.length} completed bookings with prescriptions`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding medical history:', error);
        process.exit(1);
    }
}

seedMedicalHistory();
