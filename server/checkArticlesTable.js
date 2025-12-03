const { sequelize } = require('./models');

async function checkTable() {
    try {
        console.log('Checking tn_articles table...');

        const [results] = await sequelize.query('SHOW TABLES LIKE "tn_articles"');

        if (results.length === 0) {
            console.log('❌ Table tn_articles does NOT exist!');
            console.log('\n💡 You need to run migration:');
            console.log('   npx sequelize-cli migration:generate --name create-articles-table');
            process.exit(1);
        }

        console.log('✅ Table tn_articles exists');

        // Check structure
        const [columns] = await sequelize.query('DESCRIBE tn_articles');
        console.log('\n📋 Table structure:');
        columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `[${col.Key}]` : ''}`);
        });

        // Check category table
        const [catResults] = await sequelize.query('SHOW TABLES LIKE "tn_article_categories"');
        if (catResults.length === 0) {
            console.log('\n❌ Table tn_article_categories does NOT exist!');
        } else {
            console.log('\n✅ Table tn_article_categories exists');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkTable();
