const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        // Validation
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin!'
            });
        }

        // Check username exists
        const [existingUsers] = await db.query(
            'SELECT * FROM tn_users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username đã tồn tại!'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO tn_users (username, email, password, full_name, role, status) VALUES (?, ?, ?, ?, ?, 1)',
            [username, email, hashedPassword, full_name, 'customer']
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công!',
            data: { id: result.insertId, username, email }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng ký!',
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập username và password!'
            });
        }

        const [users] = await db.query(
            'SELECT * FROM tn_users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc password không đúng!'
            });
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Username hoặc password không đúng!'
            });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng nhập!',
            error: error.message
        });
    }
};

module.exports = { register, login };