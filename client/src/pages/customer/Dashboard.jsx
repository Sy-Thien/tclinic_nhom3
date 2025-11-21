import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalAppointments: 0,
        completedAppointments: 0,
        pendingAppointments: 0
    });
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [doctorsRes, specialtiesRes, servicesRes] = await Promise.all([
                api.get('/api/public/doctors'),
                api.get('/api/public/specialties'),
                api.get('/api/public/services')
            ]);

            setDoctors(doctorsRes.data.slice(0, 6));
            setSpecialties(specialtiesRes.data);
            setServices(servicesRes.data.slice(0, 6));

            // Fetch user appointments nếu đã login
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const appointmentsRes = await api.get('/api/customer/appointments');
                    const appointments = appointmentsRes.data.bookings || appointmentsRes.data.data || [];
                    setStats({
                        totalAppointments: appointments.length,
                        completedAppointments: appointments.filter(a => a.status === 'completed').length,
                        pendingAppointments: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length
                    });
                } catch (error) {
                    console.error('Error fetching appointments:', error);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        navigate('/booking');
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>🏥 Chào mừng đến với phòng khám của chúng tôi</h1>
                    <p>Chăm sóc sức khỏe toàn diện với đội ngũ bác sĩ chuyên nghiệp</p>
                    <button className={styles.btnBooking} onClick={handleBooking}>
                        📅 Đặt lịch khám ngay
                    </button>
                </div>
            </section>

            {/* Stats Section */}
            {stats.totalAppointments > 0 && (
                <section className={styles.stats}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>📋</div>
                        <div className={styles.statContent}>
                            <h3>{stats.totalAppointments}</h3>
                            <p>Tổng lịch hẹn</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>✅</div>
                        <div className={styles.statContent}>
                            <h3>{stats.completedAppointments}</h3>
                            <p>Đã khám</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>⏳</div>
                        <div className={styles.statContent}>
                            <h3>{stats.pendingAppointments}</h3>
                            <p>Chờ xác nhận</p>
                        </div>
                    </div>
                </section>
            )}

            {/* Services Preview */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>🏥 Dịch vụ khám chuyên khoa</h2>
                    <button className={styles.btnViewAll} onClick={() => navigate('/services')}>
                        Xem tất cả
                    </button>
                </div>
                <div className={styles.serviceGrid}>
                    {services.map(service => (
                        <div key={service.id} className={styles.serviceCard}>
                            <div className={styles.serviceIcon}>🩺</div>
                            <h3>{service.name}</h3>
                            <p>{service.description}</p>
                            <div className={styles.servicePrice}>
                                {service.price ? `${service.price.toLocaleString()}đ` : 'Liên hệ'}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Specialties */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>🔬 Chuyên khoa</h2>
                </div>
                <div className={styles.specialtyGrid}>
                    {specialties.slice(0, 8).map(specialty => (
                        <button
                            key={specialty.id}
                            className={styles.specialtyCard}
                            onClick={() => navigate(`/doctors?specialty=${specialty.id}`)}
                        >
                            <div className={styles.specialtyIcon}>⚕️</div>
                            <h4>{specialty.name}</h4>
                            <p>{specialty.description}</p>
                        </button>
                    ))}
                </div>
            </section>

            {/* Featured Doctors */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2>👨‍⚕️ Bác sĩ tiêu biểu</h2>
                    <button className={styles.btnViewAll} onClick={() => navigate('/doctors')}>
                        Xem tất cả bác sĩ
                    </button>
                </div>
                <div className={styles.doctorGrid}>
                    {doctors.map(doctor => (
                        <div key={doctor.id} className={styles.doctorCard}>
                            <div className={styles.doctorHeader}>
                                <div className={styles.avatar}>
                                    {doctor.avatar ? (
                                        <img src={doctor.avatar} alt={doctor.full_name} />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            {doctor.full_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <span className={styles.badge}>{doctor.specialty?.name || 'Đa khoa'}</span>
                            </div>
                            <div className={styles.doctorBody}>
                                <h3>{doctor.full_name}</h3>
                                <p className={styles.experience}>
                                    {doctor.experience || 'Kinh nghiệm lâu năm'}
                                </p>
                                <p className={styles.description}>
                                    {doctor.description || 'Bác sĩ chuyên nghiệp, tận tâm với bệnh nhân'}
                                </p>
                            </div>
                            <div className={styles.doctorFooter}>
                                <button
                                    className={styles.btnDetail}
                                    onClick={() => navigate(`/doctors/${doctor.id}`)}
                                >
                                    Xem chi tiết
                                </button>
                                <button
                                    className={styles.btnBook}
                                    onClick={handleBooking}
                                >
                                    Đặt lịch
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className={styles.whyChoose}>
                <h2>Tại sao chọn chúng tôi?</h2>
                <div className={styles.benefitsGrid}>
                    <div className={styles.benefit}>
                        <div className={styles.benefitIcon}>🏆</div>
                        <h3>Chuyên nghiệp</h3>
                        <p>Đội ngũ bác sĩ có bằng cấp quốc tế, kinh nghiệm nhiều năm</p>
                    </div>
                    <div className={styles.benefit}>
                        <div className={styles.benefitIcon}>💻</div>
                        <h3>Công nghệ hiện đại</h3>
                        <p>Trang thiết bị y tế tiên tiến, phương pháp điều trị hiệu quả</p>
                    </div>
                    <div className={styles.benefit}>
                        <div className={styles.benefitIcon}>🤝</div>
                        <h3>Tư vấn tận tâm</h3>
                        <p>Lắng nghe, tư vấn kỹ lưỡng, giải đáp hết thắc mắc</p>
                    </div>
                    <div className={styles.benefit}>
                        <div className={styles.benefitIcon}>⏰</div>
                        <h3>Dịch vụ nhanh chóng</h3>
                        <p>Đặt lịch online, thời gian chờ ngắn, hiệu quả cao</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <h2>Bạn cần tư vấn sức khỏe?</h2>
                <p>Hãy liên hệ với chúng tôi ngay hôm nay để được hỗ trợ tốt nhất</p>
                <div className={styles.ctaButtons}>
                    <button className={styles.btnPrimary} onClick={handleBooking}>
                        📅 Đặt lịch khám
                    </button>
                    <button className={styles.btnSecondary} onClick={() => navigate('/contact')}>
                        📞 Liên hệ
                    </button>
                </div>
            </section>
        </div>
    );
}
