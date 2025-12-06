/**
 * Script tạo dữ liệu mẫu với MÃ BOOKING ĐẸP
 * Mã booking: BK000001, BK000002, ...
 */

const { Booking, Patient, Doctor, Specialty, Review, MedicalHistory, Prescription, PrescriptionDetail, Drug } = require('./models');
const { Op } = require('sequelize');
const sequelize = require('./config/database');

// Triệu chứng và chẩn đoán theo chuyên khoa
const dataBySpecialty = {
    1: { symptoms: ['Đau bụng vùng hạ sườn phải', 'Sưng đau vùng bẹn', 'Đau lưng kéo dài'], diagnoses: ['Viêm ruột thừa cấp', 'Thoát vị bẹn', 'Thoát vị đĩa đệm L4-L5'] },
    2: { symptoms: ['Đau đầu, chóng mặt', 'Mất ngủ kéo dài', 'Tê bì tay chân'], diagnoses: ['Đau nửa đầu migraine', 'Rối loạn tiền đình', 'Thiếu máu não'] },
    3: { symptoms: ['Ho kéo dài, khó thở', 'Đau tức ngực', 'Tim đập nhanh'], diagnoses: ['Viêm phế quản', 'Tăng huyết áp độ 2', 'Rối loạn nhịp tim'] },
    4: { symptoms: ['Đau khớp gối', 'Thoái hóa cột sống', 'Đau vai gáy'], diagnoses: ['Viêm khớp gối', 'Thoái hóa đốt sống cổ', 'Viêm quanh khớp vai'] },
    5: { symptoms: ['Ngứa da, nổi mẩn đỏ', 'Rụng tóc', 'Mụn trứng cá'], diagnoses: ['Viêm da dị ứng', 'Nấm da', 'Chàm thể tạng'] },
    6: { symptoms: ['Đau tai, chảy mủ', 'Viêm họng', 'Nghẹt mũi'], diagnoses: ['Viêm tai giữa', 'Viêm amidan mãn', 'Viêm xoang'] },
    7: { symptoms: ['Đau răng', 'Sâu răng', 'Viêm lợi'], diagnoses: ['Sâu răng số 6', 'Viêm nha chu', 'Viêm tủy răng'] },
    8: { symptoms: ['Cận thị tăng độ', 'Đau mắt đỏ', 'Khô mắt'], diagnoses: ['Cận thị -3.0D', 'Viêm kết mạc', 'Khô mắt'] },
    9: { symptoms: ['Rối loạn kinh nguyệt', 'Khám thai định kỳ', 'Viêm phụ khoa'], diagnoses: ['Rối loạn kinh nguyệt', 'Thai 12 tuần - bình thường', 'Viêm âm đạo'] },
    10: { symptoms: ['Sốt cao, ho', 'Tiêu chảy', 'Viêm phổi'], diagnoses: ['Viêm phổi', 'Tiêu chảy cấp', 'Sốt virus'] },
    11: { symptoms: ['Tiểu buốt, tiểu rắt', 'Sỏi thận', 'Viêm đường tiết niệu'], diagnoses: ['Viêm bàng quang', 'Sỏi thận 5mm', 'Nhiễm trùng đường tiểu'] },
    12: { symptoms: ['Đau dạ dày', 'Trào ngược dạ dày', 'Táo bón'], diagnoses: ['Viêm dạ dày HP+', 'Trào ngược dạ dày thực quản', 'Hội chứng ruột kích thích'] },
    13: { symptoms: ['Stress, lo âu', 'Trầm cảm', 'Mất ngủ'], diagnoses: ['Rối loạn lo âu', 'Trầm cảm nhẹ', 'Stress'] },
    14: { symptoms: ['Tiểu đường', 'Rối loạn tuyến giáp', 'Béo phì'], diagnoses: ['Đái tháo đường type 2', 'Cường giáp', 'Béo phì độ 1'] },
    15: { symptoms: ['Ung thư phổi', 'Khám tầm soát ung thư', 'Hóa trị liệu'], diagnoses: ['Ung thư phổi giai đoạn 1', 'Nghi ngờ ung thư', 'Theo dõi sau hóa trị'] }
};

