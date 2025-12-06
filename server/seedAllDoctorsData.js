/**
 * Script tạo dữ liệu mẫu cho TẤT CẢ bác sĩ
 * Mỗi bác sĩ sẽ có: bookings (hôm nay, pending, confirmed, completed) + reviews
 */

const { Booking, Patient, Doctor, Specialty, Review } = require('./models');
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

async function seedAllDoctorsData() {
    try {
        console.log('🚀 Bắt đầu tạo dữ liệu mẫu cho TẤT CẢ bác sĩ...\n');

        // Lấy tất cả bác sĩ
        const doctors = await Doctor.findAll({
            attributes: ['id', 'full_name', 'specialty_id']
        });
        console.log(`📋 Tìm thấy ${doctors.length} bác sĩ\n`);

        // Lấy hoặc tạo patients
        let patients = await Patient.findAll({ limit: 20 });
        if (patients.length < 10) {
            console.log('⚠️ Tạo thêm patients mẫu...');
            const newPatientsData = [];
            const names = [
                'Trần Văn Minh', 'Lê Thị Hoa', 'Phạm Văn Đức', 'Nguyễn Thị Mai', 'Hoàng Văn Nam',
                'Vũ Thị Lan', 'Đặng Văn Hùng', 'Bùi Thị Nga', 'Lý Văn Tài', 'Đinh Thị Hương',
                'Cao Văn Sơn', 'Trịnh Thị Yến', 'Phan Văn Khoa', 'Dương Thị Thảo', 'Hồ Văn Phong',
                'Lương Thị Kim', 'Tô Văn Hải', 'Châu Thị Linh', 'Mã Văn Tuấn', 'La Thị Xuân'
            ];
            for (let i = 0; i < 20; i++) {
                newPatientsData.push({
                    full_name: names[i],
                    phone: `091234${String(i + 10).padStart(4, '0')}`,
                    email: `patient${i + 10}@test.com`,
                    gender: i % 2 === 0 ? 'male' : 'female',
                    birthday: `19${80 + (i % 20)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
                    address: `${100 + i} Đường ${i + 1}, Quận ${(i % 12) + 1}, TP.HCM`
                });
            }
            const createdPatients = await Patient.bulkCreate(newPatientsData, { ignoreDuplicates: true });
            patients = await Patient.findAll({ limit: 20 });
        }
        console.log(`👥 Có ${patients.length} patients\n`);

        const today = new Date();
        const formatDate = (d) => d.toISOString().split('T')[0];

        // Xóa dữ liệu seed cũ
        console.log('🗑️ Xóa dữ liệu seed cũ...');
        await Booking.destroy({ where: { booking_code: { [Op.like]: 'SEED%' } } });
        await Review.destroy({ where: { comment: { [Op.like]: '[Mẫu]%' } } });

        let totalBookings = 0;
        let totalReviews = 0;

        // Tạo dữ liệu cho mỗi bác sĩ
        for (const doctor of doctors) {
            const specialtyId = doctor.specialty_id || 1;
            const symptoms = symptomsBySpecialty[specialtyId] || symptomsBySpecialty[1];
            const diagnoses = diagnosisBySpecialty[specialtyId] || diagnosisBySpecialty[1];

            // Random số lượng bookings cho mỗi bác sĩ (3-6)
            const numBookings = Math.floor(Math.random() * 4) + 3;
            const bookingsData = [];

            // Random patients cho bác sĩ này
            const shuffledPatients = [...patients].sort(() => Math.random() - 0.5);

            for (let i = 0; i < numBookings; i++) {
                const patient = shuffledPatients[i % shuffledPatients.length];
                const daysOffset = i === 0 ? 0 : (i === 1 ? 0 : i - 2); // 2 hôm nay, còn lại quá khứ
                const appointmentDate = new Date(today.getTime() - daysOffset * 24 * 60 * 60 * 1000);

                // Status logic
                let status, diagnosis = null, conclusion = null;
                if (daysOffset < 0) { // Tương lai
                    status = 'confirmed';
                } else if (daysOffset === 0) { // Hôm nay
                    status = i === 0 ? 'confirmed' : 'pending';
                } else { // Quá khứ
                    status = 'completed';
                    diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];
                    conclusion = 'Điều trị theo phác đồ, tái khám sau ' + (Math.floor(Math.random() * 3) + 1) + ' tuần';
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

            // Tạo reviews (1-3 cho mỗi bác sĩ)
            const numReviews = Math.floor(Math.random() * 3) + 1;
            const completedBookings = createdBookings.filter(b => b.status === 'completed');
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

            process.stdout.write(`✅ ${doctor.full_name} (${createdBookings.length} bookings, ${reviewsData.length} reviews)\n`);
        }

        console.log('\n' + '═'.repeat(50));
        console.log('📊 TỔNG KẾT:');
        console.log('═'.repeat(50));
        console.log(`👨‍⚕️ Số bác sĩ: ${doctors.length}`);
        console.log(`📅 Tổng bookings: ${totalBookings}`);
        console.log(`⭐ Tổng reviews: ${totalReviews}`);
        console.log('═'.repeat(50));
        console.log('\n🎉 Hoàn thành! Refresh trang để xem kết quả.');

        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

seedAllDoctorsData();
