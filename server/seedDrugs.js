const { sequelize, Drug } = require('./models');

const drugsData = [
    // Kháng sinh
    { name: 'Amoxicillin 500mg', ingredient: 'Amoxicillin', quantity: 500, unit: 'viên', expiry_date: '2026-11-21', warning_level: 30, price: 5000 },
    { name: 'Cephalexin 500mg', ingredient: 'Cephalexin', quantity: 300, unit: 'viên', expiry_date: '2026-12-01', warning_level: 20, price: 6500 },
    { name: 'Azithromycin 500mg', ingredient: 'Azithromycin', quantity: 200, unit: 'viên', expiry_date: '2026-10-15', warning_level: 15, price: 8000 },
    { name: 'Levofloxacin 500mg', ingredient: 'Levofloxacin', quantity: 250, unit: 'viên', expiry_date: '2027-01-10', warning_level: 20, price: 7500 },
    { name: 'Doxycycline 100mg', ingredient: 'Doxycycline', quantity: 350, unit: 'viên', expiry_date: '2026-09-30', warning_level: 25, price: 4500 },

    // Giảm đau, hạ sốt
    { name: 'Paracetamol 500mg', ingredient: 'Paracetamol', quantity: 1000, unit: 'viên', expiry_date: '2026-11-20', warning_level: 100, price: 2000 },
    { name: 'Ibuprofen 400mg', ingredient: 'Ibuprofen', quantity: 800, unit: 'viên', expiry_date: '2026-12-15', warning_level: 80, price: 3000 },
    { name: 'Aspirin 500mg', ingredient: 'Aspirin', quantity: 600, unit: 'viên', expiry_date: '2026-11-21', warning_level: 50, price: 2500 },
    { name: 'Metamizol 500mg', ingredient: 'Metamizol', quantity: 400, unit: 'viên', expiry_date: '2026-10-30', warning_level: 40, price: 3500 },
    { name: 'Acetaminophen 325mg', ingredient: 'Acetaminophen', quantity: 700, unit: 'viên', expiry_date: '2027-01-05', warning_level: 60, price: 2800 },

    // Chống viêm
    { name: 'Diclofenac 50mg', ingredient: 'Diclofenac', quantity: 450, unit: 'viên', expiry_date: '2026-11-10', warning_level: 30, price: 5500 },
    { name: 'Meloxicam 7.5mg', ingredient: 'Meloxicam', quantity: 300, unit: 'viên', expiry_date: '2026-12-20', warning_level: 25, price: 6500 },
    { name: 'Indomethacin 25mg', ingredient: 'Indomethacin', quantity: 250, unit: 'viên', expiry_date: '2026-10-05', warning_level: 20, price: 4800 },

    // Tiêu hóa
    { name: 'Omeprazole 20mg', ingredient: 'Omeprazole', quantity: 600, unit: 'viên', expiry_date: '2026-11-30', warning_level: 50, price: 4200 },
    { name: 'Metoclopramide 10mg', ingredient: 'Metoclopramide', quantity: 500, unit: 'viên', expiry_date: '2026-12-10', warning_level: 40, price: 3800 },
    { name: 'Ranitidine 150mg', ingredient: 'Ranitidine', quantity: 400, unit: 'viên', expiry_date: '2026-11-05', warning_level: 30, price: 4000 },
    { name: 'Pantoprazole 40mg', ingredient: 'Pantoprazole', quantity: 350, unit: 'viên', expiry_date: '2027-02-01', warning_level: 25, price: 5500 },
    { name: 'Lactobacillus (Probiotic)', ingredient: 'Lactobacillus', quantity: 300, unit: 'viên', expiry_date: '2026-10-15', warning_level: 20, price: 6500 },

    // Hô hấp
    { name: 'Salbutamol 100mcg', ingredient: 'Salbutamol', quantity: 150, unit: 'bình', expiry_date: '2026-11-25', warning_level: 10, price: 45000 },
    { name: 'Ambroxol 30mg', ingredient: 'Ambroxol', quantity: 500, unit: 'viên', expiry_date: '2026-12-30', warning_level: 40, price: 3200 },
    { name: 'Bromhexine 8mg', ingredient: 'Bromhexine', quantity: 450, unit: 'viên', expiry_date: '2026-11-15', warning_level: 35, price: 3500 },
    { name: 'Codeine 30mg', ingredient: 'Codeine', quantity: 200, unit: 'viên', expiry_date: '2026-09-20', warning_level: 15, price: 8500 },

    // Tim mạch
    { name: 'Atenolol 50mg', ingredient: 'Atenolol', quantity: 400, unit: 'viên', expiry_date: '2026-11-10', warning_level: 30, price: 5000 },
    { name: 'Lisinopril 10mg', ingredient: 'Lisinopril', quantity: 350, unit: 'viên', expiry_date: '2026-12-05', warning_level: 25, price: 5500 },
    { name: 'Amlodipine 5mg', ingredient: 'Amlodipine', quantity: 500, unit: 'viên', expiry_date: '2027-01-15', warning_level: 40, price: 6000 },
    { name: 'Atorvastatin 20mg', ingredient: 'Atorvastatin', quantity: 450, unit: 'viên', expiry_date: '2026-11-20', warning_level: 35, price: 7000 },

    // Tiểu đường
    { name: 'Metformin 500mg', ingredient: 'Metformin', quantity: 600, unit: 'viên', expiry_date: '2026-11-30', warning_level: 50, price: 4500 },
    { name: 'Glibenclamide 5mg', ingredient: 'Glibenclamide', quantity: 300, unit: 'viên', expiry_date: '2026-10-25', warning_level: 20, price: 6500 },

    // Huyết áp
    { name: 'Hydrochlorothiazide 25mg', ingredient: 'Hydrochlorothiazide', quantity: 400, unit: 'viên', expiry_date: '2026-12-01', warning_level: 30, price: 4200 },

    // Kháng dị ứng
    { name: 'Chlorphenamine 4mg', ingredient: 'Chlorphenamine', quantity: 500, unit: 'viên', expiry_date: '2026-11-15', warning_level: 40, price: 2500 },
    { name: 'Cetirizine 10mg', ingredient: 'Cetirizine', quantity: 600, unit: 'viên', expiry_date: '2026-12-20', warning_level: 50, price: 3500 },
    { name: 'Loratadine 10mg', ingredient: 'Loratadine', quantity: 400, unit: 'viên', expiry_date: '2027-01-10', warning_level: 30, price: 4000 },

    // Vitamin & Khoáng chất
    { name: 'Vitamin C 500mg', ingredient: 'Ascorbic Acid', quantity: 800, unit: 'viên', expiry_date: '2026-11-20', warning_level: 80, price: 2000 },
    { name: 'Vitamin B Complex', ingredient: 'B1, B2, B3, B5, B6, B12', quantity: 500, unit: 'viên', expiry_date: '2026-12-10', warning_level: 40, price: 3800 },
    { name: 'Calcium & Vitamin D3', ingredient: 'Calcium Carbonate, Cholecalciferol', quantity: 400, unit: 'viên', expiry_date: '2026-11-25', warning_level: 30, price: 5500 },
    { name: 'Ferrous Sulfate 325mg', ingredient: 'Ferrous Sulfate', quantity: 300, unit: 'viên', expiry_date: '2026-10-30', warning_level: 20, price: 3200 },

    // Dùng ngoài
    { name: 'Neomycin Cream 0.5%', ingredient: 'Neomycin', quantity: 50, unit: 'tuýp', expiry_date: '2026-11-20', warning_level: 5, price: 25000 },
    { name: 'Hydrocortisone Cream 1%', ingredient: 'Hydrocortisone', quantity: 40, unit: 'tuýp', expiry_date: '2026-12-15', warning_level: 5, price: 22000 },
    { name: 'Iodine Tincture', ingredient: 'Iodine', quantity: 100, unit: 'chai', expiry_date: '2026-11-10', warning_level: 10, price: 12000 },
];

