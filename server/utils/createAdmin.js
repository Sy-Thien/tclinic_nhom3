const bcrypt = require('bcryptjs');
const Doctor = require('../models/Doctor');

async function createAdmin() {
    try {
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await Doctor.create({
            email: 'admin@clinic.com',
            password: hashedPassword,
            name: 'System Admin',
            role: 'admin'
        });

        console.log('Admin created:', admin.toJSON());
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

createAdmin();