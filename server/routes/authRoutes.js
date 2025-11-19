const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { verifyToken } = require('../middleware/authMiddleware');

let Admin, Patient, Doctor;
try {
    const models = require('../models');
    Admin = models.Admin;
    Patient = models.Patient;
    Doctor = models.Doctor;
    console.log('✅ Models loaded');
} catch (error) {
    console.error('❌ Cannot load models:', error.message);
}

// ✅ POST - Register (CHỈ CHO PATIENT)
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        console.log('📝 Patient register:', { name, email, phone });

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        // Kiểm tra email đã tồn tại
        const existingPatient = await Patient.findOne({
            where: { email: email }
        });

        if (existingPatient) {
            return res.status(400).json({ message: 'Email đã được đăng ký' });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Tạo patient
        const patient = await Patient.create({
            full_name: name,
            email,
            phone,
            password: hashedPassword,
            gender: 'other'
        });

        console.log('✅ Patient created:', patient.id);

        // Tạo token
        const token = jwt.sign(
            {
                id: patient.id,
                email: patient.email,
                role: 'patient'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Đăng ký thành công',
            token,
            user: {
                id: patient.id,
                name: patient.full_name,
                email: patient.email,
                phone: patient.phone,
                role: 'patient'
            }
        });

    } catch (error) {
        console.error('❌ Register error:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// ✅ POST - Login (ADMIN, DOCTOR, PATIENT)
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body);

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Thiếu username hoặc password' });
        }

        let user;
        let userType = null;

        // 1. Tìm Admin
        if (Admin) {
            user = await Admin.findOne({
                where: {
                    [Op.or]: [
                        { username: username },
                        { email: username }
                    ]
                }
            });
            if (user) userType = 'admin';
        }

        // 2. Tìm Doctor
        if (!user && Doctor) {
            user = await Doctor.findOne({
                where: { email: username }
            });
            if (user) userType = 'doctor';
        }

        // 3. Tìm Patient
        if (!user && Patient) {
            user = await Patient.findOne({
                where: { email: username }
            });
            if (user) userType = 'patient';
        }

        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ message: 'Tài khoản không tồn tại' });
        }

        console.log('✅ User found:', user.email || user.username, 'Type:', userType);

        // Verify password
        const isValid = bcrypt.compareSync(password, user.password);

        if (!isValid) {
            console.log('❌ Invalid password');
            return res.status(401).json({ message: 'Mật khẩu không đúng' });
        }

        // Create token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email || user.username,
                role: userType,
                doctor_id: userType === 'doctor' ? user.id : null
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        console.log('✅ Login successful');

        res.json({
            token,
            user: {
                id: user.id,
                name: user.full_name || user.username,
                email: user.email,
                phone: user.phone || null,
                role: userType
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            message: 'Lỗi server',
            error: error.message
        });
    }
});

// ✅ GET - Verify token
router.get('/verify', verifyToken, (req, res) => {
    console.log('🔍 Token verified:', req.user);
    res.json({ valid: true, user: req.user });
});

module.exports = router;