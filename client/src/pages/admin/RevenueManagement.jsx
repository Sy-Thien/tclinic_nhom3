import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './RevenueManagement.module.css';

export default function RevenueManagement() {
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [stats, setStats] = useState(null);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [showInvoiceList, setShowInvoiceList] = useState(false);

    useEffect(() => {
        fetchRevenueStats();
        fetchDashboardStats();
    }, [period, year, month]);

    const fetchDashboardStats = async () => {
        try {
            // Fetch today's revenue
            const todayResponse = await api.get('/api/invoices/stats/revenue', {
                params: { period: 'today' }
            });

            // Fetch month's revenue
            const monthResponse = await api.get('/api/invoices/stats/revenue', {
                params: { period: 'month' }
            });

            setDashboardStats({
                todayRevenue: todayResponse.data.totalRevenue || 0,
                monthRevenue: monthResponse.data.totalRevenue || 0,
                pendingCount: monthResponse.data.statusCounts?.find(s => s.payment_status === 'pending')?.count || 0,
                paidTodayCount: todayResponse.data.statusCounts?.find(s => s.payment_status === 'paid')?.count || 0
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    const fetchRevenueStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/invoices/stats/revenue', {
                params: { period }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching revenue stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await api.get('/api/invoices', {
                params: { limit: 50 }
            });
            setInvoices(response.data.invoices || []);
            setShowInvoiceList(true);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('vi-VN');
    };

    const getMaxValue = (data) => {
        if (!data || data.length === 0) return 0;
        return Math.max(...data.map(d => Number(d.total) || 0));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>📊 Quản Lý Doanh Thu</h1>
                <p>Thống kê doanh thu phòng khám</p>
            </div>

            {/* Dashboard Cards */}
            <div className={styles.dashboardCards}>
                <div className={`${styles.card} ${styles.cardToday}`}>
                    <div className={styles.cardIcon}>💰</div>
                    <div className={styles.cardContent}>
                        <span className={styles.cardLabel}>Doanh thu hôm nay</span>
                        <span className={styles.cardValue}>{formatCurrency(dashboardStats?.todayRevenue)}</span>
                    </div>
                </div>
                <div className={`${styles.card} ${styles.cardMonth}`}>
                    <div className={styles.cardIcon}>📈</div>
                    <div className={styles.cardContent}>
                        <span className={styles.cardLabel}>Doanh thu tháng này</span>
                        <span className={styles.cardValue}>{formatCurrency(dashboardStats?.monthRevenue)}</span>
                    </div>
                </div>
                <div className={`${styles.card} ${styles.cardPending}`}>
                    <div className={styles.cardIcon}>⏳</div>
                    <div className={styles.cardContent}>
                        <span className={styles.cardLabel}>Chờ thanh toán</span>
                        <span className={styles.cardValue}>{dashboardStats?.pendingCount || 0} hóa đơn</span>
                    </div>
                </div>
                <div className={`${styles.card} ${styles.cardPaid}`}>
                    <div className={styles.cardIcon}>✅</div>
                    <div className={styles.cardContent}>
                        <span className={styles.cardLabel}>Đã thanh toán hôm nay</span>
                        <span className={styles.cardValue}>{dashboardStats?.paidTodayCount || 0} hóa đơn</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Khoảng thời gian:</label>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <option value="today">Hôm nay</option>
                        <option value="month">Theo tháng</option>
                        <option value="year">Theo năm</option>
                    </select>
                </div>

                {period !== 'today' && (
                    <div className={styles.filterGroup}>
                        <label>Năm:</label>
                        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                )}

                {period === 'month' && (
                    <div className={styles.filterGroup}>
                        <label>Tháng:</label>
                        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                <option key={m} value={m}>Tháng {m}</option>
                            ))}
                        </select>
                    </div>
                )}

                <button className={styles.viewListBtn} onClick={fetchInvoices}>
                    📋 Xem danh sách hóa đơn
                </button>
            </div>

            {/* Summary */}
            {stats && (
                <div className={styles.summary}>
                    <h3>📌 Tổng kết {period === 'month' ? 'tháng này' : period === 'year' ? 'năm nay' : period === 'week' ? 'tuần này' : 'hôm nay'}</h3>
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Tổng doanh thu</span>
                            <span className={`${styles.summaryValue} ${styles.total}`}>
                                {formatCurrency(stats.totalRevenue)}
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Chờ thanh toán</span>
                            <span className={styles.summaryValue}>
                                {formatCurrency(stats.pendingAmount)}
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Số HĐ đã thanh toán</span>
                            <span className={styles.summaryValue}>
                                {stats.statusCounts?.find(s => s.payment_status === 'paid')?.count || 0}
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Số HĐ chờ xử lý</span>
                            <span className={styles.summaryValue}>
                                {stats.statusCounts?.find(s => s.payment_status === 'pending')?.count || 0}
                            </span>
                        </div>
                    </div>

                    {/* Payment Method Breakdown */}
                    {stats.byPaymentMethod?.length > 0 && (
                        <div className={styles.paymentMethodSection}>
                            <h4>💳 Doanh thu theo phương thức thanh toán</h4>
                            <div className={styles.paymentMethodGrid}>
                                {stats.byPaymentMethod.map((method, idx) => (
                                    <div key={idx} className={`${styles.methodCard} ${styles[method.payment_method]}`}>
                                        <div className={styles.methodIcon}>
                                            {method.payment_method === 'cash' ? '💵' :
                                                method.payment_method === 'vnpay' ? '📱' :
                                                    method.payment_method === 'transfer' ? '🏦' : '💳'}
                                        </div>
                                        <div className={styles.methodInfo}>
                                            <span className={styles.methodName}>
                                                {method.payment_method === 'cash' ? 'Tiền mặt' :
                                                    method.payment_method === 'vnpay' ? 'VNPay' :
                                                        method.payment_method === 'transfer' ? 'Chuyển khoản' : 'Thẻ'}
                                            </span>
                                            <span className={styles.methodCount}>{method.count} giao dịch</span>
                                            <span className={styles.methodTotal}>{formatCurrency(method.total)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Chart */}
            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className={styles.chartSection}>
                    <h3>📊 Doanh thu 7 ngày gần nhất</h3>

                    {stats?.dailyRevenue?.length > 0 ? (
                        <div className={styles.chart}>
                            <div className={styles.chartBars}>
                                {stats.dailyRevenue.map((item, index) => {
                                    const maxVal = getMaxValue(stats.dailyRevenue);
                                    const height = maxVal > 0 ? (Number(item.total) / maxVal * 100) : 0;
                                    return (
                                        <div key={index} className={styles.barContainer}>
                                            <div
                                                className={styles.bar}
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                                title={formatCurrency(item.total)}
                                            >
                                                <span className={styles.barValue}>
                                                    {Number(item.total) > 0 ? formatCurrency(item.total) : ''}
                                                </span>
                                            </div>
                                            <span className={styles.barLabel}>
                                                {item.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.noData}>
                            <p>📭 Chưa có dữ liệu doanh thu</p>
                        </div>
                    )}
                </div>
            )}

            {/* Invoice List Modal */}
            {showInvoiceList && (
                <div className={styles.modalOverlay} onClick={() => setShowInvoiceList(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>📋 Danh sách hóa đơn</h2>
                            <button onClick={() => setShowInvoiceList(false)}>✕</button>
                        </div>
                        <div className={styles.modalContent}>
                            <table className={styles.invoiceTable}>
                                <thead>
                                    <tr>
                                        <th>Mã HĐ</th>
                                        <th>Bệnh nhân</th>
                                        <th>Phí khám</th>
                                        <th>Tiền thuốc</th>
                                        <th>Tổng</th>
                                        <th>Phương thức</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td className={styles.invoiceCode}>{inv.invoice_code}</td>
                                            <td>{inv.patient_name}</td>
                                            <td>{formatCurrency(inv.service_fee)}</td>
                                            <td>{formatCurrency(inv.drug_fee)}</td>
                                            <td className={styles.totalCell}>{formatCurrency(inv.total_amount)}</td>
                                            <td>
                                                <span className={`${styles.paymentMethod} ${styles[inv.payment_method]}`}>
                                                    {inv.payment_method === 'cash' ? '💵 Tiền mặt' :
                                                        inv.payment_method === 'vnpay' ? '📱 VNPay' :
                                                            inv.payment_method === 'transfer' ? '🏦 CK' : '💳 Thẻ'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.status} ${styles[inv.payment_status]}`}>
                                                    {inv.payment_status === 'paid' ? '✅ Đã TT' :
                                                        inv.payment_status === 'pending' ? '⏳ Chờ' : inv.payment_status}
                                                </span>
                                            </td>
                                            <td>{formatDate(inv.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {invoices.length === 0 && (
                                <p className={styles.noInvoices}>Chưa có hóa đơn nào</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
