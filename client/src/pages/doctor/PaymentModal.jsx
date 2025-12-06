import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './PaymentModal.module.css';

export default function PaymentModal({
    isOpen,
    onClose,
    bookingId,
    prescriptionId,
    onPaymentComplete
}) {
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    // Preview data trước khi tạo hóa đơn
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        if (isOpen && bookingId) {
            checkExistingInvoice();
        }
    }, [isOpen, bookingId]);

    const checkExistingInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/invoices/booking/${bookingId}`);
            setInvoice(response.data);
        } catch (err) {
            if (err.response?.status === 404) {
                // No invoice exists, load preview data
                setInvoice(null);
                loadPreviewData();
            } else {
                setError('Lỗi kiểm tra hóa đơn');
            }
        } finally {
            setLoading(false);
        }
    };

    // Load preview data (booking + prescription) trước khi tạo hóa đơn
    const loadPreviewData = async () => {
        try {
            setLoadingPreview(true);
            const response = await api.get(`/api/invoices/preview/${bookingId}`, {
                params: { prescription_id: prescriptionId }
            });
            setPreviewData(response.data);
        } catch (err) {
            console.error('Error loading preview:', err);
            // Fallback - create empty preview
            setPreviewData({ service_fee: 0, drug_fee: 0, items: [] });
        } finally {
            setLoadingPreview(false);
        }
    };

    // Tạo hóa đơn VÀ thanh toán luôn trong 1 bước
    const handlePayment = async () => {
        try {
            setProcessing(true);
            setError('');

            // Nếu chưa có hóa đơn, tạo mới
            let currentInvoice = invoice;
            if (!currentInvoice) {
                const response = await api.post('/api/invoices', {
                    booking_id: bookingId,
                    prescription_id: prescriptionId,
                    payment_method: paymentMethod,
                    discount: discount
                });
                currentInvoice = response.data.invoice;
                setInvoice(currentInvoice);
                console.log('✅ Invoice created:', currentInvoice.invoice_code);
            }

            // Xử lý thanh toán theo phương thức
            if (paymentMethod === 'vnpay') {
                // Gọi VNPay API để lấy URL thanh toán
                const vnpayResponse = await api.post('/api/vnpay/create-payment', {
                    invoice_id: currentInvoice.id,
                    amount: Number(currentInvoice.total_amount),
                    order_info: `Thanh toan hoa don ${currentInvoice.invoice_code}`
                });

                if (vnpayResponse.data.success && vnpayResponse.data.paymentUrl) {
                    // Chuyển hướng đến trang thanh toán VNPay
                    window.location.href = vnpayResponse.data.paymentUrl;
                } else {
                    throw new Error('Không thể tạo link thanh toán VNPay');
                }
            } else {
                // Cash/Transfer/Card payment - mark as paid immediately
                await api.put(`/api/invoices/${currentInvoice.id}/payment`, {
                    payment_status: 'paid',
                    payment_method: paymentMethod,
                    transaction_id: paymentMethod === 'transfer' ? `TF${Date.now()}` : null
                });
                setInvoice(prev => ({ ...prev, payment_status: 'paid' }));
                onPaymentComplete?.();
            }

        } catch (err) {
            console.error('❌ Payment error:', err);
            setError(err.response?.data?.message || 'Lỗi thanh toán');
        } finally {
            setProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>💳 Thanh Toán</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Đang tải...</div>
                ) : error ? (
                    <div className={styles.error}>
                        {error}
                        <button
                            className={styles.retryBtn}
                            onClick={() => setError('')}
                        >
                            Thử lại
                        </button>
                    </div>
                ) : processing ? (
                    <div className={styles.processing}>
                        <div className={styles.spinner}></div>
                        <p>Đang xử lý thanh toán...</p>
                        {paymentMethod === 'vnpay' && (
                            <p className={styles.vnpayNote}>Đang chuyển đến cổng thanh toán VNPay...</p>
                        )}
                    </div>
                ) : (
                    <div className={styles.content}>
                        {/* Đã thanh toán - hiện thông tin hóa đơn */}
                        {invoice?.payment_status === 'paid' ? (
                            <div className={styles.invoiceInfo}>
                                <div className={styles.invoiceHeader}>
                                    <span className={styles.invoiceCode}>{invoice.invoice_code}</span>
                                    <span className={`${styles.status} ${styles.paid}`}>
                                        ✅ Đã thanh toán
                                    </span>
                                </div>

                                <div className={styles.feeBreakdown}>
                                    <div className={styles.feeRow}>
                                        <span>Phí khám:</span>
                                        <span>{Number(invoice.service_fee).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className={styles.feeRow}>
                                        <span>Tiền thuốc:</span>
                                        <span>{Number(invoice.drug_fee).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    {invoice.discount > 0 && (
                                        <div className={`${styles.feeRow} ${styles.discount}`}>
                                            <span>Giảm giá:</span>
                                            <span>-{Number(invoice.discount).toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    <div className={`${styles.feeRow} ${styles.total}`}>
                                        <span>Tổng cộng:</span>
                                        <span>{Number(invoice.total_amount).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>

                                {/* Items detail */}
                                {invoice.items?.length > 0 && (
                                    <div className={styles.itemsSection}>
                                        <h4>Chi tiết:</h4>
                                        <div className={styles.itemsList}>
                                            {invoice.items.map((item, idx) => (
                                                <div key={idx} className={styles.itemRow}>
                                                    <span className={styles.itemName}>
                                                        {item.item_type === 'service' ? '🏥' : '💊'} {item.item_name}
                                                    </span>
                                                    <span className={styles.itemQty}>
                                                        {item.quantity} {item.unit}
                                                    </span>
                                                    <span className={styles.itemPrice}>
                                                        {Number(item.total_price).toLocaleString('vi-VN')}đ
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Chưa thanh toán - hiện preview */
                            <div className={styles.createInvoice}>
                                <h4>📋 Chi phí khám bệnh</h4>

                                {loadingPreview ? (
                                    <div className={styles.loadingPreview}>Đang tải thông tin...</div>
                                ) : previewData ? (
                                    <div className={styles.previewSection}>
                                        {/* Service fee */}
                                        <div className={styles.feeRow}>
                                            <span>🏥 Phí dịch vụ khám:</span>
                                            <span className={styles.serviceFee}>
                                                {Number(previewData.service_fee || 0).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>

                                        {/* Service name if available */}
                                        {previewData.service_name && (
                                            <div className={styles.serviceNote}>
                                                ({previewData.service_name})
                                            </div>
                                        )}

                                        {/* Drug fee */}
                                        <div className={styles.feeRow}>
                                            <span>💊 Tiền thuốc:</span>
                                            <span className={styles.drugFee}>
                                                {Number(previewData.drug_fee || 0).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>

                                        {/* Drug items list */}
                                        {previewData.items?.filter(i => i.item_type === 'drug').length > 0 && (
                                            <div className={styles.drugItems}>
                                                {previewData.items.filter(i => i.item_type === 'drug').map((item, idx) => (
                                                    <div key={idx} className={styles.drugItem}>
                                                        <span>{item.item_name}</span>
                                                        <span>{item.quantity} {item.unit} × {Number(item.unit_price).toLocaleString('vi-VN')}đ</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Discount input */}
                                        <div className={styles.discountGroup}>
                                            <label>🏷️ Giảm giá (VNĐ):</label>
                                            <input
                                                type="number"
                                                value={discount}
                                                onChange={(e) => setDiscount(Number(e.target.value))}
                                                min="0"
                                            />
                                        </div>

                                        {/* Total preview */}
                                        <div className={`${styles.feeRow} ${styles.totalPreview}`}>
                                            <span>💰 Tổng cộng:</span>
                                            <span className={styles.totalAmount}>
                                                {(Number(previewData.service_fee || 0) + Number(previewData.drug_fee || 0) - Number(discount || 0)).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.noPreview}>
                                        <p>Không có thông tin chi phí</p>
                                        <div className={styles.discountGroup}>
                                            <label>Giảm giá (VNĐ):</label>
                                            <input
                                                type="number"
                                                value={discount}
                                                onChange={(e) => setDiscount(Number(e.target.value))}
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment Method - chỉ hiện khi chưa thanh toán */}
                        {invoice?.payment_status !== 'paid' && (
                            <div className={styles.paymentMethod}>
                                <h4>Phương thức thanh toán:</h4>
                                <div className={styles.methodOptions}>
                                    <label className={paymentMethod === 'cash' ? styles.active : ''}>
                                        <input
                                            type="radio"
                                            name="method"
                                            value="cash"
                                            checked={paymentMethod === 'cash'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        💵 Tiền mặt
                                    </label>
                                    <label className={paymentMethod === 'vnpay' ? styles.active : ''}>
                                        <input
                                            type="radio"
                                            name="method"
                                            value="vnpay"
                                            checked={paymentMethod === 'vnpay'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        📱 VNPay
                                    </label>
                                    <label className={paymentMethod === 'transfer' ? styles.active : ''}>
                                        <input
                                            type="radio"
                                            name="method"
                                            value="transfer"
                                            checked={paymentMethod === 'transfer'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        🏦 Chuyển khoản
                                    </label>
                                    <label className={paymentMethod === 'card' ? styles.active : ''}>
                                        <input
                                            type="radio"
                                            name="method"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        💳 Thẻ
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className={styles.actions}>
                            {invoice?.payment_status === 'paid' ? (
                                <button className={styles.printBtn} onClick={() => window.print()}>
                                    🖨️ In hóa đơn
                                </button>
                            ) : (
                                <button
                                    className={styles.payBtn}
                                    onClick={handlePayment}
                                    disabled={processing}
                                >
                                    {processing ? 'Đang xử lý...' : '✅ Xác nhận thanh toán'}
                                </button>
                            )}
                            <button className={styles.cancelBtn} onClick={onClose}>
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
