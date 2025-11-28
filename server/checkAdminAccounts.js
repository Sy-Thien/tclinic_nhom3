const { Admin } = require('./models');

async function checkAdmin() {
    try {
        const admins = await Admin.findAll({
            attributes: ['id', 'username', 'email'],
            limit: 5
        });

        console.log('📋 Admin accounts:');
        admins.forEach(a => {
            console.log(`  Username: ${a.username}, Email: ${a.email || 'N/A'}`);
        });

        console.log('\n💡 Login credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123 (or check your admin seeder)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAdmin();
