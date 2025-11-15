const db = require('../config/database');
const bcrypt = require('bcrypt');

// ===== 1. LẤY DANH SÁCH BÁC SĨ =====
const getAllDoctors = async (req, res) => {
    try {
        const { specialty_id, status } = req.query;

        let query = `
            SELECT 
                d.*,
                s.name as specialty_name,
                u.username,
                u.email as user_email
            FROM tn_doctors d
            LEFT JOIN tn_specialties s ON d.specialty_id = s.id
            LEFT JOIN tn_users u ON d.user_id = u.id
            WHERE 1=1
        `;

        const params = [];

        if (specialty_id) {
            query += ' AND d.specialty_id = ?';
            params.push(specialty_id);
        }

        if (status !== undefined) {
            query += ' AND d.status = ?';
            params.push(status);
        }

        query += ' ORDER BY d.created_at DESC';

        const [doctors] = await db.query(query, params);

        res.json({
            success: true,
            data: doctors
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bác sĩ!'
        });
    }
};

// ===== 2. LẤY THÔNG TIN 1 BÁC SĨ =====
const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [doctors] = await db.query(
            `SELECT 
                d.*,
                s.name as specialty_name,
                u.username,
                u.email as user_email
            FROM tn_doctors d
            LEFT JOIN tn_specialties s ON d.specialty_id = s.id
            LEFT JOIN tn_users u ON d.user_id = u.id
            WHERE d.id = ?`,
            [id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bác sĩ!'
            });
        }

        res.json({
            success: true,
            data: doctors[0]
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin bác sĩ!'
        });
    }
};

// ===== 3. THÊM BÁC SĨ MỚI =====
const createDoctor = async (req, res) => {
    try {
        const {
            full_name,
            email,
            phone,
            gender,
            birthday,
            address,
            specialty_id,
            degree,
            experience_years,
            description,
            username,
            password
        } = req.body;

        // Validation
        if (!full_name || !email || !phone || !specialty_id || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc!'
            });
        }

        // Kiểm tra username đã tồn tại
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

        // Kiểm tra email đã tồn tại
        const [existingDoctors] = await db.query(
            'SELECT * FROM tn_doctors WHERE email = ?',
            [email]
        );

        if (existingDoctors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email đã được sử dụng!'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user account
        const [userResult] = await db.query(
            'INSERT INTO tn_users (username, password, email, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, 'doctor']
        );

        const user_id = userResult.insertId;

        // Tạo doctor profile
        const [doctorResult] = await db.query(
            `INSERT INTO tn_doctors (
                user_id, full_name, email, phone, gender, birthday, address,
                specialty_id, degree, experience_years, description, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                user_id,
                full_name,
                email,
                phone,
                gender,
                birthday || null,
                address || null,
                specialty_id,
                degree || null,
                experience_years || 0,
                description || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Thêm bác sĩ thành công!',
            data: {
                doctor_id: doctorResult.insertId,
                user_id
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm bác sĩ!',
            error: error.message
        });
    }
};

// ===== 4. CẬP NHẬT BÁC SĨ =====
const updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            full_name,
            email,
            phone,
            gender,
            birthday,
            address,
            specialty_id,
            degree,
            experience_years,
            description,
            status
        } = req.body;

        // Kiểm tra bác sĩ tồn tại
        const [doctors] = await db.query(
            'SELECT * FROM tn_doctors WHERE id = ?',
            [id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bác sĩ!'
            });
        }

        // Kiểm tra email trùng (ngoại trừ bác sĩ hiện tại)
        if (email) {
            const [existingDoctors] = await db.query(
                'SELECT * FROM tn_doctors WHERE email = ? AND id != ?',
                [email, id]
            );

            if (existingDoctors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng!'
                });
            }
        }

        // Cập nhật thông tin
        await db.query(
            `UPDATE tn_doctors SET
                full_name = ?,
                email = ?,
                phone = ?,
                gender = ?,
                birthday = ?,
                address = ?,
                specialty_id = ?,
                degree = ?,
                experience_years = ?,
                description = ?,
                status = ?
            WHERE id = ?`,
            [
                full_name,
                email,
                phone,
                gender,
                birthday || null,
                address || null,
                specialty_id,
                degree || null,
                experience_years || 0,
                description || null,
                status !== undefined ? status : 1,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Cập nhật bác sĩ thành công!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật bác sĩ!'
        });
    }
};

// ===== 5. XÓA BÁC SĨ (SOFT DELETE) =====
const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra bác sĩ có lịch hẹn đang hoạt động không
        const [activeAppointments] = await db.query(
            `SELECT COUNT(*) as count FROM tn_appointments 
             WHERE doctor_id = ? AND status IN ('pending', 'confirmed', 'in_progress')`,
            [id]
        );

        if (activeAppointments[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa bác sĩ đang có lịch hẹn hoạt động!'
            });
        }

        // Soft delete: set status = 0
        await db.query(
            'UPDATE tn_doctors SET status = 0 WHERE id = ?',
            [id]
        );

        // Vô hiệu hóa user account
        const [doctors] = await db.query(
            'SELECT user_id FROM tn_doctors WHERE id = ?',
            [id]
        );

        if (doctors.length > 0 && doctors[0].user_id) {
            await db.query(
                'UPDATE tn_users SET status = 0 WHERE id = ?',
                [doctors[0].user_id]
            );
        }

        res.json({
            success: true,
            message: 'Xóa bác sĩ thành công!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bác sĩ!'
        });
    }
};

// ===== 6. RESET PASSWORD =====
const resetDoctorPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự!'
            });
        }

        // Lấy user_id
        const [doctors] = await db.query(
            'SELECT user_id FROM tn_doctors WHERE id = ?',
            [id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bác sĩ!'
            });
        }

        const user_id = doctors[0].user_id;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'Bác sĩ chưa có tài khoản!'
            });
        }

        // Hash password mới
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Cập nhật password
        await db.query(
            'UPDATE tn_users SET password = ? WHERE id = ?',
            [hashedPassword, user_id]
        );

        res.json({
            success: true,
            message: 'Reset mật khẩu thành công!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi reset mật khẩu!'
        });
    }
};

module.exports = {
    getAllDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    resetDoctorPassword
};