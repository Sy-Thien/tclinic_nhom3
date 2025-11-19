import { useState, useEffect } from 'react';
import axios from 'axios';
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
    Legend
} from 'chart.js';
import styles from './AdminReports.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

export default function AdminReports() {
    const [visitStats, setVisitStats] = useState([]);
    const [topDoctors, setTopDoctors] = useState([]);
    const [popularSpecialties, setPopularSpecialties] = useState([]);
    const [type, setType] = useState('day');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [loading, setLoading] = useState(true);

    // Lấy dữ liệu thống kê
    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            params.append('type', type);
            if (from) params.append('from', from);
            if (to) params.append('to', to);

            const [visitsRes, doctorsRes, specialtiesRes] = await Promise.all([
                axios.get(`http://localhost:5000/api/admin/reports/visits?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:5000/api/admin/reports/top-doctors?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:5000/api/admin/reports/popular-specialties?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setVisitStats(visitsRes.data);
            setTopDoctors(doctorsRes.data);
            setPopularSpecialties(specialtiesRes.data);
        } catch (error) {
            alert('Lỗi khi tải dữ liệu báo cáo');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line
    }, [type, from, to]);

    // Chart data
    const visitChartData = {
        labels: visitStats.map(row => row.period),
        datasets: [
            {
                label: 'Số lượt khám',
                data: visitStats.map(row => row.count),
                backgroundColor: '#6366f1',
                borderColor: '#6366f1',
                fill: true,
                tension: 0.3
            }
        ]
    };

    const doctorChartData = {
        labels: topDoctors.map(row => row.doctor?.full_name || 'Không rõ'),
        datasets: [
            {
                label: 'Số lượt khám',
                data: topDoctors.map(row => row.count),
                backgroundColor: '#10b981',
                borderColor: '#10b981',
            }
        ]
    };

    const specialtyChartData = {
        labels: popularSpecialties.map(row => row.specialty?.name || 'Không rõ'),
        datasets: [
            {
                label: 'Lượt khám',
                data: popularSpecialties.map(row => row.count),
                backgroundColor: [
                    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#a21caf', '#eab308'
                ]
            }
        ]
    };

    // Xuất báo cáo
    const handleExport = async (format) => {
        try {
            const token = localStorage.getItem('token');
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Báo cáo & Thống kê</h1>
                <p>Thống kê lượt khám, bác sĩ, chuyên khoa và xuất báo cáo</p>
            </div>

            <div className={styles.filters}>
                <select value={type} onChange={e => setType(e.target.value)}>
                    <option value="day">Theo ngày</option>
                    <option value="week">Theo tuần</option>
                    <option value="month">Theo tháng</option>
                </select>
                <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
                <input type="date" value={to} onChange={e => setTo(e.target.value)} />
                <button onClick={() => handleExport('excel')} className={styles.btnExport}>Xuất Excel</button>
                <button onClick={() => handleExport('pdf')} className={styles.btnExport}>Xuất PDF</button>
            </div>

            {loading ? (
                <div className={styles.loading}>Đang tải dữ liệu...</div>
            ) : (
                <div className={styles.chartsGrid}>
                    <div className={styles.chartCard}>
                        <h2>Lượt khám ({type === 'day' ? 'Ngày' : type === 'week' ? 'Tuần' : 'Tháng'})</h2>
                        <Bar data={visitChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                    </div>
                    <div className={styles.chartCard}>
                        <h2>Bác sĩ khám nhiều nhất</h2>
                        <Bar data={doctorChartData} options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }} />
                    </div>
                    <div className={styles.chartCard}>
                        <h2>Chuyên khoa phổ biến</h2>
                        <Doughnut data={specialtyChartData} options={{ responsive: true }} />
                    </div>
                </div>
            )}
        </div>
    );
}
