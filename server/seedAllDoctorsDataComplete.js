/**
 * Script tạo dữ liệu mẫu ĐẦY ĐỦ cho TẤT CẢ bác sĩ
 * Bao gồm: Bookings, Reviews, MedicalHistory (Hồ sơ bệnh án), Prescriptions
 */

const { Booking, Patient, Doctor, Specialty, Review, MedicalHistory, Prescription, PrescriptionDetail, Drug } = require('./models');
const { Op } = require('sequelize');

// Danh sách triệu chứng mẫu theo chuyên khoa
const symptomsBySpecialty = {
    1: ['Đau bụng vùng hạ sườn phải', 'Sưng đau vùng bẹn', 'Đau lưng kéo dài', 'Khám sau phẫu thuật', 'Thoát vị đĩa đệm'],
    2: ['Đau đầu, chóng mặt', 'Mất ngủ kéo dài', 'Tê bì tay chân', 'Đau dây thần kinh', 'Rối loạn tiền đình'],
    3: ['Ho kéo dài, khó thở', 'Đau tức ngực', 'Tim đập nhanh', 'Huyết áp cao', 'Khám tim mạch định kỳ'],
    4: ['Đau khớp gối', 'Gãy xương tay', 'Thoái hóa cột sống', 'Đau vai gáy', 'Viêm khớp'],
    5: ['Ngứa da, nổi mẩn đỏ', 'Rụng tóc', 'Mụn trứng cá', 'Chàm da', 'Nấm da'],
    6: ['Đau tai, chảy mủ', 'Viêm họng', 'Nghẹt mũi', 'Ù tai', 'Viêm xoang'],
    7: ['Đau răng', 'Sâu răng', 'Viêm lợi', 'Nhổ răng khôn', 'Tẩy trắng răng'],
    8: ['Cận thị tăng độ', 'Đau mắt đỏ', 'Khô mắt', 'Đục thủy tinh thể', 'Khám mắt định kỳ'],
    9: ['Rối loạn kinh nguyệt', 'Khám thai định kỳ', 'Viêm phụ khoa', 'U xơ tử cung', 'Mang thai'],
    10: ['Sốt cao, ho', 'Tiêu chảy', 'Viêm phổi', 'Suy dinh dưỡng', 'Khám sức khỏe trẻ em'],
    11: ['Tiểu buốt, tiểu rắt', 'Sỏi thận', 'Phì đại tiền liệt tuyến', 'Viêm đường tiết niệu', 'Khám nam khoa'],
    12: ['Đau dạ dày', 'Trào ngược dạ dày', 'Táo bón', 'Viêm đại tràng', 'Gan nhiễm mỡ'],
    13: ['Stress, lo âu', 'Trầm cảm', 'Mất ngủ', 'Rối loạn cảm xúc', 'Tư vấn tâm lý'],
    14: ['Tiểu đường', 'Rối loạn tuyến giáp', 'Béo phì', 'Rối loạn lipid máu', 'Suy tuyến thượng thận'],
    15: ['Ung thư phổi', 'Ung thư vú', 'Ung thư dạ dày', 'Khám tầm soát ung thư', 'Hóa trị liệu']
};

// Chẩn đoán mẫu
const diagnosisBySpecialty = {
    1: ['Viêm ruột thừa cấp', 'Thoát vị bẹn', 'Thoát vị đĩa đệm L4-L5', 'Sỏi túi mật', 'Viêm tụy cấp'],
    2: ['Đau nửa đầu migraine', 'Rối loạn tiền đình', 'Thiếu máu não', 'Viêm dây thần kinh', 'Parkinson giai đoạn đầu'],
    3: ['Viêm phế quản', 'Tăng huyết áp độ 2', 'Rối loạn nhịp tim', 'Bệnh mạch vành', 'Suy tim độ 1'],
    4: ['Viêm khớp gối', 'Gãy xương đòn', 'Thoái hóa đốt sống cổ', 'Viêm quanh khớp vai', 'Loãng xương'],
    5: ['Viêm da dị ứng', 'Nấm da', 'Chàm thể tạng', 'Vẩy nến', 'Mụn trứng cá'],
    6: ['Viêm tai giữa', 'Viêm amidan mãn', 'Viêm xoang', 'Điếc đột ngột', 'Polyp mũi'],
    7: ['Sâu răng số 6', 'Viêm nha chu', 'Răng khôn mọc lệch', 'Viêm tủy răng', 'Nứt răng'],
    8: ['Cận thị -3.0D', 'Viêm kết mạc', 'Khô mắt', 'Đục thủy tinh thể', 'Tăng nhãn áp'],
    9: ['Rối loạn kinh nguyệt', 'Thai 12 tuần - bình thường', 'Viêm âm đạo', 'U xơ tử cung', 'Buồng trứng đa nang'],
    10: ['Viêm phổi', 'Tiêu chảy cấp', 'Sốt virus', 'Viêm tai giữa', 'Hen phế quản'],
    11: ['Viêm bàng quang', 'Sỏi thận 5mm', 'Phì đại tiền liệt tuyến', 'Nhiễm trùng đường tiểu', 'Rối loạn cương dương'],
    12: ['Viêm dạ dày HP+', 'Trào ngược dạ dày thực quản', 'Hội chứng ruột kích thích', 'Viêm đại tràng', 'Gan nhiễm mỡ độ 2'],
    13: ['Rối loạn lo âu', 'Trầm cảm nhẹ', 'Stress', 'Rối loạn giấc ngủ', 'Rối loạn lưỡng cực'],
    14: ['Đái tháo đường type 2', 'Cường giáp', 'Béo phì độ 1', 'Rối loạn lipid máu', 'Suy giáp'],
    15: ['Ung thư phổi giai đoạn 1', 'Ung thư vú giai đoạn đầu', 'Ung thư dạ dày', 'Nghi ngờ ung thư', 'Theo dõi sau hóa trị']
};

