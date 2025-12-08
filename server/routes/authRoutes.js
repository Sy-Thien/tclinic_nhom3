const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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

        // ✅ Kiểm tra tài khoản có bị vô hiệu hóa không
        if (user.is_active === false || user.is_active === 0) {
            console.log('❌ Account disabled:', username);
            return res.status(403).json({
                message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
            });
        }

        console.log('✅ User found:', user.email || user.username, 'Type:', userType);

        // Verify password
        const isValid = bcrypt.compareSync(password, user.password);

        if (!isValid) {
            console.log('❌ Invalid password');
            return res.status(401).json({ message: 'Mật khẩu không đúng' });
        }

        // ✅ Tạo session_token duy nhất để single session
        const sessionToken = crypto.randomBytes(32).toString('hex');

        // Lưu session_token vào database
        await user.update({ session_token: sessionToken });
        console.log('✅ Session token saved for user:', user.id);

        // Create token với session_token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email || user.username,
                role: userType,
                doctor_id: userType === 'doctor' ? user.id : null,
                sessionToken: sessionToken // ✅ Include session token in JWT
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

// ✅ GET - Verify session (kiểm tra single session)
router.get('/verify-session', verifyToken, async (req, res) => {
    try {
        const { id, role, sessionToken } = req.user;

        if (!sessionToken) {
            return res.json({ valid: false, reason: 'no_session_token' });
        }

        let user = null;

        // Tìm user theo role
        if (role === 'admin' && Admin) {
            user = await Admin.findByPk(id);
        } else if (role === 'doctor' && Doctor) {
            user = await Doctor.findByPk(id);
        } else if (role === 'patient' && Patient) {
            user = await Patient.findByPk(id);
        }

        if (!user) {
            return res.json({ valid: false, reason: 'user_not_found' });
        }

        // ✅ So sánh session_token trong JWT với DB
        if (user.session_token !== sessionToken) {
            console.log('⚠️ Session invalid - đã đăng nhập từ nơi khác');
            return res.json({
                valid: false,
                reason: 'session_expired',
                message: 'Tài khoản đã đăng nhập từ thiết bị khác'
            });
        }

        res.json({ valid: true });
    } catch (error) {
        console.error('❌ Verify session error:', error);
        res.json({ valid: false, reason: 'error' });
    }
});

// ✅ POST - Logout (xóa session_token)
router.post('/logout', verifyToken, async (req, res) => {
    try {
        const { id, role } = req.user;

        let user = null;

        if (role === 'admin' && Admin) {
            user = await Admin.findByPk(id);
        } else if (role === 'doctor' && Doctor) {
            user = await Doctor.findByPk(id);
        } else if (role === 'patient' && Patient) {
            user = await Patient.findByPk(id);
        }

        if (user) {
            await user.update({ session_token: null });
            console.log('✅ Logged out user:', id);
        }

        res.json({ success: true, message: 'Đăng xuất thành công' });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// ✅ POST - Change Password (for all roles)
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        // Determine which model to use
        let Model, user;
        if (userRole === 'admin') {
            Model = Admin;
        } else if (userRole === 'doctor') {
            Model = Doctor;
        } else if (userRole === 'patient') {
            Model = Patient;
        } else {
            return res.status(400).json({ message: 'Role không hợp lệ' });
        }

        // Find user
        user = await Model.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await user.update({ password: hashedPassword });

        console.log('✅ Password changed for user:', userId, 'role:', userRole);
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('❌ Change password error:', error);
        res.status(500).json({ message: 'Lỗi khi đổi mật khẩu', error: error.message });
    }
});

module.exports = router;