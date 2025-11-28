/**
 * UPDATE TEST ACCOUNT PASSWORDS
 * Cập nhật password cho tài khoản test
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/database');
const Admin = require('./models/Admin');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

// Password mặc định: "123456"
const DEFAULT_PASSWORD = '123456';

async function updatePasswords() {
    try {
        console.log('🔐 Cập nhật password cho tài khoản test...\n');

        const hashedPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 10);

        // 1. Update Admin
        console.log('📌 Cập nhật Admin...');
        const adminUpdate = await Admin.update(
            { password: hashedPassword },
            { where: { username: 'admin' } }
        );
        console.log(`✅ Admin: ${adminUpdate[0]} account(s) updated`);

        // 2. Update Doctors
        console.log('\n📌 Cập nhật Doctors...');
        const doctorUpdate = await Doctor.update(
            { password: hashedPassword },
            { where: {} }
        );
        console.log(`✅ Doctor: ${doctorUpdate[0]} account(s) updated`);

        // 3. Update Patients
        console.log('\n📌 Cập nhật Patients...');
        const patientUpdate = await Patient.update(
            { password: hashedPassword },
            { where: {} }
        );
        console.log(`✅ Patient: ${patientUpdate[0]} account(s) updated`);

        console.log('\n✅ CẬP NHẬT HOÀN TẤT!\n');
        console.log('🔑 TÀI KHOẢN TEST:');
        console.log('='.repeat(60));
        console.log('Password mặc định cho TẤT CẢ: "123456"');
        console.log('');
        console.log('Admin:');
        console.log('  Username: admin');
        console.log('  Password: 123456');
        console.log('  → /admin');
        console.log('');
        console.log('Doctor:');
        console.log('  Email: doctor1@clinic.com');
        console.log('  Password: 123456');
        console.log('  → /doctor');
        console.log('');
        console.log('Patient:');
        console.log('  Email: patient1@gmail.com');
        console.log('  Password: 123456');
        console.log('  → /');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

// Run
updatePasswords();
