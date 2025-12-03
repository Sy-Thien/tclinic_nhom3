const { Drug, Prescription, PrescriptionDetail } = require('./models');

(async () => {
    try {
        console.log('🧪 Testing Drug Stock Deduction...\n');

        // Chọn 1 thuốc bất kỳ
        const drug = await Drug.findByPk(1);
        console.log(`📦 Before: ${drug.name}`);
        console.log(`   Stock: ${drug.quantity} ${drug.unit}\n`);

        // Tìm booking thật để test
        const { Booking } = require('./models');
        const booking = await Booking.findOne();

        if (!booking) {
            console.log('❌ No booking found. Please create a booking first.');
            process.exit(1);
        }

        // Tạo 1 prescription test
        const testPrescription = await Prescription.create({
            booking_id: booking.id,
            doctor_id: booking.doctor_id || 1,
            patient_id: booking.patient_id || 1,
            prescription_code: 'TEST' + Date.now(),
            note: 'Test stock deduction'
        });

        console.log(`✅ Created test prescription: ${testPrescription.prescription_code}\n`);

        // Tạo prescription detail (kê 5 viên)
        await PrescriptionDetail.create({
            prescription_id: testPrescription.id,
            drug_id: drug.id,
            quantity: 5,
            unit: 'viên',
            dosage: '1 viên x 3 lần/ngày'
        });

        console.log(`📝 Prescribed: 5 ${drug.unit}\n`);

        // Trừ stock
        await drug.update({
            quantity: drug.quantity - 5,
            updated_at: new Date()
        });

        console.log(`✅ Stock deducted!\n`);

        // Kiểm tra lại
        const updatedDrug = await Drug.findByPk(1);
        console.log(`📦 After: ${updatedDrug.name}`);
        console.log(`   Stock: ${updatedDrug.quantity} ${updatedDrug.unit}`);
        console.log(`   Change: -5 ${updatedDrug.unit}\n`);

        const originalStock = drug.quantity;
        const newStock = updatedDrug.quantity;

        if (newStock === originalStock - 5) {
            console.log(`✅ SUCCESS: Stock deduction is working correctly!`);
            console.log(`   Original: ${originalStock} → New: ${newStock} = -5`);
        } else {
            console.log(`❌ FAILED: Stock was not deducted properly!`);
            console.log(`   Expected: ${originalStock - 5}, Got: ${newStock}`);
        }

        // Cleanup - Xóa test prescription
        await PrescriptionDetail.destroy({ where: { prescription_id: testPrescription.id } });
        await testPrescription.destroy();
        console.log('\n🧹 Cleaned up test data');

        // Khôi phục stock
        await updatedDrug.update({ quantity: updatedDrug.quantity + 5 });
        console.log('🔄 Restored original stock');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
