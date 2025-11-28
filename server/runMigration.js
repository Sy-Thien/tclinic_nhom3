const sequelize = require('./config/database');

async function runMigration(migrationFile) {
    try {
        const migration = require(`./migrations/${migrationFile}`);
        console.log(`🔄 Running migration: ${migrationFile}...`);

        await migration.up(sequelize.getQueryInterface(), sequelize.constructor);

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

const migrationFile = process.argv[2];
if (!migrationFile) {
    console.error('❌ Please provide migration file name');
    console.log('Usage: node runMigration.js <migration-file-name>');
    process.exit(1);
}

runMigration(migrationFile);
