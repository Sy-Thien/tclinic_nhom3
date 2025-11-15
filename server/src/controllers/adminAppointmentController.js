const db = require('../config/database');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// ===== 1. LẤY TẤT CẢ LỊCH HẸN =====
const getAllAppointments = async (req, res) => {
    try {
        const { status, date, doctor_id } = req.query;

        let query = `
            SELECT 
                a.*,
                s.name as service_name,
                s.price as service_price,
                sp.name as specialty_name,
                d.full_name as doctor_name,
                u.username as patient_username
            FROM tn_appointments a
            LEFT JOIN tn_services s ON a.service_id = s.id
            LEFT JOIN tn_specialties sp ON s.specialty_id = sp.id
            LEFT JOIN tn_doctors d ON a.doctor_id = d.id
            LEFT JOIN tn_users u ON a.patient_id = u.id
            WHERE 1=1
        `;

        const params = [];

        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        if (date) {
            query += ' AND a.date = ?';
            params.push(date);
        }

        if (doctor_id) {
            query += ' AND a.doctor_id = ?';
            params.push(doctor_id);
        }

        query += ' ORDER BY a.date DESC, a.appointment_time DESC';

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

// ===== 2. THỐNG KÊ TỔNG QUAN =====
const getAppointmentStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Tổng lịch hẹn hôm nay
        const [todayTotal] = await db.query(
            'SELECT COUNT(*) as count FROM tn_appointments WHERE date = ?',
            [today]
        );

        // Lịch hẹn hoàn thành hôm nay
        const [todayCompleted] = await db.query(
            'SELECT COUNT(*) as count FROM tn_appointments WHERE date = ? AND status = ?',
            [today, 'completed']
        );

        // Tổng lịch hẹn
        const [totalAppointments] = await db.query(
            'SELECT COUNT(*) as count FROM tn_appointments'
        );

        // Tổng bệnh nhân
        const [totalPatients] = await db.query(
            'SELECT COUNT(DISTINCT patient_id) as count FROM tn_appointments WHERE patient_id IS NOT NULL'
        );

        // Lịch chờ xác nhận
        const [pending] = await db.query(
            'SELECT COUNT(*) as count FROM tn_appointments WHERE status = ?',
            ['pending']
        );

        res.json({
            success: true,
            data: {
                todayTotal: todayTotal[0].count,
                todayCompleted: todayCompleted[0].count,
                totalAppointments: totalAppointments[0].count,
                totalPatients: totalPatients[0].count,
                pendingAppointments: pending[0].count
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

// ===== 3. DUYỆT LỊCH HẸN =====
const confirmAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctor_id } = req.body;

        // Kiểm tra lịch hẹn
        const [appointments] = await db.query(
            'SELECT * FROM tn_appointments WHERE id = ?',
            [id]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch hẹn!'
            });
        }

        const appointment = appointments[0];

        if (appointment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Lịch hẹn đã được xử lý!'
            });
        }

        // Cập nhật trạng thái
        await db.query(
            'UPDATE tn_appointments SET status = ?, doctor_id = ? WHERE id = ?',
            ['confirmed', doctor_id || null, id]
        );

        // Gửi email thông báo
        if (appointment.patient_email) {
            try {
                let doctorName = 'Đang phân công';
                if (doctor_id) {
                    const [doctors] = await db.query(
                        'SELECT full_name FROM tn_doctors WHERE id = ?',
                        [doctor_id]
                    );
                    if (doctors.length > 0) {
                        doctorName = doctors[0].full_name;
                    }
                }

                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: appointment.patient_email,
                    subject: '✅ Lịch khám đã được xác nhận - Tclinic',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #10b981; text-align: center;">✅ Lịch khám đã được xác nhận!</h2>
                            <p>Xin chào <strong>${appointment.patient_name}</strong>,</p>
                            <p>Lịch khám của bạn đã được xác nhận:</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb;">
                                <tr style="background: #10b981; color: white;">
                                    <th style="padding: 12px; text-align: left;">Thông tin</th>
                                    <th style="padding: 12px; text-align: left;">Chi tiết</th>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Mã lịch hẹn</strong></td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${appointment.booking_code}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Bác sĩ phụ trách</strong></td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${doctorName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Ngày khám</strong></td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${appointment.date}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px;"><strong>Giờ khám</strong></td>
                                    <td style="padding: 12px;">${appointment.appointment_time}</td>
                                </tr>
                            </table>
                            
                            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <p style="margin: 0; color: #1e40af;">
                                    <strong>📌 Vui lòng:</strong><br>
                                    • Có mặt trước giờ hẹn 15 phút<br>
                                    • Mang theo CMND/CCCD<br>
                                    • Hotline: <strong>1900 1234</strong>
                                </p>
                            </div>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Email error:', emailError);
            }
        }

        res.json({
            success: true,
            message: 'Xác nhận lịch hẹn thành công!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xác nhận lịch hẹn!'
        });
    }
};

// ===== 4. HỦY LỊCH HẸN (ADMIN) =====
const cancelAppointmentByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const [appointments] = await db.query(
            'SELECT * FROM tn_appointments WHERE id = ?',
            [id]
        );

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch hẹn!'
            });
        }

        const appointment = appointments[0];

        if (appointment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Lịch hẹn đã bị hủy!'
            });
        }

        // Cập nhật trạng thái
        await db.query(
            'UPDATE tn_appointments SET status = ?, cancellation_reason = ? WHERE id = ?',
            ['cancelled', reason || 'Admin hủy lịch', id]
        );

        // Gửi email thông báo
        if (appointment.patient_email) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: appointment.patient_email,
                    subject: '🚫 Thông báo hủy lịch khám - Tclinic',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #ef4444; text-align: center;">🚫 Lịch khám đã bị hủy</h2>
                            <p>Xin chào <strong>${appointment.patient_name}</strong>,</p>
                            <p>Rất tiếc, lịch khám của bạn đã bị hủy:</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Mã lịch hẹn:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${appointment.booking_code}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Ngày khám:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${appointment.date}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ddd;"><strong>Lý do:</strong></td>
                                    <td style="padding: 10px; border: 1px solid #ddd;">${reason || 'Không có lý do cụ thể'}</td>
                                </tr>
                            </table>
                            
                            <p>Vui lòng liên hệ <strong>1900 1234</strong> để đặt lịch mới.</p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Email error:', emailError);
            }
        }

        res.json({
            success: true,
            message: 'Hủy lịch hẹn thành công!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy lịch hẹn!'
        });
    }
};

// ===== 5. GÁN BÁC SĨ =====
const assignDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctor_id } = req.body;

        if (!doctor_id) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn bác sĩ!'
            });
        }

        // Kiểm tra bác sĩ có tồn tại
        const [doctors] = await db.query(
            'SELECT * FROM tn_doctors WHERE id = ?',
            [doctor_id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bác sĩ không tồn tại!'
            });
        }

        // Cập nhật bác sĩ
        await db.query(
            'UPDATE tn_appointments SET doctor_id = ? WHERE id = ?',
            [doctor_id, id]
        );

        res.json({
            success: true,
            message: 'Gán bác sĩ thành công!'
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gán bác sĩ!'
        });
    }
};

// ===== 6. CẬP NHẬT TRẠNG THÁI =====
const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

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

module.exports = {
    getAllAppointments,
    getAppointmentStats,
    confirmAppointment,
    cancelAppointmentByAdmin,
    assignDoctor,
    updateAppointmentStatus
};