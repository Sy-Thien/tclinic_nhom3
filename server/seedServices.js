const { Service, Specialty } = require('./models');

const servicesData = [
    // Nội khoa (id: 1)
    { name: 'Khám tổng quát', description: 'Khám sức khỏe tổng quát, kiểm tra các chỉ số cơ bản', price: 200000, duration: 30, specialty_id: 1 },
    { name: 'Khám nội khoa', description: 'Khám và tư vấn các bệnh lý nội khoa', price: 250000, duration: 30, specialty_id: 1 },
    { name: 'Khám sức khỏe định kỳ', description: 'Gói khám sức khỏe toàn diện định kỳ', price: 1500000, duration: 120, specialty_id: 1 },
    { name: 'Khám tiểu đường', description: 'Khám và theo dõi điều trị bệnh tiểu đường', price: 300000, duration: 45, specialty_id: 1 },
    { name: 'Khám cao huyết áp', description: 'Khám và tư vấn điều trị cao huyết áp', price: 300000, duration: 30, specialty_id: 1 },

    // Ngoại khoa (id: 2)
    { name: 'Khám ngoại khoa', description: 'Khám và tư vấn các bệnh lý ngoại khoa', price: 300000, duration: 30, specialty_id: 2 },
    { name: 'Tiểu phẫu', description: 'Các thủ thuật tiểu phẫu ngoại khoa', price: 500000, duration: 60, specialty_id: 2 },
    { name: 'Cắt chỉ, thay băng', description: 'Dịch vụ cắt chỉ và thay băng vết thương', price: 100000, duration: 15, specialty_id: 2 },
    { name: 'Nội soi khớp', description: 'Nội soi chẩn đoán và điều trị bệnh lý khớp', price: 3000000, duration: 90, specialty_id: 2 },

    // Sản phụ khoa (id: 3)
    { name: 'Khám phụ khoa', description: 'Khám và tư vấn sức khỏe phụ nữ', price: 350000, duration: 30, specialty_id: 3 },
    { name: 'Khám thai định kỳ', description: 'Khám và theo dõi thai kỳ', price: 400000, duration: 45, specialty_id: 3 },
    { name: 'Siêu âm thai', description: 'Siêu âm thai 2D/3D/4D', price: 300000, duration: 30, specialty_id: 3 },
    { name: 'Xét nghiệm Pap smear', description: 'Tầm soát ung thư cổ tử cung', price: 250000, duration: 20, specialty_id: 3 },
    { name: 'Đặt vòng tránh thai', description: 'Dịch vụ đặt vòng tránh thai', price: 500000, duration: 30, specialty_id: 3 },

    // Nhi khoa (id: 4)
    { name: 'Khám nhi tổng quát', description: 'Khám sức khỏe trẻ em', price: 250000, duration: 30, specialty_id: 4 },
    { name: 'Tiêm chủng vaccine', description: 'Dịch vụ tiêm phòng cho trẻ em', price: 150000, duration: 15, specialty_id: 4 },
    { name: 'Khám dinh dưỡng trẻ em', description: 'Tư vấn dinh dưỡng và phát triển trẻ', price: 300000, duration: 45, specialty_id: 4 },
    { name: 'Khám sơ sinh', description: 'Khám sức khỏe trẻ sơ sinh', price: 350000, duration: 30, specialty_id: 4 },

    // Tim mạch (id: 5)
    { name: 'Khám tim mạch', description: 'Khám và tư vấn các bệnh lý tim mạch', price: 400000, duration: 30, specialty_id: 5 },
    { name: 'Điện tâm đồ (ECG)', description: 'Đo điện tâm đồ kiểm tra nhịp tim', price: 150000, duration: 15, specialty_id: 5 },
    { name: 'Siêu âm tim', description: 'Siêu âm Doppler tim', price: 500000, duration: 30, specialty_id: 5 },
    { name: 'Holter điện tim 24h', description: 'Theo dõi nhịp tim 24 giờ', price: 800000, duration: 30, specialty_id: 5 },

    // Thần kinh (id: 6)
    { name: 'Khám thần kinh', description: 'Khám và tư vấn các bệnh lý thần kinh', price: 350000, duration: 30, specialty_id: 6 },
    { name: 'Điện não đồ (EEG)', description: 'Đo điện não đồ chẩn đoán', price: 400000, duration: 45, specialty_id: 6 },
    { name: 'Khám đau đầu mãn tính', description: 'Chẩn đoán và điều trị đau đầu', price: 300000, duration: 30, specialty_id: 6 },

    // Tiêu hóa (id: 7)
    { name: 'Khám tiêu hóa', description: 'Khám và tư vấn các bệnh lý tiêu hóa', price: 300000, duration: 30, specialty_id: 7 },
    { name: 'Nội soi dạ dày', description: 'Nội soi dạ dày không đau', price: 1200000, duration: 30, specialty_id: 7 },
    { name: 'Nội soi đại tràng', description: 'Nội soi đại tràng không đau', price: 1500000, duration: 45, specialty_id: 7 },
    { name: 'Siêu âm ổ bụng', description: 'Siêu âm các cơ quan trong ổ bụng', price: 300000, duration: 20, specialty_id: 7 },

    // Hô hấp (id: 8)
    { name: 'Khám hô hấp', description: 'Khám và điều trị các bệnh phổi, đường hô hấp', price: 300000, duration: 30, specialty_id: 8 },
    { name: 'Đo chức năng hô hấp', description: 'Đo phế dung ký', price: 250000, duration: 20, specialty_id: 8 },
    { name: 'X-quang phổi', description: 'Chụp X-quang lồng ngực', price: 200000, duration: 15, specialty_id: 8 },

    // Tai mũi họng (id: 9)
    { name: 'Khám tai mũi họng', description: 'Khám và điều trị các bệnh tai mũi họng', price: 250000, duration: 20, specialty_id: 9 },
    { name: 'Nội soi tai mũi họng', description: 'Nội soi chẩn đoán các bệnh TMH', price: 400000, duration: 30, specialty_id: 9 },
    { name: 'Đo thính lực', description: 'Kiểm tra thính lực', price: 200000, duration: 20, specialty_id: 9 },
    { name: 'Lấy ráy tai', description: 'Dịch vụ vệ sinh tai', price: 100000, duration: 15, specialty_id: 9 },

    // Mắt (id: 10)
    { name: 'Khám mắt tổng quát', description: 'Khám và kiểm tra thị lực', price: 250000, duration: 30, specialty_id: 10 },
    { name: 'Đo khúc xạ', description: 'Đo độ cận, viễn, loạn thị', price: 150000, duration: 20, specialty_id: 10 },
    { name: 'Khám đáy mắt', description: 'Soi đáy mắt chẩn đoán', price: 200000, duration: 20, specialty_id: 10 },
    { name: 'Đo nhãn áp', description: 'Kiểm tra áp lực mắt (tầm soát glaucoma)', price: 150000, duration: 15, specialty_id: 10 },

    // Da liễu (id: 11)
    { name: 'Khám da liễu', description: 'Khám và điều trị các bệnh da', price: 300000, duration: 30, specialty_id: 11 },
    { name: 'Điều trị mụn', description: 'Tư vấn và điều trị mụn trứng cá', price: 400000, duration: 45, specialty_id: 11 },
    { name: 'Laser trị nám', description: 'Điều trị nám da bằng laser', price: 1500000, duration: 60, specialty_id: 11 },
    { name: 'Sinh thiết da', description: 'Sinh thiết tổn thương da', price: 500000, duration: 30, specialty_id: 11 },

    // Răng hàm mặt (id: 12)
    { name: 'Khám răng tổng quát', description: 'Khám và tư vấn sức khỏe răng miệng', price: 200000, duration: 30, specialty_id: 12 },
    { name: 'Lấy cao răng', description: 'Vệ sinh răng miệng, lấy vôi răng', price: 300000, duration: 30, specialty_id: 12 },
    { name: 'Trám răng', description: 'Trám răng sâu composite', price: 200000, duration: 30, specialty_id: 12 },
    { name: 'Nhổ răng', description: 'Nhổ răng thường', price: 300000, duration: 30, specialty_id: 12 },
    { name: 'Tẩy trắng răng', description: 'Làm trắng răng chuyên nghiệp', price: 1500000, duration: 60, specialty_id: 12 },

    // Chấn thương chỉnh hình (id: 13)
    { name: 'Khám cơ xương khớp', description: 'Khám và điều trị các bệnh xương khớp', price: 350000, duration: 30, specialty_id: 13 },
    { name: 'Vật lý trị liệu', description: 'Phục hồi chức năng cơ xương khớp', price: 200000, duration: 45, specialty_id: 13 },
    { name: 'Tiêm nội khớp', description: 'Tiêm thuốc điều trị viêm khớp', price: 500000, duration: 20, specialty_id: 13 },
    { name: 'Chụp MRI', description: 'Chụp cộng hưởng từ xương khớp', price: 2500000, duration: 45, specialty_id: 13 },

    // Ung bướu (id: 14)
    { name: 'Khám ung bướu', description: 'Khám và tư vấn tầm soát ung thư', price: 500000, duration: 45, specialty_id: 14 },
    { name: 'Sinh thiết u', description: 'Sinh thiết chẩn đoán ung thư', price: 1000000, duration: 30, specialty_id: 14 },
    { name: 'Xét nghiệm marker ung thư', description: 'Xét nghiệm các chỉ số tầm soát ung thư', price: 800000, duration: 15, specialty_id: 14 },

    // Tâm thần (id: 15)
    { name: 'Khám tâm thần', description: 'Khám và tư vấn sức khỏe tâm thần', price: 400000, duration: 45, specialty_id: 15 },
    { name: 'Tư vấn tâm lý', description: 'Tư vấn và trị liệu tâm lý', price: 500000, duration: 60, specialty_id: 15 },
    { name: 'Điều trị trầm cảm', description: 'Khám và điều trị rối loạn trầm cảm', price: 450000, duration: 45, specialty_id: 15 },
    { name: 'Điều trị rối loạn lo âu', description: 'Khám và điều trị rối loạn lo âu', price: 450000, duration: 45, specialty_id: 15 }
];

