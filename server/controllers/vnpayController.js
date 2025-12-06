/**
 * VNPay Payment Controller
 * Xử lý thanh toán qua VNPay
 */

const crypto = require('crypto');
const querystring = require('qs');
const moment = require('moment');
const vnpayConfig = require('../config/vnpay');
const { Invoice } = require('../models');

/**
 * Sắp xếp object theo key
 */
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

/**
 * Tạo URL thanh toán VNPay
 * POST /api/vnpay/create-payment
 */
exports.createPayment = async (req, res) => {
    try {
        const { invoice_id, amount, order_info, bank_code } = req.body;

        if (!invoice_id || !amount) {
            return res.status(400).json({ message: 'Thiếu thông tin thanh toán' });
        }

        // Kiểm tra invoice tồn tại
        const invoice = await Invoice.findByPk(invoice_id);
        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }

        if (invoice.payment_status === 'paid') {
            return res.status(400).json({ message: 'Hóa đơn đã được thanh toán' });
        }

        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress || '127.0.0.1';

        const tmnCode = vnpayConfig.vnp_TmnCode;
        const secretKey = vnpayConfig.vnp_HashSecret;
        const vnpUrl = vnpayConfig.vnp_Url;
        const returnUrl = vnpayConfig.vnp_ReturnUrl;

        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId = `INV${invoice_id}_${moment(date).format('HHmmss')}`;
        const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

        let vnp_Params = {
            'vnp_Version': vnpayConfig.vnp_Version,
            'vnp_Command': vnpayConfig.vnp_Command,
            'vnp_TmnCode': tmnCode,
            'vnp_Locale': vnpayConfig.vnp_Locale,
            'vnp_CurrCode': vnpayConfig.vnp_CurrCode,
            'vnp_TxnRef': orderId,
            'vnp_OrderInfo': order_info || `Thanh toan hoa don ${invoice.invoice_code}`,
            'vnp_OrderType': vnpayConfig.vnp_OrderType,
            'vnp_Amount': Math.round(amount * 100), // VNPay yêu cầu số tiền * 100
            'vnp_ReturnUrl': returnUrl,
            'vnp_IpAddr': ipAddr,
            'vnp_CreateDate': createDate,
            'vnp_ExpireDate': expireDate
        };

        // Thêm bank code nếu có
        if (bank_code) {
            vnp_Params['vnp_BankCode'] = bank_code;
        }

        vnp_Params = sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;

        const paymentUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });

        // Lưu transaction reference vào invoice
        await invoice.update({
            transaction_id: orderId,
            payment_method: 'vnpay'
        });

        console.log('✅ VNPay payment URL created:', orderId);

        res.json({
            success: true,
            paymentUrl: paymentUrl,
            orderId: orderId
        });

    } catch (error) {
        console.error('❌ VNPay create payment error:', error);
        res.status(500).json({ message: 'Lỗi tạo thanh toán VNPay', error: error.message });
    }
};

/**
 * Xử lý callback từ VNPay (Return URL)
 * GET /api/vnpay/return
 */
exports.vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey = vnpayConfig.vnp_HashSecret;
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        const responseCode = vnp_Params['vnp_ResponseCode'];
        const txnRef = vnp_Params['vnp_TxnRef'];
        const amount = Number(vnp_Params['vnp_Amount']) / 100;
        const transactionNo = vnp_Params['vnp_TransactionNo'];
        const bankCode = vnp_Params['vnp_BankCode'];

        // Tìm invoice từ transaction reference
        const invoice = await Invoice.findOne({
            where: { transaction_id: txnRef }
        });

        if (!invoice) {
            console.error('❌ Invoice not found for txnRef:', txnRef);
            return res.json({
                success: false,
                code: '01',
                message: 'Không tìm thấy hóa đơn'
            });
        }

        // Kiểm tra chữ ký
        if (secureHash === signed) {
            if (responseCode === '00') {
                // Thanh toán thành công
                await invoice.update({
                    payment_status: 'paid',
                    payment_method: 'vnpay',
                    transaction_id: transactionNo,
                    paid_at: new Date(),
                    notes: `Thanh toán VNPay thành công. Bank: ${bankCode}. Amount: ${amount.toLocaleString('vi-VN')}đ`
                });

                console.log('✅ VNPay payment successful:', transactionNo);

                res.json({
                    success: true,
                    code: responseCode,
                    message: 'Thanh toán thành công',
                    data: {
                        invoice_id: invoice.id,
                        invoice_code: invoice.invoice_code,
                        amount: amount,
                        transaction_no: transactionNo,
                        bank_code: bankCode
                    }
                });
            } else {
                // Thanh toán thất bại
                console.log('❌ VNPay payment failed:', responseCode);

                res.json({
                    success: false,
                    code: responseCode,
                    message: getVNPayErrorMessage(responseCode)
                });
            }
        } else {
            console.error('❌ Invalid signature');
            res.json({
                success: false,
                code: '97',
                message: 'Chữ ký không hợp lệ'
            });
        }

    } catch (error) {
        console.error('❌ VNPay return error:', error);
        res.status(500).json({ message: 'Lỗi xử lý kết quả thanh toán', error: error.message });
    }
};

