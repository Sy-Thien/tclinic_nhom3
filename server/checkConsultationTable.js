const { sequelize } = require('./models');

async function checkTable() {
    try {
        const [results] = await sequelize.query('SHOW TABLES LIKE "tn_consultation_requests"');

        if (results.length > 0) {
            console.log('✅ Table tn_consultation_requests exists');

            // Check structure
            const [structure] = await sequelize.query('DESCRIBE tn_consultation_requests');
            console.log('\n📊 Table structure:');
            structure.forEach(field => {
                console.log(`  - ${field.Field} (${field.Type})`);
            });
        } else {
            console.log('❌ Table tn_consultation_requests does NOT exist');
        }
    } catch (error) {
        console.error('❌ Error checking table:', error.message);
    } finally {
        process.exit();
    }
}

checkTable();