const treatmentPlans = [
    'Điều trị nội khoa, uống thuốc theo đơn, tái khám sau 2 tuần',
    'Nghỉ ngơi, uống thuốc đều đặn, hạn chế vận động mạnh',
    'Điều trị bảo tồn, vật lý trị liệu 2 lần/tuần',
    'Chế độ ăn kiêng, tập thể dục nhẹ, tái khám sau 1 tháng'
];

const reviewComments = [
    'Bác sĩ rất tận tâm, giải thích kỹ về bệnh tình.',
    'Khám rất kỹ, tư vấn nhiệt tình. Cảm ơn bác sĩ.',
    'Bác sĩ giỏi, chẩn đoán chính xác.',
    'Hài lòng với kết quả điều trị.',
    'Bác sĩ tư vấn rất chi tiết, dễ hiểu.'
];

async function cleanAndSeed() {
    try {
        console.log('🚀 Bắt đầu tạo dữ liệu mẫu với MÃ ĐẸP...\n');

        // XÓA DỮ LIỆU CŨ THEO THỨ TỰ ĐÚNG
        console.log('🗑️ Xóa dữ liệu cũ...');

        // 1. Lấy booking IDs có mã SEED
        const seedBookings = await Booking.findAll({
            where: { booking_code: { [Op.like]: 'SEED%' } },
            attributes: ['id']
        });
        const seedBookingIds = seedBookings.map(b => b.id);

        if (seedBookingIds.length > 0) {
            // 2. Xóa prescription_details trước
            const prescriptions = await Prescription.findAll({
                where: { booking_id: { [Op.in]: seedBookingIds } },
                attributes: ['id']
            });
            const prescriptionIds = prescriptions.map(p => p.id);

            if (prescriptionIds.length > 0) {
                await PrescriptionDetail.destroy({ where: { prescription_id: { [Op.in]: prescriptionIds } } });
                console.log(`   ✓ Xóa ${prescriptionIds.length} prescription details`);

                await Prescription.destroy({ where: { id: { [Op.in]: prescriptionIds } } });
                console.log(`   ✓ Xóa ${prescriptionIds.length} prescriptions`);
            }

            // 3. Xóa medical_history
            await MedicalHistory.destroy({ where: { booking_id: { [Op.in]: seedBookingIds } } });
            console.log(`   ✓ Xóa medical histories`);

            // 4. Xóa reviews (xóa theo comment có text mẫu)
            await Review.destroy({ where: { comment: { [Op.like]: '%Bác sĩ%' } } });
            console.log(`   ✓ Xóa reviews`);

            // 5. Cuối cùng xóa bookings
            await Booking.destroy({ where: { id: { [Op.in]: seedBookingIds } } });
            console.log(`   ✓ Xóa ${seedBookingIds.length} bookings SEED`);
        }

        // Lấy dữ liệu cần thiết
        const doctors = await Doctor.findAll({ attributes: ['id', 'full_name', 'specialty_id'] });
        const patients = await Patient.findAll({ limit: 30 });
        const drugs = await Drug.findAll({ limit: 15 });

        console.log(`\n📋 ${doctors.length} bác sĩ, ${patients.length} bệnh nhân, ${drugs.length} thuốc\n`);

        const today = new Date();
        const formatDate = (d) => d.toISOString().split('T')[0];

        let bookingCounter = 1;
        let prescriptionCounter = 1;
        let totalBookings = 0, totalMedicalHistories = 0, totalPrescriptions = 0, totalReviews = 0;

        // Tạo dữ liệu cho mỗi bác sĩ
        for (const doctor of doctors) {
            const specData = dataBySpecialty[doctor.specialty_id] || dataBySpecialty[1];
            const numBookings = Math.floor(Math.random() * 3) + 4; // 4-6 bookings
            const shuffledPatients = [...patients].sort(() => Math.random() - 0.5);

            for (let i = 0; i < numBookings; i++) {
                const patient = shuffledPatients[i % shuffledPatients.length];
                const daysOffset = i < 2 ? 0 : (i - 1);
                const appointmentDate = new Date(today.getTime() - daysOffset * 24 * 60 * 60 * 1000);

                let status, diagnosis = null, conclusion = null;
                if (daysOffset === 0 && i === 0) status = 'confirmed';
                else if (daysOffset === 0 && i === 1) status = 'pending';
                else {
                    status = 'completed';
                    diagnosis = specData.diagnoses[Math.floor(Math.random() * specData.diagnoses.length)];
                    conclusion = treatmentPlans[Math.floor(Math.random() * treatmentPlans.length)];
                }

                const hours = 8 + Math.floor(i * 1.5);
                const minutes = (i % 2) * 30;

                // MÃ BOOKING ĐẸP: BK000001, BK000002, ...
                const bookingCode = `BK${String(bookingCounter++).padStart(6, '0')}`;

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
                    specialty_id: doctor.specialty_id || 1,
                    service_id: 1,
                    appointment_date: formatDate(appointmentDate),
                    appointment_time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
                    symptoms: specData.symptoms[Math.floor(Math.random() * specData.symptoms.length)],
                    diagnosis,
                    conclusion,
                    status
                });
                totalBookings++;

                // Tạo MedicalHistory và Prescription cho completed
                if (status === 'completed') {
                    await MedicalHistory.create({
                        booking_id: booking.id,
                        patient_id: patient.id,
                        doctor_id: doctor.id,
                        visit_date: booking.appointment_date,
                        visit_time: booking.appointment_time,
                        symptoms: booking.symptoms,
                        diagnosis,
                        conclusion,
                        treatment_plan: treatmentPlans[Math.floor(Math.random() * treatmentPlans.length)],
                        note: 'Tái khám định kỳ'
                    });
                    totalMedicalHistories++;

                    // 70% có đơn thuốc
                    if (drugs.length > 0 && Math.random() > 0.3) {
                        const rxCode = `RX${String(prescriptionCounter++).padStart(6, '0')}`;
                        const prescription = await Prescription.create({
                            booking_id: booking.id,
                            patient_id: patient.id,
                            doctor_id: doctor.id,
                            prescription_code: rxCode,
                            note: 'Uống thuốc đúng liều, đúng giờ'
                        });

                        const numDrugs = Math.floor(Math.random() * 2) + 2;
                        const shuffledDrugs = [...drugs].sort(() => Math.random() - 0.5);
                        for (let j = 0; j < Math.min(numDrugs, shuffledDrugs.length); j++) {
                            await PrescriptionDetail.create({
                                prescription_id: prescription.id,
                                drug_id: shuffledDrugs[j].id,
                                quantity: Math.floor(Math.random() * 15) + 10,
                                dosage: ['1 viên x 3 lần/ngày', '2 viên x 2 lần/ngày', '1 viên sáng, 1 viên tối'][Math.floor(Math.random() * 3)],
                                note: ['Uống sau ăn', 'Uống trước ăn', ''][Math.floor(Math.random() * 3)]
                            });
                        }
                        totalPrescriptions++;
                    }

                    // 50% có review
                    if (Math.random() > 0.5) {
                        await Review.create({
                            patient_id: patient.id,
                            doctor_id: doctor.id,
                            booking_id: booking.id,
                            rating: Math.floor(Math.random() * 2) + 4,
                            comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
                            is_anonymous: Math.random() > 0.7,
                            status: 'approved'
                        });
                        totalReviews++;
                    }
                }
            }
            process.stdout.write(`✅ ${doctor.full_name}\n`);
        }

        console.log('\n' + '═'.repeat(50));
        console.log('📊 TỔNG KẾT:');
        console.log('═'.repeat(50));
        console.log(`📅 Bookings:      ${totalBookings} (BK000001 - BK${String(bookingCounter - 1).padStart(6, '0')})`);
        console.log(`📋 Hồ sơ bệnh án: ${totalMedicalHistories}`);
        console.log(`💊 Đơn thuốc:     ${totalPrescriptions} (RX000001 - RX${String(prescriptionCounter - 1).padStart(6, '0')})`);
        console.log(`⭐ Đánh giá:      ${totalReviews}`);
        console.log('═'.repeat(50));
        console.log('\n🎉 Hoàn thành!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

cleanAndSeed();
