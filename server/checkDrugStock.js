const { Drug, Prescription, PrescriptionDetail } = require('./models');

(async () => {
    try {
        console.log('🔍 Checking Drug Stock...\n');

        // Lấy tất cả prescriptions
        const prescriptions = await Prescription.findAll({
            include: [
                {
                    model: PrescriptionDetail,
                    as: 'details',
                    include: [
                        {
                            model: Drug,
                            as: 'drug'
                        }
                    ]
                }
            ],
            order: [['id', 'DESC']],
            limit: 5
        });

        console.log(`📋 Found ${prescriptions.length} recent prescriptions:\n`);

        for (const p of prescriptions) {
            console.log(`Prescription ID: ${p.id} | Code: ${p.prescription_code}`);
            console.log(`Created: ${p.created_at}`);

            if (p.details && p.details.length > 0) {
                console.log('Details:');
                for (const d of p.details) {
                    console.log(`  - Drug: ${d.drug?.name}`);
                    console.log(`    Prescribed Qty: ${d.quantity} ${d.unit}`);
                    console.log(`    Current Stock: ${d.drug?.quantity} ${d.drug?.unit}`);
                }
            }
            console.log('---\n');
        }

        // Kiểm tra tổng số thuốc
        const drugs = await Drug.findAll({
            order: [['id', 'ASC']],
            limit: 10
        });

        console.log('\n💊 Current Drug Stock (Top 10):\n');
        for (const drug of drugs) {
            console.log(`ID: ${drug.id} | ${drug.name}`);
            console.log(`  Stock: ${drug.quantity} ${drug.unit}`);
            console.log(`  Price: ${drug.price} VND`);
            console.log(`  Updated: ${drug.updated_at}\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
})();
