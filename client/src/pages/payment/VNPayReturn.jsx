import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './VNPayReturn.module.css';

export default function VNPayReturn() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        verifyPayment();
    }, []);

    const verifyPayment = async () => {
        try {
            // Lấy tất cả params từ URL và gọi API verify
            const params = Object.fromEntries(searchParams.entries());
            const response = await api.get('/api/vnpay/return', { params });
            setResult(response.data);
        } catch (error) {
            console.error('Error verifying payment:', error);
            setResult({
                success: false,
                message: 'Không thể xác minh thanh toán'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'doctor') {
            navigate('/doctor-portal/schedule');
        } else if (user.role === 'admin') {
            navigate('/admin/bookings');
        } else {
            navigate('/my-appointments');
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang xác minh thanh toán...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {result?.success ? (
                    <div className={styles.success}>
                        <div className={styles.icon}>✅</div>
                        <h1>Thanh toán thành công!</h1>
                        <div className={styles.details}>
                            <div className={styles.row}>
                                <span>Mã hóa đơn:</span>
                                <strong>{result.data?.invoice_code}</strong>
                            </div>
                            <div className={styles.row}>
                                <span>Số tiền:</span>
                                <strong>{Number(result.data?.amount).toLocaleString('vi-VN')}đ</strong>
                            </div>
                            <div className={styles.row}>
                                <span>Mã giao dịch:</span>
                                <strong>{result.data?.transaction_no}</strong>
                            </div>
                            <div className={styles.row}>
                                <span>Ngân hàng:</span>
                                <strong>{result.data?.bank_code}</strong>
                            </div>
                        </div>
                        <p className={styles.message}>{result.message}</p>
                    </div>
                ) : (
                    <div className={styles.error}>
                        <div className={styles.icon}>❌</div>
                        <h1>Thanh toán thất bại</h1>
                        <p className={styles.message}>{result?.message}</p>
                        {result?.code && (
                            <p className={styles.code}>Mã lỗi: {result.code}</p>
                        )}
                    </div>
                )}

                <div className={styles.actions}>
                    <button className={styles.primaryBtn} onClick={handleGoBack}>
                        ← Quay lại
                    </button>
                    {!result?.success && (
                        <button
                            className={styles.secondaryBtn}
                            onClick={() => window.history.back()}
                        >
                            Thử lại
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