/**
 * IPN (Instant Payment Notification) - VNPay gọi để xác nhận
 * GET /api/vnpay/ipn
 */
exports.vnpayIPN = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey = vnpayConfig.vnp_HashSecret;
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        const responseCode = vnp_Params['vnp_ResponseCode'];
        const txnRef = vnp_Params['vnp_TxnRef'];
        const rspAmount = Number(vnp_Params['vnp_Amount']) / 100;
        const transactionNo = vnp_Params['vnp_TransactionNo'];

        // Kiểm tra chữ ký
        if (secureHash !== signed) {
            return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        }

        // Tìm invoice
        const invoice = await Invoice.findOne({
            where: { transaction_id: txnRef }
        });

        if (!invoice) {
            return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        // Kiểm tra số tiền
        if (Math.round(Number(invoice.total_amount)) !== Math.round(rspAmount)) {
            return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        }

        // Kiểm tra trạng thái đã xử lý chưa
        if (invoice.payment_status === 'paid') {
            return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        // Cập nhật trạng thái
        if (responseCode === '00') {
            await invoice.update({
                payment_status: 'paid',
                payment_method: 'vnpay',
                transaction_id: transactionNo,
                paid_at: new Date()
            });
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        } else {
            return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
        }

    } catch (error) {
        console.error('❌ VNPay IPN error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

/**
 * Kiểm tra trạng thái giao dịch
 * GET /api/vnpay/query/:orderId
 */
exports.queryTransaction = async (req, res) => {
    try {
        const { orderId } = req.params;

        const invoice = await Invoice.findOne({
            where: { transaction_id: orderId }
        });

        if (!invoice) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        }

        res.json({
            success: true,
            invoice_id: invoice.id,
            invoice_code: invoice.invoice_code,
            payment_status: invoice.payment_status,
            payment_method: invoice.payment_method,
            amount: invoice.total_amount,
            transaction_id: invoice.transaction_id
        });

    } catch (error) {
        console.error('❌ Query transaction error:', error);
        res.status(500).json({ message: 'Lỗi truy vấn giao dịch' });
    }
};

/**
 * Lấy danh sách ngân hàng hỗ trợ
 * GET /api/vnpay/banks
 */
exports.getBankList = (req, res) => {
    const banks = [
        { code: 'VNPAYQR', name: 'Thanh toán QR Code', logo: '🔳' },
        { code: 'VNBANK', name: 'Thẻ ATM - Ngân hàng nội địa', logo: '🏦' },
        { code: 'INTCARD', name: 'Thẻ thanh toán quốc tế', logo: '💳' },
        { code: 'NCB', name: 'Ngân hàng NCB', logo: '🏦' },
        { code: 'SACOMBANK', name: 'Ngân hàng Sacombank', logo: '🏦' },
        { code: 'EXIMBANK', name: 'Ngân hàng Eximbank', logo: '🏦' },
        { code: 'MSBANK', name: 'Ngân hàng MSBANK', logo: '🏦' },
        { code: 'NAMABANK', name: 'Ngân hàng NamABank', logo: '🏦' },
        { code: 'VNMART', name: 'Ví điện tử VnMart', logo: '📱' },
        { code: 'VIETINBANK', name: 'Ngân hàng Vietinbank', logo: '🏦' },
        { code: 'VIETCOMBANK', name: 'Ngân hàng Vietcombank', logo: '🏦' },
        { code: 'HDBANK', name: 'Ngân hàng HDBank', logo: '🏦' },
        { code: 'DONGABANK', name: 'Ngân hàng Đông Á', logo: '🏦' },
        { code: 'TPBANK', name: 'Ngân hàng TPBank', logo: '🏦' },
        { code: 'OJB', name: 'Ngân hàng OceanBank', logo: '🏦' },
        { code: 'BIDV', name: 'Ngân hàng BIDV', logo: '🏦' },
        { code: 'TECHCOMBANK', name: 'Ngân hàng Techcombank', logo: '🏦' },
        { code: 'VPBANK', name: 'Ngân hàng VPBank', logo: '🏦' },
        { code: 'AGRIBANK', name: 'Ngân hàng Agribank', logo: '🏦' },
        { code: 'MBBANK', name: 'Ngân hàng MBBank', logo: '🏦' },
        { code: 'ACB', name: 'Ngân hàng ACB', logo: '🏦' },
        { code: 'OCB', name: 'Ngân hàng OCB', logo: '🏦' },
        { code: 'SHB', name: 'Ngân hàng SHB', logo: '🏦' },
        { code: 'IVB', name: 'Ngân hàng IVB', logo: '🏦' }
    ];

    res.json(banks);
};

/**
 * Helper: Lấy message lỗi VNPay
 */
function getVNPayErrorMessage(code) {
    const messages = {
        '00': 'Giao dịch thành công',
        '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
        '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
        '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
        '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
        '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
        '13': 'Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
        '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch.',
        '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
        '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
        '75': 'Ngân hàng thanh toán đang bảo trì.',
        '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch.',
        '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê).'
    };
    return messages[code] || 'Lỗi không xác định';
}
