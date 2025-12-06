/**
 * VNPay Configuration
 * Sandbox environment for testing
 */

module.exports = {
    // VNPay Sandbox credentials
    vnp_TmnCode: process.env.VNP_TMN_CODE || 'DEMO1234',  // Mã website của merchant trên hệ thống VNPay
    vnp_HashSecret: process.env.VNP_HASH_SECRET || 'DEMOSECRETKEY123456789',  // Chuỗi bí mật
    vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',  // URL thanh toán
    vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',  // URL callback sau thanh toán
    vnp_Api: process.env.VNP_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',

    // Currency
    vnp_CurrCode: 'VND',
    vnp_Locale: 'vn',
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_OrderType: 'healthcare'  // Loại đơn hàng - dịch vụ y tế
};
