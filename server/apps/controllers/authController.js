const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Admin, Doctor, Patient } = require('../Database/Entity');

class AuthController {
    // POST - Register (CHỈ CHO PATIENT)
    async register(req, res) {
        try {
            const { name, email, phone, password } = req.body;

            console.log('📝 Patient register:', { name, email, phone });

            if (!name || !email || !phone || !password) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
            }

            if (password.length < 6) {
                return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
            }

            const existingPatient = await Patient.findOne({
                where: { email: email }
            });

            if (existingPatient) {
                return res.status(400).json({ message: 'Email đã được đăng ký' });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);

            const patient = await Patient.create({
                full_name: name,
                email,
                phone,
                password: hashedPassword,
                gender: 'other'
            });

            console.log('✅ Patient created:', patient.id);

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
    }

    // POST - Login (ADMIN, DOCTOR, PATIENT)
    async login(req, res) {
        try {
            console.log('🔐 Login attempt:', req.body);

            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: 'Thiếu username hoặc password' });
            }

            let user;
            let userType = null;

            // 1. Tìm Admin
            user = await Admin.findOne({
                where: {
                    [Op.or]: [
                        { username: username },
                        { email: username }
                    ]
                }
            });
            if (user) userType = 'admin';

            // 2. Tìm Doctor
            if (!user) {
                user = await Doctor.findOne({
                    where: { email: username }
                });
                if (user) userType = 'doctor';
            }

            // 3. Tìm Patient
            if (!user) {
                user = await Patient.findOne({
                    where: { email: username }
                });
                if (user) userType = 'patient';
            }

            if (!user) {
                console.log('❌ User not found:', username);
                return res.status(401).json({ message: 'Tài khoản không tồn tại' });
            }

            // Kiểm tra tài khoản có bị vô hiệu hóa không
            if (user.is_active === false || user.is_active === 0) {
                console.log('❌ Account disabled:', username);
                return res.status(403).json({
                    message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
                });
            }

            console.log('✅ User found:', user.email || user.username, 'Type:', userType);

            const isValid = bcrypt.compareSync(password, user.password);

            if (!isValid) {
                console.log('❌ Invalid password');
                return res.status(401).json({ message: 'Mật khẩu không đúng' });
            }

            // Tạo session_token duy nhất để single session
            const sessionToken = crypto.randomBytes(32).toString('hex');

            await user.update({ session_token: sessionToken });
            console.log('✅ Session token saved for user:', user.id);

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email || user.username,
                    role: userType,
                    doctor_id: userType === 'doctor' ? user.id : null,
                    sessionToken: sessionToken
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
    }

    // GET - Verify token
    verifyToken(req, res) {
        console.log('🔍 Token verified:', req.user);
        res.json({ valid: true, user: req.user });
    }

    // GET - Verify session (kiểm tra single session)
    async verifySession(req, res) {
        try {
            const { id, role, sessionToken } = req.user;

            if (!sessionToken) {
                return res.json({ valid: false, reason: 'no_session_token' });
            }

            let user = null;

            if (role === 'admin') {
                user = await Admin.findByPk(id);
            } else if (role === 'doctor') {
                user = await Doctor.findByPk(id);
            } else if (role === 'patient') {
                user = await Patient.findByPk(id);
            }

            if (!user) {
                return res.json({ valid: false, reason: 'user_not_found' });
            }

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
    }

    // POST - Logout (xóa session_token)
    async logout(req, res) {
        try {
            const { id, role } = req.user;

            let user = null;

            if (role === 'admin') {
                user = await Admin.findByPk(id);
            } else if (role === 'doctor') {
                user = await Doctor.findByPk(id);
            } else if (role === 'patient') {
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
    }

    // POST - Change Password (for all roles)
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;
            const userRole = req.user.role;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            }

            let Model;
            switch (userRole) {
                case 'admin':
                    Model = Admin;
                    break;
                case 'doctor':
                    Model = Doctor;
                    break;
                case 'patient':
                    Model = Patient;
                    break;
                default:
                    return res.status(400).json({ message: 'Role không hợp lệ' });
            }

            const user = await Model.findByPk(userId);
            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await user.update({ password: hashedPassword });

            console.log('✅ Password changed for user:', userId, 'role:', userRole);
            res.json({ message: 'Đổi mật khẩu thành công' });
        } catch (error) {
            console.error('❌ Change password error:', error);
            res.status(500).json({ message: 'Lỗi khi đổi mật khẩu', error: error.message });
        }
    }
}

module.exports = new AuthController();



