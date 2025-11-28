/**
 * TEST ACCOUNTS CHECKER
 * Script kiểm tra các tài khoản test trong database
 */

const { sequelize } = require('./config/database');
const Admin = require('./models/Admin');
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');

async function checkAccounts() {
    try {
        console.log('🔍 Kiểm tra tài khoản test...\n');

        // 1. Check Admins
        console.log('📌 ADMIN ACCOUNTS:');
        console.log('='.repeat(60));
        const admins = await Admin.findAll({
            attributes: ['id', 'username', 'email', 'full_name', 'role', 'is_active'],
            limit: 5
        });

        if (admins.length === 0) {
            console.log('❌ Không có admin nào trong database');
            console.log('💡 Tạo admin test: npm run seed:admin\n');
        } else {
            admins.forEach(admin => {
                console.log(`✅ ID: ${admin.id}`);
                console.log(`   Username: ${admin.username}`);
                console.log(`   Email: ${admin.email}`);
                console.log(`   Name: ${admin.full_name || 'N/A'}`);
                console.log(`   Role: ${admin.role}`);
                console.log(`   Active: ${admin.is_active ? 'Yes' : 'No'}`);
                console.log(`   Login: username="${admin.username}" hoặc email="${admin.email}"`);
                console.log('');
            });
        }

        // 2. Check Doctors
        console.log('📌 DOCTOR ACCOUNTS:');
        console.log('='.repeat(60));
        const doctors = await Doctor.findAll({
            attributes: ['id', 'email', 'full_name', 'specialty_id', 'is_active'],
            limit: 5
        });

        if (doctors.length === 0) {
            console.log('❌ Không có bác sĩ nào trong database');
            console.log('💡 Tạo qua Admin panel hoặc SQL\n');
        } else {
            doctors.forEach(doctor => {
                console.log(`✅ ID: ${doctor.id}`);
                console.log(`   Email: ${doctor.email}`);
                console.log(`   Name: ${doctor.full_name}`);
                console.log(`   Specialty ID: ${doctor.specialty_id || 'N/A'}`);
                console.log(`   Active: ${doctor.is_active ? 'Yes' : 'No'}`);
                console.log(`   Login: email="${doctor.email}"`);
                console.log('');
            });
        }

        // 3. Check Patients
        console.log('📌 PATIENT ACCOUNTS:');
        console.log('='.repeat(60));
        const patients = await Patient.findAll({
            attributes: ['id', 'email', 'full_name', 'phone', 'is_active'],
            limit: 5
        });

        if (patients.length === 0) {
            console.log('❌ Không có bệnh nhân nào trong database');
            console.log('💡 Đăng ký tại: /register\n');
        } else {
            patients.forEach(patient => {
                console.log(`✅ ID: ${patient.id}`);
                console.log(`   Email: ${patient.email}`);
                console.log(`   Name: ${patient.full_name}`);
                console.log(`   Phone: ${patient.phone}`);
                console.log(`   Active: ${patient.is_active ? 'Yes' : 'No'}`);
                console.log(`   Login: email="${patient.email}"`);
                console.log('');
            });
        }

        // Summary
        console.log('📊 TỔNG KẾT:');
        console.log('='.repeat(60));
        console.log(`✅ Admin:   ${admins.length}`);
        console.log(`✅ Doctor:  ${doctors.length}`);
        console.log(`✅ Patient: ${patients.length}`);
        console.log(`✅ Total:   ${admins.length + doctors.length + patients.length}`);

        console.log('\n💡 TEST LOGIN:');
        console.log('='.repeat(60));
        console.log('URL: http://localhost:5173/login');
        console.log('');

        if (admins.length > 0) {
            console.log(`🔑 Admin Test:`);
            console.log(`   Username: ${admins[0].username}`);
            console.log(`   Password: (kiểm tra trong database hoặc dùng default)`);
            console.log(`   Sau login → /admin`);
            console.log('');
        }

        if (doctors.length > 0) {
            console.log(`🔑 Doctor Test:`);
            console.log(`   Email: ${doctors[0].email}`);
            console.log(`   Password: (kiểm tra trong database hoặc dùng default)`);
            console.log(`   Sau login → /doctor`);
            console.log('');
        }

        if (patients.length > 0) {
            console.log(`🔑 Patient Test:`);
            console.log(`   Email: ${patients[0].email}`);
            console.log(`   Password: (kiểm tra trong database hoặc dùng default)`);
            console.log(`   Sau login → /`);
            console.log('');
        }

        console.log('✅ Kiểm tra hoàn tất!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

// Run
checkAccounts();
