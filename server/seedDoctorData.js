/**
 * Script tạo dữ liệu mẫu cho bác sĩ Nguyễn Văn An (ID: 1)
 * Bao gồm: Bookings, Reviews
 */

const { Booking, Patient, Doctor, Specialty, Review, Service } = require('./models');
const { Op } = require('sequelize');

async function seedDoctorData() {
    try {
        console.log('🚀 Bắt đầu tạo dữ liệu mẫu cho bác sĩ...');

        const doctorId = 1; // Nguyễn Văn An
        const specialtyId = 1; // Ngoại khoa

        // Lấy danh sách patients
        const patients = await Patient.findAll({ limit: 5 });
        if (patients.length === 0) {
            console.log('⚠️ Không có patient, tạo patient mẫu...');
            // Tạo patients mẫu
            const newPatients = await Patient.bulkCreate([
                { full_name: 'Trần Văn Minh', phone: '0912345001', email: 'minh@test.com', gender: 'male', birthday: '1990-05-15', address: '123 Nguyễn Huệ, Q.1, TP.HCM' },
                { full_name: 'Lê Thị Hoa', phone: '0912345002', email: 'hoa@test.com', gender: 'female', birthday: '1985-08-20', address: '456 Lê Lợi, Q.3, TP.HCM' },
                { full_name: 'Phạm Văn Đức', phone: '0912345003', email: 'duc@test.com', gender: 'male', birthday: '1978-12-10', address: '789 Võ Văn Tần, Q.3, TP.HCM' },
                { full_name: 'Nguyễn Thị Mai', phone: '0912345004', email: 'mai@test.com', gender: 'female', birthday: '1995-03-25', address: '321 Hai Bà Trưng, Q.1, TP.HCM' },
                { full_name: 'Hoàng Văn Nam', phone: '0912345005', email: 'nam@test.com', gender: 'male', birthday: '1982-07-08', address: '654 CMT8, Q.10, TP.HCM' },
            ]);
            patients.push(...newPatients);
        }

        const today = new Date();
        const formatDate = (d) => d.toISOString().split('T')[0];

        // Tạo các ngày
        const dates = {
            today: formatDate(today),
            yesterday: formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000)),
            twoDaysAgo: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)),
            threeDaysAgo: formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
            tomorrow: formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)),
            nextWeek: formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)),
        };

        console.log('📅 Tạo bookings cho các ngày:', dates);

        // Xóa bookings cũ của bác sĩ này (để tránh trùng)
        await Booking.destroy({
            where: {
                doctor_id: doctorId,
                booking_code: { [Op.like]: 'SEED%' }
            }
        });

        // Tạo bookings mẫu
        const bookingsData = [
            // Lịch hẹn hôm nay
            {
                booking_code: 'SEED' + Date.now() + '01',
                patient_id: patients[0]?.id,
                patient_name: patients[0]?.full_name || 'Trần Văn Minh',
                patient_phone: patients[0]?.phone || '0912345001',
                patient_email: patients[0]?.email,
                patient_gender: 'male',
                doctor_id: doctorId,
                specialty_id: specialtyId,
                service_id: 1,
                appointment_date: dates.today,
                appointment_time: '08:30',
                symptoms: 'Đau bụng vùng hạ sườn phải, sốt nhẹ',
                status: 'confirmed',
                note: 'Bệnh nhân cần nhịn ăn trước khi khám'
            },
            {
                booking_code: 'SEED' + Date.now() + '02',
                patient_id: patients[1]?.id,
                patient_name: patients[1]?.full_name || 'Lê Thị Hoa',
                patient_phone: patients[1]?.phone || '0912345002',
                patient_email: patients[1]?.email,
                patient_gender: 'female',
                doctor_id: doctorId,
                specialty_id: specialtyId,
                service_id: 1,
                appointment_date: dates.today,
                appointment_time: '09:00',
                symptoms: 'Khám định kỳ sau phẫu thuật ruột thừa',
                status: 'pending',
                note: ''
            },
            {
                booking_code: 'SEED' + Date.now() + '03',
                patient_id: patients[2]?.id,
                patient_name: patients[2]?.full_name || 'Phạm Văn Đức',
                patient_phone: patients[2]?.phone || '0912345003',
                patient_email: patients[2]?.email,
                patient_gender: 'male',
                doctor_id: doctorId,
                specialty_id: specialtyId,
                service_id: 1,
                appointment_date: dates.today,
                appointment_time: '10:30',
                symptoms: 'Đau lưng kéo dài, tê chân trái',
                status: 'confirmed',
                note: 'Mang theo kết quả MRI'
            },

            // Đã hoàn thành (trong tuần)
            {
                booking_code: 'SEED' + Date.now() + '04',
                patient_id: patients[3]?.id,
                patient_name: patients[3]?.full_name || 'Nguyễn Thị Mai',
                patient_phone: patients[3]?.phone || '0912345004',
                patient_email: patients[3]?.email,
                patient_gender: 'female',
                doctor_id: doctorId,
                specialty_id: specialtyId,
                service_id: 1,
                appointment_date: dates.yesterday,
                appointment_time: '14:00',
                symptoms: 'Đau khớp gối, khó đi lại',
                diagnosis: 'Viêm khớp gối cấp',
                conclusion: 'Điều trị nội khoa, hẹn tái khám sau 2 tuần',
                status: 'completed',
                note: ''
            },
            {
                booking_code: 'SEED' + Date.now() + '05',
                patient_id: patients[4]?.id,
                patient_name: patients[4]?.full_name || 'Hoàng Văn Nam',
                patient_phone: patients[4]?.phone || '0912345005',
                patient_email: patients[4]?.email,
                patient_gender: 'male',
                doctor_id: doctorId,
                specialty_id: specialtyId,
                service_id: 1,
                appointment_date: dates.yesterday,
                appointment_time: '15:30',
                symptoms: 'Sưng đau vùng bẹn phải',
                diagnosis: 'Thoát vị bẹn phải',
                conclusion: 'Chỉ định phẫu thuật nội soi, lên lịch tuần sau',
                status: 'completed',
                note: ''
            },
            {
                booking_code: 'SEED' + Date.now() + '06',
                patient_id: patients[0]?.id,
                patient_name: patients[0]?.full_name || 'Trần Văn Minh',
                patient_phone: patients[0]?.phone || '0912345001',
                patient_email: patients[0]?.email,
                patient_gender: 'male',
                doctor_id: doctorId,
                specialty_id: specialtyId,
                service_id: 1,
                appointment_date: dates.twoDaysAgo,
                appointment_time: '09:00',
                symptoms: 'Tái khám sau điều trị viêm dạ dày',
                diagnosis: 'Viêm dạ dày - Đã ổn định',
                conclusion: 'Tiếp tục duy trì thuốc, tái khám sau 1 tháng',
                status: 'completed',
                note: ''
            },
            {
                booking_code: 'SEED' + Date.now() + '07',
                patient_id: patients[1]?.id,
                patient_name: patients[1]?.full_name || 'Lê Thị Hoa',
                patient_phone: patients[1]?.phone || '0912345002',
                patient_email: patients[1]?.email,
                patient_gender: 'female',
                doctor_id: doctorId,
                specialty_id: specialtyId,
                service_id: 1,
                appointment_date: dates.threeDaysAgo,
                appointment_time: '10:00',
                symptoms: 'Đau bụng âm ỉ, ăn không tiêu',
                diagnosis: 'Rối loạn tiêu hóa',
                conclusion: 'Điều chỉnh chế độ ăn, uống thuốc 7 ngày',
                status: 'completed',
                note: ''
            },

            // Lịch hẹn sắp tới
            {
                booking_code: 'SEED' + Date.now() + '08',
                patient_id: patients[2]?.id,
                patient_name: patients[2]?.full_name || 'Phạm Văn Đức',
                patient_phone: patients[2]?.phone || '0912345003',
                patient_email: patients[2]?.email,
                patient_gender: 'male',
                doctor_id: doctorId,
                specialty_id: specialtyId,
                service_id: 1,
                appointment_date: dates.tomorrow,
                appointment_time: '08:00',
                symptoms: 'Tái khám sau phẫu thuật',
                status: 'confirmed',
                note: 'Cắt chỉ vết mổ'
            },
        ];

        const createdBookings = await Booking.bulkCreate(bookingsData);
        console.log(`✅ Đã tạo ${createdBookings.length} bookings`);

        // Xóa reviews cũ (để tránh trùng)
        await Review.destroy({
            where: {
                doctor_id: doctorId,
                comment: { [Op.like]: '[Mẫu]%' }
            }
        });

        // Tạo reviews mẫu
        const reviewsData = [
            {
                patient_id: patients[0]?.id || 1,
                doctor_id: doctorId,
                booking_id: createdBookings[3]?.id, // completed booking
                rating: 5,
                comment: '[Mẫu] Bác sĩ rất tận tâm, giải thích kỹ về bệnh tình. Tôi rất hài lòng với dịch vụ khám.',
                is_anonymous: false,
                status: 'approved',
                created_at: new Date(dates.yesterday)
            },
            {
                patient_id: patients[1]?.id || 2,
                doctor_id: doctorId,
                booking_id: createdBookings[4]?.id,
                rating: 5,
                comment: '[Mẫu] Bác sĩ An rất giỏi, chẩn đoán chính xác. Phòng khám sạch sẽ, nhân viên nhiệt tình.',
                is_anonymous: false,
                status: 'approved',
                created_at: new Date(dates.twoDaysAgo)
            },
            {
                patient_id: patients[2]?.id || 3,
                doctor_id: doctorId,
                booking_id: createdBookings[5]?.id,
                rating: 4,
                comment: '[Mẫu] Khám kỹ, tư vấn nhiệt tình. Thời gian chờ hơi lâu một chút nhưng chất lượng tốt.',
                is_anonymous: false,
                status: 'approved',
                created_at: new Date(dates.threeDaysAgo)
            },
            {
                patient_id: patients[3]?.id || 4,
                doctor_id: doctorId,
                booking_id: createdBookings[6]?.id,
                rating: 5,
                comment: '[Mẫu] Cảm ơn bác sĩ đã chữa khỏi bệnh cho tôi. Sẽ giới thiệu bạn bè đến khám.',
                is_anonymous: true,
                status: 'approved',
                created_at: new Date(dates.threeDaysAgo)
            },
        ];

        const createdReviews = await Review.bulkCreate(reviewsData);
        console.log(`✅ Đã tạo ${createdReviews.length} reviews`);

        // Tính toán thống kê
        const stats = {
            todayAppointments: bookingsData.filter(b => b.appointment_date === dates.today).length,
            pendingCount: bookingsData.filter(b => b.status === 'pending').length,
            confirmedCount: bookingsData.filter(b => b.status === 'confirmed').length,
            completedCount: bookingsData.filter(b => b.status === 'completed').length,
            avgRating: (reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length).toFixed(1),
            reviewCount: reviewsData.length
        };

        console.log('\n📊 Thống kê dữ liệu đã tạo:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📅 Lịch hẹn hôm nay: ${stats.todayAppointments}`);
        console.log(`⏳ Chờ xác nhận: ${stats.pendingCount}`);
        console.log(`✅ Đã xác nhận: ${stats.confirmedCount}`);
        console.log(`🏁 Đã hoàn thành: ${stats.completedCount}`);
        console.log(`⭐ Đánh giá TB: ${stats.avgRating} (${stats.reviewCount} đánh giá)`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        console.log('\n🎉 Hoàn thành tạo dữ liệu mẫu!');
        console.log('👉 Refresh trang doctor-portal để xem kết quả');

        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

seedDoctorData();
