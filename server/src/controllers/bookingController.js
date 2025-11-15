const db = require('../config/database');
const nodemailer = require('nodemailer');

// Cấu hình email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// ===== 1. ĐẶT LỊCH KHÁM =====
const createBooking = async (req, res) => {
    const {
        name,
        email,
        phone,
        birthday,
        gender,
        address,
        service_id,
        date,  // appointment_date → date (theo bảng của bạn)
        time,  // appointment_hour → time
        symptoms
    } = req.body;

    try {
        // Validation
        if (!name || !phone || !service_id || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin!'
            });
        }

        // Lấy patient_id nếu đã đăng nhập
        let patient_id = null;
        if (req.user) {
            patient_id = req.user.id;
        }

        // Tạo mã booking
        const booking_code = `BK${Date.now()}`;

        // Lấy thông tin dịch vụ
        const [services] = await db.query(
            'SELECT * FROM tn_services WHERE id = ?',
            [service_id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Dịch vụ không tồn tại!'
            });
        }

        const service = services[0];

        // Kiểm tra trùng lịch
        const [existing] = await db.query(
            `SELECT COUNT(*) as count FROM tn_appointments 
             WHERE date = ? AND appointment_time = ? AND status != 'cancelled'`,
            [date, time]
        );

        if (existing[0].count >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Khung giờ này đã đầy!'
            });
        }

        // Insert vào database
        const [result] = await db.query(
            `INSERT INTO tn_appointments (
                doctor_id,
                patient_id,
                booking_code,
                patient_name,
                patient_email,
                patient_phone,
                patient_birthday,
                patient_gender,
                patient_address,
                service_id,
                referral_order,
                position,
                appointment_time,
                appointment_hour,
                date,
                symptoms,
                status
            ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, 'pending')`,
            [
                patient_id,
                booking_code,
                name,
                email,
                phone,
                birthday,
                gender,
                address,
                service_id,
                time,
                time,
                date,
                symptoms
            ]
        );

        // Gửi email xác nhận
        if (email) {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: '✅ Xác nhận đặt lịch khám - Tclinic',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #667eea; text-align: center;">✅ Đặt lịch thành công!</h2>
                            <p>Xin chào <strong>${name}</strong>,</p>
                            <p>Lịch khám của bạn đã được xác nhận tại <strong>Phòng Khám Tclinic</strong>:</p>
                            
                            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px;">
                                <tr style="background: #667eea; color: white;">
                                    <th style="padding: 12px; text-align: left;">Thông tin</th>
                                    <th style="padding: 12px; text-align: left;">Chi tiết</th>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Mã đặt lịch</strong></td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #667eea; font-weight: bold;">${booking_code}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Dịch vụ</strong></td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${service.name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Ngày khám</strong></td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${date}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Giờ khám</strong></td>
                                    <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${time}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px;"><strong>Trạng thái</strong></td>
                                    <td style="padding: 12px;"><span style="background: #fef3c7; color: #f59e0b; padding: 4px 12px; border-radius: 4px; font-weight: 600;">Chờ xác nhận</span></td>
                                </tr>
                            </table>
                            
                            <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                                <p style="margin: 0; color: #1e40af;">
                                    <strong>📌 Lưu ý:</strong><br>
                                    • Vui lòng đến đúng giờ<br>
                                    • Mang theo giấy tờ tùy thân<br>
                                    • Hotline hỗ trợ: <strong>1900 1234</strong>
                                </p>
                            </div>
                            
                            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                                Email tự động từ Phòng Khám Tclinic<br>
                                Vui lòng không trả lời email này
                            </p>
                        </div>
                    `
                });
                console.log('✅ Email sent to:', email);
            } catch (emailError) {
                console.error('❌ Email error:', emailError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Đặt lịch thành công!',
            data: {
                booking_id: result.insertId,
                booking_code,
                date,
                time
            }
        });

    } catch (error) {
        console.error('❌ Booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server!',
            error: error.message
        });
    }
};

// ===== 2. XEM LỊCH HẸN CỦA TÔI =====
const getMyAppointments = async (req, res) => {
    try {
        const patient_id = req.user.id;

        const [appointments] = await db.query(
            `SELECT 
                a.*,
                s.name as service_name,
                s.price as service_price,
                d.full_name as doctor_name
            FROM tn_appointments a
            LEFT JOIN tn_services s ON a.service_id = s.id
            LEFT JOIN tn_doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ?
            ORDER BY a.date DESC, a.appointment_time DESC`,
            [patient_id]
        );

        res.json({
            success: true,
            data: appointments
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách!'
        });
    }
};

// ===== 3. HỦY LỊCH HẸN =====
const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const patient_id = req.user.id;

        // Kiểm tra lịch hẹn
        const [appointments] = await db.query(
            'SELECT * FROM tn_appointments WHERE id = ? AND patient_id = ?',
            [id, patient_id]
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

        if (appointment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy lịch đã hoàn thành!'
            });
        }

        // Kiểm tra thời gian
        const appointmentDateTime = new Date(`${appointment.date} ${appointment.appointment_time}`);
        const now = new Date();
        const hoursDiff = (appointmentDateTime - now) / (1000 * 60 * 60);

        if (hoursDiff < 2) {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy lịch trước giờ khám dưới 2 tiếng!'
            });
        }

        // Cập nhật trạng thái
        await db.query(
            'UPDATE tn_appointments SET status = ?, cancellation_reason = ? WHERE id = ?',
            ['cancelled', 'Bệnh nhân hủy', id]
        );

        res.json({
            success: true,
            message: 'Hủy lịch thành công!'
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi hủy lịch!'
        });
    }
};

module.exports = {
    createBooking,
    getMyAppointments,
    cancelAppointment
};