/**
 * Script test gửi email
 * Chạy: node testEmail.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('\n========================================');
    console.log('🔧 KIỂM TRA CẤU HÌNH EMAIL');
    console.log('========================================\n');

    // Kiểm tra cấu hình
    console.log('📧 EMAIL_USER:', process.env.EMAIL_USER || '❌ CHƯA CÀI ĐẶT');
    console.log('🔑 EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Đã cài đặt' : '❌ CHƯA CÀI ĐẶT');
    console.log('🌐 SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('🔢 SMTP_PORT:', process.env.SMTP_PORT || '587');
    console.log('');

    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-email@gmail.com') {
        console.log('❌ Bạn chưa cấu hình email thực!');
        console.log('\n📝 HƯỚNG DẪN CẤU HÌNH GMAIL:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Đăng nhập Gmail: https://mail.google.com');
        console.log('2. Bật xác minh 2 bước: https://myaccount.google.com/security');
        console.log('3. Tạo App Password: https://myaccount.google.com/apppasswords');
        console.log('   - Chọn "Mail" và "Windows Computer"');
        console.log('   - Copy mật khẩu 16 ký tự được tạo');
        console.log('4. Mở file server/.env và cập nhật:');
        console.log('   EMAIL_USER=your-real-email@gmail.com');
        console.log('   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
    }

    // Thử gửi email test
    console.log('📤 Đang thử gửi email test...\n');

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Verify connection
        await transporter.verify();
        console.log('✅ Kết nối SMTP thành công!\n');

        // Gửi email test
        const testEmail = process.env.EMAIL_USER; // Gửi cho chính mình
        const info = await transporter.sendMail({
            from: `"T-Clinic Test" <${process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: '🧪 [TEST] Email từ T-Clinic - ' + new Date().toLocaleString('vi-VN'),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1>✅ EMAIL HOẠT ĐỘNG!</h1>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                        <p>Xin chào!</p>
                        <p>Đây là email test từ hệ thống T-Clinic.</p>
                        <p>Nếu bạn nhận được email này, nghĩa là cấu hình email đã <strong style="color: #10b981;">HOẠT ĐỘNG ĐÚNG</strong>!</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            📅 Thời gian: ${new Date().toLocaleString('vi-VN')}<br>
                            📧 Gửi từ: ${process.env.EMAIL_USER}
                        </p>
                    </div>
                </div>
            `
        });

        console.log('========================================');
        console.log('✅ GỬI EMAIL THÀNH CÔNG!');
        console.log('========================================');
        console.log('📧 Đã gửi đến:', testEmail);
        console.log('🆔 Message ID:', info.messageId);
        console.log('\n👉 Kiểm tra hộp thư (hoặc spam) để xác nhận!');

    } catch (error) {
        console.log('========================================');
        console.log('❌ LỖI GỬI EMAIL!');
        console.log('========================================');
        console.log('Chi tiết lỗi:', error.message);

        if (error.message.includes('Invalid login')) {
            console.log('\n💡 Nguyên nhân: Sai email hoặc App Password');
            console.log('   → Kiểm tra lại EMAIL_USER và EMAIL_PASSWORD trong .env');
            console.log('   → Đảm bảo dùng App Password, không phải mật khẩu Gmail thường');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 Nguyên nhân: Không kết nối được SMTP server');
            console.log('   → Kiểm tra kết nối internet');
            console.log('   → Kiểm tra firewall/antivirus');
        }
    }
}

testEmail();