// Kế hoạch điều trị mẫu
const treatmentPlans = [
    'Điều trị nội khoa, uống thuốc theo đơn, tái khám sau 2 tuần',
    'Nghỉ ngơi, uống thuốc đều đặn, hạn chế vận động mạnh',
    'Phẫu thuật nội soi, hẹn lịch tuần sau',
    'Điều trị bảo tồn, vật lý trị liệu 2 lần/tuần',
    'Chế độ ăn kiêng, tập thể dục nhẹ, tái khám sau 1 tháng',
    'Xét nghiệm thêm, chụp CT, hẹn lấy kết quả sau 3 ngày',
    'Theo dõi tại nhà, nếu có dấu hiệu bất thường quay lại ngay',
    'Điều trị theo phác đồ chuẩn, tái khám định kỳ mỗi tháng'
];

// Comments đánh giá mẫu
const reviewComments = [
    'Bác sĩ rất tận tâm, giải thích kỹ về bệnh tình. Tôi rất hài lòng.',
    'Khám rất kỹ, tư vấn nhiệt tình. Cảm ơn bác sĩ.',
    'Bác sĩ giỏi, chẩn đoán chính xác. Phòng khám sạch sẽ.',
    'Thời gian chờ hơi lâu nhưng bác sĩ khám rất tốt.',
    'Cảm ơn bác sĩ đã chữa khỏi bệnh cho tôi.',
    'Bác sĩ rất nhẹ nhàng, chu đáo với bệnh nhân.',
    'Sẽ giới thiệu bạn bè và người thân đến khám.',
    'Dịch vụ tốt, bác sĩ có chuyên môn cao.',
    'Hài lòng với kết quả điều trị.',
    'Bác sĩ tư vấn rất chi tiết, dễ hiểu.'
];