async function seedDrugs() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công');

        // Kiểm tra xem có thuốc nào trong DB chưa
        const existingDrugs = await Drug.count();
        if (existingDrugs > 0) {
            console.log(`⚠️  Đã có ${existingDrugs} thuốc trong database`);
            const response = await new Promise((resolve) => {
                process.stdout.write('Bạn có muốn xóa và tạo lại không? (y/n): ');
                process.stdin.once('data', (data) => {
                    resolve(data.toString().trim().toLowerCase());
                });
            });

            if (response === 'y') {
                await Drug.destroy({ where: {} });
                console.log('🗑️  Đã xóa tất cả thuốc');
            } else {
                console.log('⏭️  Bỏ qua seeding');
                process.exit(0);
            }
        }

        // Thêm thuốc vào database
        const createdDrugs = await Drug.bulkCreate(drugsData);
        console.log(`✅ Đã thêm ${createdDrugs.length} loại thuốc vào database`);

        // Hiển thị danh sách thuốc
        console.log('\n📋 Danh sách thuốc đã tạo:');
        console.log('='.repeat(80));
        createdDrugs.forEach((drug, index) => {
            console.log(`${index + 1}. ${drug.name} - ${drug.ingredient}`);
            console.log(`   Số lượng: ${drug.quantity} ${drug.unit} | Cảnh báo: ${drug.warning_level} ${drug.unit} | Giá: ${drug.price.toLocaleString()} VND`);
            console.log(`   Hết hạn: ${drug.expiry_date}`);
        });
        console.log('='.repeat(80));

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi seed dữ liệu:', error.message);
        process.exit(1);
    }
}

seedDrugs();
