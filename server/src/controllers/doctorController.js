const db = require('../config/database');

// ===== 1. LẤY THÔNG TIN BÁC SĨ =====
const getMyProfile = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [doctors] = await db.query(
            `SELECT 
                d.*,
                s.name as specialty_name,
                u.username,
                u.email as user_email
            FROM tn_doctors d
            LEFT JOIN tn_specialties s ON d.specialty_id = s.id
            LEFT JOIN tn_users u ON d.user_id = u.id
            WHERE d.user_id = ?`,
            [user_id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ!'
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
            message: 'Lỗi khi lấy thông tin!'
        });
    }
};

// ===== 2. LẤY LỊCH KHÁM CỦA BÁC SĨ =====
const getMyAppointments = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { status, date } = req.query;

        // Lấy doctor_id từ user_id
        const [doctors] = await db.query(
            'SELECT id FROM tn_doctors WHERE user_id = ?',
            [user_id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ!'
            });
        }

        const doctor_id = doctors[0].id;

        let query = `
            SELECT 
                a.*,
                s.name as service_name,
                s.price as service_price,
                sp.name as specialty_name
            FROM tn_appointments a
            LEFT JOIN tn_services s ON a.service_id = s.id
            LEFT JOIN tn_specialties sp ON s.specialty_id = sp.id
            WHERE a.doctor_id = ?
        `;

        const params = [doctor_id];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        if (date) {
            query += ' AND a.date = ?';
            params.push(date);
        }

        query += ' ORDER BY a.date ASC, a.appointment_time ASC';

        const [appointments] = await db.query(query, params);

        res.json({
            success: true,
            data: appointments
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách lịch hẹn!'
        });
    }
};

// ===== 3. CẬP NHẬT TRẠNG THÁI LỊCH HẸN =====
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user_id = req.user.id;

        // Lấy doctor_id
        const [doctors] = await db.query(
            'SELECT id FROM tn_doctors WHERE user_id = ?',
            [user_id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ!'
            });
        }

        const doctor_id = doctors[0].id;

        // Kiểm tra lịch hẹn thuộc về bác sĩ này
        const [appointments] = await db.query(
            'SELECT * FROM tn_appointments WHERE id = ? AND doctor_id = ?',
            [id, doctor_id]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch hẹn!'
            });
        }

        // Cập nhật trạng thái
        const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ!'
            });
        }

        await db.query(
            'UPDATE tn_appointments SET status = ? WHERE id = ?',
            [status, id]
        );

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái!'
        });
    }
};

// ===== 4. CẬP NHẬT CHẨN ĐOÁN VÀ ĐƠN THUỐC =====
const updateDiagnosis = async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnosis, prescription } = req.body;
        const user_id = req.user.id;

        // Lấy doctor_id
        const [doctors] = await db.query(
            'SELECT id FROM tn_doctors WHERE user_id = ?',
            [user_id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ!'
            });
        }

        const doctor_id = doctors[0].id;

        // Kiểm tra lịch hẹn
        const [appointments] = await db.query(
            'SELECT * FROM tn_appointments WHERE id = ? AND doctor_id = ?',
            [id, doctor_id]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch hẹn!'
            });
        }

        // Cập nhật chẩn đoán và đơn thuốc
        await db.query(
            'UPDATE tn_appointments SET diagnosis = ?, prescription = ? WHERE id = ?',
            [diagnosis || null, prescription || null, id]
        );

        res.json({
            success: true,
            message: 'Cập nhật thành công!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật!'
        });
    }
};

// ===== 5. THỐNG KÊ CỦA BÁC SĨ =====
const getMyStats = async (req, res) => {
    try {
        const user_id = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        // Lấy doctor_id
        const [doctors] = await db.query(
            'SELECT id FROM tn_doctors WHERE user_id = ?',
            [user_id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin bác sĩ!'
            });
        }

        const doctor_id = doctors[0].id;

        // Lịch hẹn hôm nay
        const [todayAppointments] = await db.query(
            'SELECT COUNT(*) as count FROM tn_appointments WHERE doctor_id = ? AND date = ?',
            [doctor_id, today]
        );

        // Lịch chờ khám
        const [pendingAppointments] = await db.query(
            'SELECT COUNT(*) as count FROM tn_appointments WHERE doctor_id = ? AND status = ?',
            [doctor_id, 'confirmed']
        );

        // Tổng bệnh nhân đã khám
        const [totalPatients] = await db.query(
            'SELECT COUNT(*) as count FROM tn_appointments WHERE doctor_id = ? AND status = ?',
            [doctor_id, 'completed']
        );

        // Tổng lịch hẹn
        const [totalAppointments] = await db.query(
            'SELECT COUNT(*) as count FROM tn_appointments WHERE doctor_id = ?',
            [doctor_id]
        );

        res.json({
            success: true,
            data: {
                todayAppointments: todayAppointments[0].count,
                pendingAppointments: pendingAppointments[0].count,
                totalPatients: totalPatients[0].count,
                totalAppointments: totalAppointments[0].count
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê!'
        });
    }
};

module.exports = {
    getMyProfile,
    getMyAppointments,
    updateAppointmentStatus,
    updateDiagnosis,
    getMyStats
};