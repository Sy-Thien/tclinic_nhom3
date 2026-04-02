import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './VNPayReturn.module.css';

class VNPayReturn extends Component {
    constructor(props) {
        super(props);
        this.state = {
            result: null,
            loading: true
        };
    }

    componentDidMount() {
        this.verifyPayment();
    }

    verifyPayment = async () => {
        try {
            const params = Object.fromEntries(this.props.searchParams.entries());
            const response = await api.get('/api/patient/vnpay/return', { params });
            this.setState({ result: response.data });
        } catch (error) {
            console.error('Error verifying payment:', error);
            this.setState({
                result: {
                    success: false,
                    message: 'Không thể xác minh thanh toán'
                }
            });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleGoBack = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'doctor') {
            this.props.navigate('/doctor-portal/schedule');
        } else if (user.role === 'admin') {
            this.props.navigate('/admin/bookings');
        } else {
            this.props.navigate('/my-appointments');
        }
    };

    render() {
        const { result, loading } = this.state;

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

        const invoice = result?.data?.invoice;

        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    {result?.success ? (
                        <div className={styles.success}>
                            <div className={styles.icon}>✅</div>
                            <h1>Thanh toán thành công!</h1>

                            <div className={styles.invoiceSection}>
                                <h2>📋 Hóa đơn</h2>
                                <div className={styles.invoiceHeader}>
                                    <div className={styles.row}>
                                        <span>Mã hóa đơn:</span>
                                        <strong>{result.data?.invoice_code}</strong>
                                    </div>
                                    <div className={styles.row}>
                                        <span>Bệnh nhân:</span>
                                        <strong>{invoice?.patient_name}</strong>
                                    </div>
                                    {invoice?.patient_phone && (
                                        <div className={styles.row}>
                                            <span>Điện thoại:</span>
                                            <strong>{invoice.patient_phone}</strong>
                                        </div>
                                    )}
                                    <div className={styles.row}>
                                        <span>Bác sĩ:</span>
                                        <strong>{invoice?.doctor_name}</strong>
                                    </div>
                                </div>

                                {invoice?.items && invoice.items.length > 0 && (
                                    <div className={styles.itemsSection}>
                                        <h3>Chi tiết dịch vụ và thuốc</h3>
                                        <div className={styles.itemsList}>
                                            {invoice.items.map((item, idx) => (
                                                <div key={idx} className={styles.itemRow}>
                                                    <span className={styles.itemIcon}>
                                                        {item.item_type === 'service' ? '🏥' : '💊'}
                                                    </span>
                                                    <div className={styles.itemInfo}>
                                                        <div className={styles.itemName}>{item.item_name}</div>
                                                        {item.note && (
                                                            <div className={styles.itemNote}>{item.note}</div>
                                                        )}
                                                    </div>
                                                    <div className={styles.itemQty}>
                                                        {item.quantity} {item.unit}
                                                    </div>
                                                    <div className={styles.itemPrice}>
                                                        {Number(item.total_price).toLocaleString('vi-VN')}đ
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className={styles.feeBreakdown}>
                                    <div className={styles.feeRow}>
                                        <span>Phí khám:</span>
                                        <span>{Number(invoice?.service_fee || 0).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className={styles.feeRow}>
                                        <span>Tiền thuốc:</span>
                                        <span>{Number(invoice?.drug_fee || 0).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    {invoice?.discount > 0 && (
                                        <div className={`${styles.feeRow} ${styles.discount}`}>
                                            <span>Giảm giá:</span>
                                            <span>-{Number(invoice.discount).toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    <div className={`${styles.feeRow} ${styles.total}`}>
                                        <span>Tổng cộng:</span>
                                        <strong>{Number(invoice?.total_amount || result.data?.amount).toLocaleString('vi-VN')}đ</strong>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.paymentInfo}>
                                <h3>💳 Thông tin thanh toán</h3>
                                <div className={styles.row}>
                                    <span>Mã giao dịch:</span>
                                    <strong>{result.data?.transaction_no}</strong>
                                </div>
                                <div className={styles.row}>
                                    <span>Ngân hàng:</span>
                                    <strong>{result.data?.bank_code}</strong>
                                </div>
                                <div className={styles.row}>
                                    <span>Phương thức:</span>
                                    <strong>VNPay</strong>
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
                        <button className={styles.primaryBtn} onClick={this.handleGoBack}>
                            ← Quay lại
                        </button>
                        {result?.success && invoice && (
                            <button
                                className={styles.printBtn}
                                onClick={() => window.print()}
                            >
                                🖨️ In hóa đơn
                            </button>
                        )}
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
}

export default withRouter(VNPayReturn);
