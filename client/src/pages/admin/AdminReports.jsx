import React, { Component } from 'react';
import api from '../../utils/api';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import styles from './AdminReports.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

class AdminReports extends Component {
    constructor(props) {
        super(props);
        const d = new Date();
        d.setDate(d.getDate() - 30);
        this.state = {
            visitStats: [],
            topDoctors: [],
            popularSpecialties: [],
            revenueStats: { data: [], summary: { totalRevenue: 0, totalCount: 0, avgRevenue: 0 } },
            summaryStats: {
                totalBookings: 0,
                completedBookings: 0,
                cancelledBookings: 0,
                pendingBookings: 0,
                totalRevenue: 0,
                avgPerDay: 0,
                avgRevenuePerDay: 0
            },
            type: 'day',
            revenueType: 'day',
            from: d.toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0],
            loading: true
        };
    }

    componentDidMount() {
        this.fetchStats();
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevState.type !== this.state.type ||
            prevState.revenueType !== this.state.revenueType ||
            prevState.from !== this.state.from ||
            prevState.to !== this.state.to
        ) {
            this.fetchStats();
        }
    }

    fetchStats = async () => {
        const { type, revenueType, from, to } = this.state;
        try {
            this.setState({ loading: true });
            const params = new URLSearchParams();
            params.append('type', type);
            if (from) params.append('from', from);
            if (to) params.append('to', to);

            const revenueParams = new URLSearchParams();
            revenueParams.append('type', revenueType);
            if (from) revenueParams.append('from', from);
            if (to) revenueParams.append('to', to);

            const [visitsRes, doctorsRes, specialtiesRes, summaryRes, revenueRes] = await Promise.all([
                api.get(`/api/admin/reports/visits?${params}`),
                api.get(`/api/admin/reports/top-doctors?${params}`),
                api.get(`/api/admin/reports/popular-specialties?${params}`),
                api.get(`/api/admin/reports/summary?${params}`),
                api.get(`/api/admin/reports/revenue?${revenueParams}`)
            ]);

            this.setState({
                visitStats: visitsRes.data || [],
                topDoctors: doctorsRes.data || [],
                popularSpecialties: specialtiesRes.data || [],
                summaryStats: summaryRes.data || {
                    totalBookings: 0, completedBookings: 0, cancelledBookings: 0,
                    pendingBookings: 0, totalRevenue: 0, avgPerDay: 0, avgRevenuePerDay: 0
                },
                revenueStats: revenueRes.data || { data: [], summary: { totalRevenue: 0, totalCount: 0, avgRevenue: 0 } }
            });
        } catch (error) {
            console.error('Error fetching report data:', error);
            this.setState({
                visitStats: [],
                topDoctors: [],
                popularSpecialties: [],
                summaryStats: {
                    totalBookings: 0, completedBookings: 0, cancelledBookings: 0,
                    pendingBookings: 0, totalRevenue: 0, avgPerDay: 0, avgRevenuePerDay: 0
                },
                revenueStats: { data: [], summary: { totalRevenue: 0, totalCount: 0, avgRevenue: 0 } }
            });
        } finally {
            this.setState({ loading: false });
        }
    };

    handleExport = async (format) => {
        try {
            const { type, from, to } = this.state;
            const params = new URLSearchParams();
            params.append('type', type);
            if (from) params.append('from', from);
            if (to) params.append('to', to);
            const url = `http://localhost:5000/api/admin/reports/export-${format}?${params}`;
            window.open(url, '_blank');
        } catch (error) {
            alert('Lỗi khi xuất báo cáo');
        }
    };

    formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    getTypeLabel = () => {
        switch (this.state.type) {
            case 'day': return 'Ngày';
            case 'week': return 'Tuần';
            case 'month': return 'Tháng';
            default: return 'Ngày';
        }
    };

    render() {
        const {
            visitStats, topDoctors, popularSpecialties, revenueStats,
            summaryStats, type, revenueType, from, to, loading
        } = this.state;

        // Chart data
        const visitChartData = {
            labels: visitStats.map(row => {
                if (type === 'day') {
                    const date = new Date(row.period);
                    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                }
                return row.period;
            }),
            datasets: [{
                label: 'Số lượt khám',
                data: visitStats.map(row => row.count),
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        };

        const doctorChartData = {
            labels: topDoctors.map(row => row.doctor?.full_name || 'Không rõ'),
            datasets: [{
                label: 'Số lượt khám',
                data: topDoctors.map(row => row.count),
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
                borderRadius: 8,
                borderSkipped: false
            }]
        };

        const specialtyChartData = {
            labels: popularSpecialties.map(row => row.specialty?.name || 'Không rõ'),
            datasets: [{
                label: 'Lượt khám',
                data: popularSpecialties.map(row => row.count),
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a21caf', '#eab308'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        };

        const statusChartData = {
            labels: ['Hoàn thành', 'Đang chờ', 'Đã hủy'],
            datasets: [{
                data: [summaryStats.completedBookings, summaryStats.pendingBookings, summaryStats.cancelledBookings],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        };

        const revenueChartData = {
            labels: revenueStats.data.map(row => row.label),
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: revenueStats.data.map(row => row.revenue),
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: '#10b981',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        };

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1>Báo cáo & Thống kê</h1>
                        <p>Thống kê lượt khám, bác sĩ, chuyên khoa và xuất báo cáo</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
                        <div className={styles.summaryIcon}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div className={styles.summaryContent}>
                            <div className={styles.summaryValue}>{summaryStats.totalBookings}</div>
                            <div className={styles.summaryLabel}>Tổng lịch khám</div>
                        </div>
                    </div>

                    <div className={styles.summaryCard} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                        <div className={styles.summaryIcon}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className={styles.summaryContent}>
                            <div className={styles.summaryValue}>{summaryStats.completedBookings}</div>
                            <div className={styles.summaryLabel}>Đã hoàn thành</div>
                        </div>
                    </div>

                    <div className={styles.summaryCard} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                        <div className={styles.summaryIcon}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className={styles.summaryContent}>
                            <div className={styles.summaryValue}>{this.formatCurrency(summaryStats.totalRevenue)}</div>
                            <div className={styles.summaryLabel}>Tổng doanh thu</div>
                        </div>
                    </div>

                    <div className={styles.summaryCard} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                        <div className={styles.summaryIcon}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className={styles.summaryContent}>
                            <div className={styles.summaryValue}>{this.formatCurrency(summaryStats.avgRevenuePerDay)}</div>
                            <div className={styles.summaryLabel}>TB Doanh thu/Ngày</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <label>Thống kê theo:</label>
                        <select value={type} onChange={e => this.setState({ type: e.target.value })}>
                            <option value="day">Theo ngày</option>
                            <option value="week">Theo tuần</option>
                            <option value="month">Theo tháng</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Từ ngày:</label>
                        <input type="date" value={from} onChange={e => this.setState({ from: e.target.value })} />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Đến ngày:</label>
                        <input type="date" value={to} onChange={e => this.setState({ to: e.target.value })} />
                    </div>

                    <div className={styles.exportButtons}>
                        <button onClick={() => this.handleExport('excel')} className={styles.btnExcel}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Xuất Excel
                        </button>
                        <button onClick={() => this.handleExport('pdf')} className={styles.btnPdf}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Xuất PDF
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải dữ liệu báo cáo...</p>
                    </div>
                ) : (
                    <>
                        {/* Revenue Chart Section */}
                        <div className={styles.revenueSection}>
                            <div className={styles.revenueSectionHeader}>
                                <h2>📊 Thống kê Doanh thu</h2>
                                <div className={styles.revenueTypeSelector}>
                                    <button
                                        className={`${styles.revenueTypeBtn} ${revenueType === 'day' ? styles.active : ''}`}
                                        onClick={() => this.setState({ revenueType: 'day' })}
                                    >
                                        Theo ngày
                                    </button>
                                    <button
                                        className={`${styles.revenueTypeBtn} ${revenueType === 'month' ? styles.active : ''}`}
                                        onClick={() => this.setState({ revenueType: 'month' })}
                                    >
                                        Theo tháng
                                    </button>
                                </div>
                            </div>

                            <div className={styles.revenueSummaryRow}>
                                <div className={styles.revenueStat}>
                                    <span className={styles.revenueStatLabel}>Tổng doanh thu:</span>
                                    <span className={styles.revenueStatValue}>{this.formatCurrency(revenueStats.summary?.totalRevenue || 0)}</span>
                                </div>
                                <div className={styles.revenueStat}>
                                    <span className={styles.revenueStatLabel}>Số lượt khám hoàn thành:</span>
                                    <span className={styles.revenueStatValue}>{revenueStats.summary?.totalCount || 0}</span>
                                </div>
                                <div className={styles.revenueStat}>
                                    <span className={styles.revenueStatLabel}>TB/{revenueType === 'day' ? 'Ngày' : 'Tháng'}:</span>
                                    <span className={styles.revenueStatValue}>{this.formatCurrency(revenueStats.summary?.avgRevenue || 0)}</span>
                                </div>
                            </div>

                            <div className={styles.chartWrapperRevenue}>
                                <Bar
                                    data={revenueChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: { display: false },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => {
                                                        return this.formatCurrency(context.raw);
                                                    }
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: function (value) {
                                                        if (value >= 1000000) return (value / 1000000) + 'M';
                                                        if (value >= 1000) return (value / 1000) + 'K';
                                                        return value;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Revenue detail table */}
                            <div className={styles.revenueTable}>
                                <h3>Chi tiết doanh thu theo {revenueType === 'day' ? 'ngày' : 'tháng'}</h3>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Thời gian</th>
                                            <th>Số lượt khám</th>
                                            <th>Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {revenueStats.data.slice(0, 15).map((row, index) => (
                                            <tr key={index}>
                                                <td>{row.label}</td>
                                                <td><strong>{row.count}</strong></td>
                                                <td className={styles.revenueCell}>{this.formatCurrency(row.revenue)}</td>
                                            </tr>
                                        ))}
                                        {revenueStats.data.length === 0 && (
                                            <tr>
                                                <td colSpan={3} style={{ textAlign: 'center', color: '#666' }}>
                                                    Chưa có dữ liệu doanh thu trong khoảng thời gian này
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Main Charts */}
                        <div className={styles.chartsGrid}>
                            <div className={`${styles.chartCard} ${styles.chartWide}`}>
                                <h2>Lượt khám theo {this.getTypeLabel()}</h2>
                                <div className={styles.chartWrapper}>
                                    <Line
                                        data={visitChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { y: { beginAtZero: true, ticks: { stepSize: 5 } } }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.chartsGridSecondary}>
                            <div className={styles.chartCard}>
                                <h2>Top 5 Bác sĩ khám nhiều nhất</h2>
                                <div className={styles.chartWrapperSmall}>
                                    <Bar
                                        data={doctorChartData}
                                        options={{
                                            indexAxis: 'y',
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { display: false } },
                                            scales: { x: { beginAtZero: true } }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={styles.chartCard}>
                                <h2>Chuyên khoa phổ biến</h2>
                                <div className={styles.chartWrapperSmall}>
                                    <Doughnut
                                        data={specialtyChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={styles.chartCard}>
                                <h2>Trạng thái lịch khám</h2>
                                <div className={styles.chartWrapperSmall}>
                                    <Doughnut
                                        data={statusChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Data Tables */}
                        <div className={styles.tablesGrid}>
                            <div className={styles.tableCard}>
                                <h2>Chi tiết lượt khám</h2>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>Thời gian</th>
                                            <th>Số lượt</th>
                                            <th>Tỷ lệ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visitStats.slice(0, 10).map((row, index) => {
                                            const total = visitStats.reduce((sum, r) => sum + r.count, 0);
                                            const percentage = total > 0 ? ((row.count / total) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={index}>
                                                    <td>{row.period}</td>
                                                    <td><strong>{row.count}</strong></td>
                                                    <td>
                                                        <div className={styles.progressBar}>
                                                            <div
                                                                className={styles.progressFill}
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                            <span>{percentage}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.tableCard}>
                                <h2>Bảng xếp hạng Bác sĩ</h2>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Bác sĩ</th>
                                            <th>Số lượt khám</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topDoctors.map((row, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <span className={`${styles.rank} ${styles[`rank${index + 1}`]}`}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td>{row.doctor?.full_name || 'Không rõ'}</td>
                                                <td><strong>{row.count}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }
}

export default AdminReports;
