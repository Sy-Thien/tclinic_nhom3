const { Invoice } = require('./models');
const { Op, literal, fn, col } = require('sequelize');

(async () => {
    try {
        // Test 1: All paid invoices
        const total = await Invoice.sum('total_amount', {
            where: { payment_status: 'paid' }
        });
        console.log('Total all paid:', total);

        // Test 2: With DATE filter
        const result = await Invoice.sum('total_amount', {
            where: {
                payment_status: 'paid',
                [Op.and]: [
                    literal("DATE(created_at) >= '2025-11-06'"),
                    literal("DATE(created_at) <= '2025-12-06'")
                ]
            }
        });
        console.log('With date filter:', result);

        // Test 3: Raw query
        const sequelize = require('./config/database');
        const [rows] = await sequelize.query(`
            SELECT SUM(total_amount) as total 
            FROM tn_invoices 
            WHERE payment_status = 'paid' 
            AND DATE(created_at) BETWEEN '2025-11-06' AND '2025-12-06'
        `);
        console.log('Raw query result:', rows);

        // Test 4: Check created_at values
        const invoices = await Invoice.findAll({
            attributes: ['id', 'total_amount', 'created_at'],
            where: { payment_status: 'paid' },
            raw: true
        });
        console.log('Invoices:', invoices);

    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
})();
