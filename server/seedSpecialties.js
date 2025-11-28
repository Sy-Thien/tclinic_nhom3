const sequelize = require('./config/database');
const Specialty = require('./models/Specialty');

const specialties = [
    { name: 'Nội khoa', description: 'Khám và điều trị các bệnh nội khoa' },
    { name: 'Ngoại khoa', description: 'Phẫu thuật các bệnh ngoại khoa' },
    { name: 'Sản phụ khoa', description: 'Chăm sóc sức khỏe phụ nữ' },
    { name: 'Nhi khoa', description: 'Chăm sóc sức khỏe trẻ em' },
    { name: 'Tim mạch', description: 'Điều trị bệnh tim mạch' },
    { name: 'Thần kinh', description: 'Điều trị bệnh thần kinh' },
    { name: 'Tiêu hóa', description: 'Điều trị bệnh tiêu hóa' },
    { name: 'Hô hấp', description: 'Điều trị bệnh hô hấp' },
    { name: 'Tai mũi họng', description: 'Khám và điều trị TMH' },
    { name: 'Mắt', description: 'Khám và điều trị mắt' },
    { name: 'Da liễu', description: 'Điều trị bệnh da liễu' },
    { name: 'Răng hàm mặt', description: 'Điều trị răng hàm mặt' },
    { name: 'Chấn thương chỉnh hình', description: 'Điều trị chấn thương' },
    { name: 'Ung bướu', description: 'Điều trị ung thư' },
    { name: 'Tâm thần', description: 'Điều trị tâm thần' }
];

async function seed() {
    try {
        console.log('🔄 Đang kết nối database...');
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        console.log('➕ Đang thêm dữ liệu...');
        for (const spec of specialties) {
            const [specialty, created] = await Specialty.findOrCreate({
                where: { name: spec.name },
                defaults: spec
            });
            console.log(`   ${created ? '✓ Thêm mới' : '✓ Đã tồn tại'}: ${spec.name}`);
        }

        console.log('');
        console.log('🎉 Hoàn thành! Đã thêm', specialties.length, 'chuyên khoa');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seed();