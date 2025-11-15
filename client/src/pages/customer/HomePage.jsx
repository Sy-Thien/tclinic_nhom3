import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './HomePage.module.css';

export default function HomePage() {
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [stats, setStats] = useState({
        totalDoctors: 0,
        totalPatients: 0,
        yearsOfExperience: 10,
        totalServices: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Lấy chuyên khoa
            const specialtiesRes = await api.get('/api/public/specialties');
            setSpecialties(specialtiesRes.data.slice(0, 6)); // Lấy 6 chuyên khoa

            // Lấy bác sĩ (sẽ tạo API sau)
            // const doctorsRes = await api.get('/api/public/doctors');
            // setDoctors(doctorsRes.data.slice(0, 4));

            // Lấy thống kê (sẽ tạo API sau)
            // const statsRes = await api.get('/api/public/stats');
            // setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const features = [
        {
            icon: '🏥',
            title: 'Đội ngũ bác sĩ chuyên môn cao',
            description: 'Bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân'
        },
        {
            icon: '⏰',
            title: 'Đặt lịch nhanh chóng',
            description: 'Đặt lịch khám online chỉ trong vài phút'
        },
        {
            icon: '💊',
            title: 'Dịch vụ đa dạng',
            description: 'Đầy đủ các chuyên khoa từ A-Z'
        },
        {
            icon: '📱',
            title: 'Theo dõi lịch hẹn',
            description: 'Quản lý lịch khám dễ dàng trên điện thoại'
        }
    ];

    const steps = [
        {
            number: '1',
            title: 'Chọn chuyên khoa',
            description: 'Lựa chọn chuyên khoa phù hợp với triệu chứng'
        },
        {
            number: '2',
            title: 'Chọn bác sĩ & giờ khám',
            description: 'Chọn bác sĩ và thời gian phù hợp'
        },
        {
            number: '3',
            title: 'Xác nhận thông tin',
            description: 'Điền thông tin cá nhân và xác nhận'
        },
        {
            number: '4',
            title: 'Nhận xác nhận',
            description: 'Nhận email xác nhận và đến khám đúng giờ'
        }
    ];

    return (
        <div className={styles.homePage}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <h1 className={styles.heroTitle}>
                            Chăm sóc sức khỏe <br />
                            <span className={styles.highlight}>Chuyên nghiệp & Tận tâm</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Đặt lịch khám bệnh online nhanh chóng, tiện lợi với đội ngũ bác sĩ giàu kinh nghiệm
                        </p>
                        <div className={styles.heroButtons}>
                            <button
                                className={styles.btnPrimary}
                                onClick={() => navigate('/booking')}
                            >
                                Đặt lịch khám ngay
                            </button>
                            <button
                                className={styles.btnSecondary}
                                onClick={() => navigate('/doctors')}
                            >
                                Xem bác sĩ
                            </button>
                        </div>
                    </div>
                    <div className={styles.heroImage}>
                        <img
                            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600"
                            alt="Bác sĩ"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className={styles.container}>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>👨‍⚕️</div>
                            <div className={styles.statValue}>50+</div>
                            <div className={styles.statLabel}>Bác sĩ giàu kinh nghiệm</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>😊</div>
                            <div className={styles.statValue}>10,000+</div>
                            <div className={styles.statLabel}>Bệnh nhân hài lòng</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🏆</div>
                            <div className={styles.statValue}>10+</div>
                            <div className={styles.statLabel}>Năm kinh nghiệm</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>💊</div>
                            <div className={styles.statValue}>30+</div>
                            <div className={styles.statLabel}>Dịch vụ y tế</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Tại sao chọn chúng tôi?</h2>
                    <div className={styles.featureGrid}>
                        {features.map((feature, index) => (
                            <div key={index} className={styles.featureCard}>
                                <div className={styles.featureIcon}>{feature.icon}</div>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureDesc}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Specialties Section */}
            <section className={styles.specialties}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Chuyên khoa</h2>
                    <p className={styles.sectionSubtitle}>
                        Đa dạng các chuyên khoa đáp ứng mọi nhu cầu khám chữa bệnh
                    </p>
                    <div className={styles.specialtyGrid}>
                        {specialties.map((specialty) => (
                            <div
                                key={specialty.id}
                                className={styles.specialtyCard}
                                onClick={() => navigate(`/booking?specialty=${specialty.id}`)}
                            >
                                <div className={styles.specialtyIcon}>🏥</div>
                                <h3 className={styles.specialtyName}>{specialty.name}</h3>
                                <p className={styles.specialtyDesc}>{specialty.description}</p>
                                <button className={styles.specialtyBtn}>Đặt lịch →</button>
                            </div>
                        ))}
                    </div>
                    <div className={styles.sectionFooter}>
                        <button
                            className={styles.btnViewAll}
                            onClick={() => navigate('/services')}
                        >
                            Xem tất cả chuyên khoa
                        </button>
                    </div>
                </div>
            </section>

            {/* How it works Section */}
            <section className={styles.howItWorks}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Quy trình đặt lịch</h2>
                    <p className={styles.sectionSubtitle}>
                        4 bước đơn giản để đặt lịch khám bệnh
                    </p>
                    <div className={styles.stepGrid}>
                        {steps.map((step, index) => (
                            <div key={index} className={styles.stepCard}>
                                <div className={styles.stepNumber}>{step.number}</div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDesc}>{step.description}</p>
                                {index < steps.length - 1 && (
                                    <div className={styles.stepArrow}>→</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <div className={styles.container}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>Sẵn sàng đặt lịch khám?</h2>
                        <p className={styles.ctaSubtitle}>
                            Đăng ký ngay hôm nay để nhận được dịch vụ chăm sóc sức khỏe tốt nhất
                        </p>
                        <button
                            className={styles.ctaButton}
                            onClick={() => navigate('/booking')}
                        >
                            Đặt lịch ngay
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}