async function seedServices() {
    try {
        console.log('🚀 Bắt đầu tạo dịch vụ...\n');

        let created = 0;
        let skipped = 0;

        // Tạo hoặc cập nhật dịch vụ
        for (const serviceData of servicesData) {
            const [service, wasCreated] = await Service.findOrCreate({
                where: { name: serviceData.name },
                defaults: serviceData
            });

            if (wasCreated) {
                console.log(`✅ Tạo dịch vụ: ${service.name} (${Number(service.price).toLocaleString('vi-VN')}đ)`);
                created++;
            } else {
                // Cập nhật thông tin nếu đã tồn tại
                await service.update(serviceData);
                console.log(`🔄 Cập nhật: ${service.name}`);
                skipped++;
            }
        }

        console.log(`\n🎉 Hoàn thành! Tạo mới: ${created}, Cập nhật: ${skipped}`);
        console.log(`📊 Tổng số dịch vụ: ${created + skipped}`);

        // Thống kê theo chuyên khoa
        const specialties = await Specialty.findAll();
        console.log('\n📊 Thống kê dịch vụ theo chuyên khoa:');
        for (const specialty of specialties) {
            const count = await Service.count({ where: { specialty_id: specialty.id } });
            if (count > 0) {
                console.log(`   - ${specialty.name}: ${count} dịch vụ`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

seedServices();
