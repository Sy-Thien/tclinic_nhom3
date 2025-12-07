/**
 * VNPay Configuration
 * Sandbox environment for testing
 * 
 * HƯỚNG DẪN:
 * 1. Đăng ký tài khoản sandbox tại: https://sandbox.vnpayment.vn/apis/
 * 2. Lấy vnp_TmnCode và vnp_HashSecret từ email VNPay gửi
 * 3. Cập nhật vào file này hoặc đặt trong .env
 * 
 * Test cards: https://sandbox.vnpayment.vn/apis/vnpay-demo/
 * - Ngân hàng: NCB
 * - Số thẻ: 9704198526191432198
 * - Tên chủ thẻ: NGUYEN VAN A
 * - Ngày phát hành: 07/15
 * - Mật khẩu OTP: 123456
 */

module.exports = {
    // VNPay Sandbox credentials - CẦN ĐĂNG KÝ TẠI https://sandbox.vnpayment.vn/apis/
    vnp_TmnCode: process.env.VNP_TMN_CODE || 'GHK6I19Z',  // Thay bằng mã của bạn
    vnp_HashSecret: process.env.VNP_HASH_SECRET || '5TIIGWN43N9OFD7HPYXW5PKMQP0Q1SVY',  // Thay bằng secret của bạn
    vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',
    vnp_Api: process.env.VNP_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',

    // Currency
    vnp_CurrCode: 'VND',
    vnp_Locale: 'vn',
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_OrderType: 'other'
};