async function seedAllDoctorsDataComplete() {
    try {
        console.log('🚀 Bắt đầu tạo dữ liệu mẫu ĐẦY ĐỦ cho TẤT CẢ bác sĩ...\n');

        // Lấy tất cả bác sĩ
        const doctors = await Doctor.findAll({
            attributes: ['id', 'full_name', 'specialty_id']
        });
        console.log(`📋 Tìm thấy ${doctors.length} bác sĩ\n`);

        // Lấy danh sách thuốc
        const drugs = await Drug.findAll({ limit: 20 });
        console.log(`💊 Có ${drugs.length} loại thuốc trong kho\n`);

        // Lấy hoặc tạo patients
        let patients = await Patient.findAll({ limit: 30 });
        if (patients.length < 20) {
            console.log('⚠️ Tạo thêm patients mẫu...');
            const newPatientsData = [];
            const names = [
                'Trần Văn Minh', 'Lê Thị Hoa', 'Phạm Văn Đức', 'Nguyễn Thị Mai', 'Hoàng Văn Nam',
                'Vũ Thị Lan', 'Đặng Văn Hùng', 'Bùi Thị Nga', 'Lý Văn Tài', 'Đinh Thị Hương',
                'Cao Văn Sơn', 'Trịnh Thị Yến', 'Phan Văn Khoa', 'Dương Thị Thảo', 'Hồ Văn Phong',
                'Lương Thị Kim', 'Tô Văn Hải', 'Châu Thị Linh', 'Mã Văn Tuấn', 'La Thị Xuân',
                'Ngô Văn Bảo', 'Đỗ Thị Hạnh', 'Lâm Văn Quang', 'Võ Thị Nhung', 'Tạ Văn Cường',
                'Hà Thị Phương', 'Quách Văn Thắng', 'Mai Thị Duyên', 'Kiều Văn Hải', 'Từ Thị Oanh'
            ];
            for (let i = 0; i < 30; i++) {
                newPatientsData.push({
                    full_name: names[i],
                    phone: `091234${String(i + 10).padStart(4, '0')}`,
                    email: `patient${i + 10}@test.com`,
                    gender: i % 2 === 0 ? 'male' : 'female',
                    birthday: `19${80 + (i % 20)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
                    address: `${100 + i} Đường ${i + 1}, Quận ${(i % 12) + 1}, TP.HCM`
                });
            }
            await Patient.bulkCreate(newPatientsData, { ignoreDuplicates: true });
            patients = await Patient.findAll({ limit: 30 });
        }
        console.log(`👥 Có ${patients.length} patients\n`);

        const today = new Date();
        const formatDate = (d) => d.toISOString().split('T')[0];

        // Xóa dữ liệu seed cũ
        console.log('🗑️ Xóa dữ liệu seed cũ...');

        // Xóa MedicalHistory liên quan đến bookings seed
        const oldBookings = await Booking.findAll({
            where: { booking_code: { [Op.like]: 'SEED%' } },
            attributes: ['id']
        });
        const oldBookingIds = oldBookings.map(b => b.id);

        if (oldBookingIds.length > 0) {
            // Xóa prescriptions liên quan
            const oldPrescriptions = await Prescription.findAll({
                where: { booking_id: { [Op.in]: oldBookingIds } },
                attributes: ['id']
            });
            const oldPrescriptionIds = oldPrescriptions.map(p => p.id);

            if (oldPrescriptionIds.length > 0) {
                await PrescriptionDetail.destroy({ where: { prescription_id: { [Op.in]: oldPrescriptionIds } } });
                await Prescription.destroy({ where: { id: { [Op.in]: oldPrescriptionIds } } });
            }

            await MedicalHistory.destroy({ where: { booking_id: { [Op.in]: oldBookingIds } } });
        }

        await Booking.destroy({ where: { booking_code: { [Op.like]: 'SEED%' } } });
        await Review.destroy({ where: { comment: { [Op.like]: '[Mẫu]%' } } });

        let totalBookings = 0;
        let totalReviews = 0;
        let totalMedicalHistories = 0;
        let totalPrescriptions = 0;

        // Tạo dữ liệu cho mỗi bác sĩ
        for (const doctor of doctors) {
            const specialtyId = doctor.specialty_id || 1;
            const symptoms = symptomsBySpecialty[specialtyId] || symptomsBySpecialty[1];
            const diagnoses = diagnosisBySpecialty[specialtyId] || diagnosisBySpecialty[1];

            // Random số lượng bookings cho mỗi bác sĩ (4-7)
            const numBookings = Math.floor(Math.random() * 4) + 4;
            const bookingsData = [];

            // Random patients cho bác sĩ này
            const shuffledPatients = [...patients].sort(() => Math.random() - 0.5);

            for (let i = 0; i < numBookings; i++) {
                const patient = shuffledPatients[i % shuffledPatients.length];
                const daysOffset = i < 2 ? 0 : (i - 1); // 2 hôm nay, còn lại quá khứ
                const appointmentDate = new Date(today.getTime() - daysOffset * 24 * 60 * 60 * 1000);

                // Status logic
                let status, diagnosis = null, conclusion = null;
                if (daysOffset === 0 && i === 0) {
                    status = 'confirmed'; // 1 confirmed hôm nay
                } else if (daysOffset === 0 && i === 1) {
                    status = 'pending'; // 1 pending hôm nay
                } else {
                    status = 'completed'; // Còn lại đã hoàn thành
                    diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
                    conclusion = treatmentPlans[Math.floor(Math.random() * treatmentPlans.length)];
                }

                const hours = 8 + Math.floor(i * 1.5);
                const minutes = (i % 2) * 30;

                bookingsData.push({
                    booking_code: `SEED${doctor.id}${Date.now()}${i}`,
                    patient_id: patient.id,
                    patient_name: patient.full_name,
                    patient_phone: patient.phone,
                    patient_email: patient.email,
                    patient_gender: patient.gender,
                    patient_dob: patient.birthday,
                    patient_address: patient.address,
                    doctor_id: doctor.id,
                    specialty_id: specialtyId,
                    service_id: 1,
                    appointment_date: formatDate(appointmentDate),
                    appointment_time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
                    symptoms: symptoms[Math.floor(Math.random() * symptoms.length)],
                    diagnosis,
                    conclusion,
                    status,
                    note: ''
                });
            }

            const createdBookings = await Booking.bulkCreate(bookingsData);
            totalBookings += createdBookings.length;

            // Tạo MedicalHistory và Prescription cho các booking completed
            const completedBookings = createdBookings.filter((b, idx) => bookingsData[idx].status === 'completed');

            for (const booking of completedBookings) {
                const bookingData = bookingsData.find(bd => bd.booking_code === booking.booking_code);

                // Tạo MedicalHistory
                await MedicalHistory.create({
                    booking_id: booking.id,
                    patient_id: booking.patient_id,
                    doctor_id: booking.doctor_id,
                    visit_date: booking.appointment_date,
                    visit_time: booking.appointment_time,
                    symptoms: bookingData.symptoms,
                    diagnosis: bookingData.diagnosis,
                    conclusion: bookingData.conclusion,
                    treatment_plan: treatmentPlans[Math.floor(Math.random() * treatmentPlans.length)],
                    note: 'Bệnh nhân cần theo dõi và tái khám định kỳ',
                    created_at: new Date(booking.appointment_date),
                    updated_at: new Date(booking.appointment_date)
                });
                totalMedicalHistories++;

                // Tạo Prescription (70% bookings có đơn thuốc)
                if (drugs.length > 0 && Math.random() > 0.3) {
                    const prescriptionCode = `RX${Date.now()}${Math.floor(Math.random() * 1000)}`;
                    const prescription = await Prescription.create({
                        booking_id: booking.id,
                        patient_id: booking.patient_id,
                        doctor_id: booking.doctor_id,
                        prescription_code: prescriptionCode,
                        note: 'Uống thuốc đúng liều, đúng giờ. Tái khám nếu có triệu chứng bất thường.',
                        created_at: new Date(booking.appointment_date),
                        updated_at: new Date(booking.appointment_date)
                    });

                    // Thêm 2-4 loại thuốc vào đơn
                    const numDrugs = Math.floor(Math.random() * 3) + 2;
                    const shuffledDrugs = [...drugs].sort(() => Math.random() - 0.5);

                    for (let j = 0; j < Math.min(numDrugs, shuffledDrugs.length); j++) {
                        const drug = shuffledDrugs[j];
                        await PrescriptionDetail.create({
                            prescription_id: prescription.id,
                            drug_id: drug.id,
                            quantity: Math.floor(Math.random() * 20) + 10,
                            dosage: ['1 viên/lần x 3 lần/ngày', '2 viên/lần x 2 lần/ngày', '1 viên sáng, 1 viên tối', '1 gói x 3 lần/ngày'][Math.floor(Math.random() * 4)],
                            note: ['Uống sau ăn', 'Uống trước ăn 30 phút', 'Uống khi đói', ''][Math.floor(Math.random() * 4)]
                        });
                    }
                    totalPrescriptions++;
                }
            }

            // Tạo reviews (1-3 cho mỗi bác sĩ)
            const numReviews = Math.floor(Math.random() * 3) + 1;
            const reviewsData = [];

            for (let i = 0; i < Math.min(numReviews, completedBookings.length); i++) {
                const booking = completedBookings[i];
                reviewsData.push({
                    patient_id: booking.patient_id,
                    doctor_id: doctor.id,
                    booking_id: booking.id,
                    rating: Math.floor(Math.random() * 2) + 4, // 4 hoặc 5 sao
                    comment: '[Mẫu] ' + reviewComments[Math.floor(Math.random() * reviewComments.length)],
                    is_anonymous: Math.random() > 0.7,
                    status: 'approved',
                    created_at: new Date(today.getTime() - (i + 1) * 24 * 60 * 60 * 1000)
                });
            }

            if (reviewsData.length > 0) {
                await Review.bulkCreate(reviewsData);
                totalReviews += reviewsData.length;
            }

            process.stdout.write(`✅ ${doctor.full_name} (${createdBookings.length} bookings, ${completedBookings.length} hồ sơ, ${reviewsData.length} reviews)\n`);
        }

        console.log('\n' + '═'.repeat(60));
        console.log('📊 TỔNG KẾT DỮ LIỆU ĐÃ TẠO:');
        console.log('═'.repeat(60));
        console.log(`👨‍⚕️ Số bác sĩ:           ${doctors.length}`);
        console.log(`📅 Tổng bookings:        ${totalBookings}`);
        console.log(`📋 Tổng hồ sơ bệnh án:   ${totalMedicalHistories}`);
        console.log(`💊 Tổng đơn thuốc:       ${totalPrescriptions}`);
        console.log(`⭐ Tổng reviews:         ${totalReviews}`);
        console.log('═'.repeat(60));
        console.log('\n🎉 Hoàn thành! Refresh trang để xem kết quả.');

        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

seedAllDoctorsDataComplete();
