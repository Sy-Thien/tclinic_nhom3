const nodemailer = require('nodemailer');

// Cấu hình email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASSWORD || 'your-app-password'
        }
    });
};

// Gửi email nhắc lịch khám
exports.sendAppointmentReminder = async (appointment) => {
    try {
        const transporter = createTransporter();

        const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('vi-VN');
        const appointmentTime = appointment.appointment_time.substring(0, 5);

        const mailOptions = {
            from: `"Phòng Khám T-Clinic" <${process.env.EMAIL_USER}>`,
            to: appointment.patient_email,
            subject: `[Nhắc lịch] Lịch khám vào ${appointmentDate}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                        .label { font-weight: bold; color: #666; }
                        .value { color: #333; }
                        .highlight { color: #667eea; font-weight: bold; font-size: 18px; }
                        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🏥 NHẮC LỊCH KHÁM</h1>
                            <p>Phòng Khám T-Clinic</p>
                        </div>
                        
                        <div class="content">
                            <p>Xin chào <strong>${appointment.patient_name}</strong>,</p>
                            
                            <p>Đây là email nhắc nhở về lịch khám sắp tới của bạn:</p>
                            
                            <div class="info-box">
                                <div class="info-row">
                                    <span class="label">📅 Ngày khám:</span>
                                    <span class="value highlight">${appointmentDate}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">⏰ Giờ khám:</span>
                                    <span class="value highlight">${appointmentTime}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">👨‍⚕️ Bác sĩ:</span>
                                    <span class="value">${appointment.doctor_name || 'Đang chờ phân công'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">🏥 Chuyên khoa:</span>
                                    <span class="value">${appointment.specialty_name || 'Chưa xác định'}</span>
                                </div>
                                <div class="info-row">
                                    <span class="label">📋 Mã lịch hẹn:</span>
                                    <span class="value">${appointment.booking_code}</span>
                                </div>
                            </div>
                            
                            <p><strong>⚠️ Lưu ý quan trọng:</strong></p>
                            <ul>
                                <li>Vui lòng có mặt trước giờ hẹn 15 phút</li>
                                <li>Mang theo giấy tờ tùy thân và thẻ bảo hiểm (nếu có)</li>
                                <li>Nếu không thể đến, vui lòng hủy lịch trước 2 giờ</li>
                            </ul>
                            
                            <div style="text-align: center;">
                                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/my-appointments" class="button">
                                    Xem chi tiết lịch hẹn
                                </a>
                            </div>
                            
                            <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ:</p>
                            <p>📞 Hotline: 1900-xxxx<br>
                            📧 Email: support@tclinic.com<br>
                            🏥 Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM</p>
                        </div>
                        
                        <div class="footer">
                            <p>© 2025 T-Clinic. All rights reserved.</p>
                            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email reminder sent:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Gửi email xác nhận đặt lịch
exports.sendBookingConfirmation = async (appointment) => {
    try {
        const transporter = createTransporter();

        const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('vi-VN');
        const appointmentTime = appointment.appointment_time.substring(0, 5);

        const mailOptions = {
            from: `"Phòng Khám T-Clinic" <${process.env.EMAIL_USER}>`,
            to: appointment.patient_email,
            subject: `[Xác nhận] Đặt lịch khám thành công - ${appointment.booking_code}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                        .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ ĐẶT LỊCH THÀNH CÔNG</h1>
                            <div class="success-badge">Mã: ${appointment.booking_code}</div>
                        </div>
                        
                        <div class="content">
                            <p>Xin chào <strong>${appointment.patient_name}</strong>,</p>
                            
                            <p>Cảm ơn bạn đã đặt lịch khám tại T-Clinic. Lịch hẹn của bạn đã được xác nhận:</p>
                            
                            <div class="info-box">
                                <p><strong>📅 ${appointmentDate} - ⏰ ${appointmentTime}</strong></p>
                                <p>🏥 ${appointment.specialty_name || 'Khám tổng quát'}</p>
                            </div>
                            
                            <p>Chúng tôi sẽ gửi email nhắc nhở trước giờ khám. Hẹn gặp bạn!</p>
                        </div>
                        
                        <div class="footer">
                            <p>© 2025 T-Clinic</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Booking confirmation sent to:', appointment.patient_email);

    } catch (error) {
        console.error('❌ Confirmation email error:', error);
    }
};

// Gửi email hủy lịch
exports.sendCancellationEmail = async (appointment) => {
    try {
        const transporter = createTransporter();

        const appointmentDate = new Date(appointment.appointment_date).toLocaleDateString('vi-VN');
        const appointmentTime = appointment.appointment_time.substring(0, 5);

        const mailOptions = {
            from: `"Phòng Khám T-Clinic" <${process.env.EMAIL_USER}>`,
            to: appointment.patient_email,
            subject: `[Thông báo] Lịch khám đã bị hủy - ${appointment.booking_code}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>❌ LỊCH KHÁM BỊ HỦY</h1>
                        </div>
                        
                        <div class="content">
                            <p>Xin chào <strong>${appointment.patient_name}</strong>,</p>
                            
                            <p>Lịch khám của bạn vào <strong>${appointmentDate} - ${appointmentTime}</strong> đã bị hủy.</p>
                            
                            <p>Nếu bạn muốn đặt lại lịch khám, vui lòng truy cập website hoặc liên hệ hotline.</p>
                            
                            <p>Trân trọng,<br>T-Clinic</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Cancellation email sent to:', appointment.patient_email);

    } catch (error) {
        console.error('❌ Cancellation email error:', error);
    }
};

// Gửi email thông báo đổi lịch
exports.sendRescheduleEmail = async (appointment) => {
    try {
        const transporter = createTransporter();

        const oldDate = new Date(appointment.old_date).toLocaleDateString('vi-VN');
        const newDate = new Date(appointment.appointment_date).toLocaleDateString('vi-VN');
        const oldTime = appointment.old_time.substring(0, 5);
        const newTime = appointment.appointment_time.substring(0, 5);

        const mailOptions = {
            from: `"Phòng Khám T-Clinic" <${process.env.EMAIL_USER}>`,
            to: appointment.patient_email,
            subject: `[Thông báo] Đổi lịch khám - ${appointment.booking_code}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                        .old-time { text-decoration: line-through; color: #999; }
                        .new-time { color: #667eea; font-weight: bold; font-size: 18px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔄 ĐỔI LỊCH KHÁM</h1>
                            <p>Mã: ${appointment.booking_code}</p>
                        </div>
                        
                        <div class="content">
                            <p>Xin chào <strong>${appointment.patient_name}</strong>,</p>
                            
                            <p>Yêu cầu đổi lịch khám của bạn đã được ghi nhận:</p>
                            
                            <div class="info-box">
                                <p><strong>Lịch cũ:</strong></p>
                                <p class="old-time">📅 ${oldDate} - ⏰ ${oldTime}</p>
                                
                                <p style="margin-top: 15px;"><strong>Lịch mới:</strong></p>
                                <p class="new-time">📅 ${newDate} - ⏰ ${newTime}</p>
                                
                                <p style="margin-top: 15px;">🏥 Chuyên khoa: ${appointment.specialty_name}</p>
                            </div>
                            
                            <p><strong>⚠️ Lưu ý:</strong></p>
                            <ul>
                                <li>Lịch hẹn mới đang chờ bác sĩ xác nhận</li>
                                <li>Bạn sẽ nhận được email khi bác sĩ xác nhận</li>
                                <li>Vui lòng có mặt trước giờ hẹn 15 phút</li>
                            </ul>
                            
                            <p>Cảm ơn bạn đã sử dụng dịch vụ của T-Clinic!</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Reschedule email sent to:', appointment.patient_email);

    } catch (error) {
        console.error('❌ Reschedule email error:', error);
    }
};

module.exports = exports;
