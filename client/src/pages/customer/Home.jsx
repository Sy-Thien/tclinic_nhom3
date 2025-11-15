import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export default function Home() {
    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>🏥 Phòng Khám Tclinic</h1>
                    <p className={styles.heroSubtitle}>
                        Chăm sóc sức khỏe toàn diện - Tận tâm và chuyên nghiệp
                    </p>
                    <p className={styles.heroDescription}>
                        Đội ngũ bác sĩ giàu kinh nghiệm | Trang thiết bị hiện đại | Quy trình chuẩn quốc tế
                    </p>
                    <div className={styles.heroButtons}>
                        <Link to="/booking" className={styles.btnPrimary}>
                            📅 Đặt lịch khám
                        </Link>
                        <Link to="/doctors" className={styles.btnSecondary}>
                            👨‍⚕️ Xem bác sĩ
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <h2 className={styles.sectionTitle}>✨ Vì sao chọn chúng tôi?</h2>
                <div className={styles.featureGrid}>
                    <div className={styles.featureCard}>
                        <span className={styles.featureIcon}>👨‍⚕️</span>
                        <h3>Bác sĩ giỏi</h3>
                        <p>Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm với nghề</p>
                    </div>
                    <div className={styles.featureCard}>
                        <span className={styles.featureIcon}>🏥</span>
                        <h3>Cơ sở hiện đại</h3>
                        <p>Trang thiết bị y tế hiện đại, đạt chuẩn quốc tế</p>
                    </div>
                    <div className={styles.featureCard}>
                        <span className={styles.featureIcon}>💰</span>
                        <h3>Chi phí hợp lý</h3>
                        <p>Giá cả minh bạch, phù hợp với mọi đối tượng</p>
                    </div>
                    <div className={styles.featureCard}>
                        <span className={styles.featureIcon}>⏰</span>
                        <h3>Đặt lịch online</h3>
                        <p>Đặt lịch nhanh chóng, tiện lợi, tiết kiệm thời gian</p>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className={styles.services}>
                <h2 className={styles.sectionTitle}>🏥 Dịch vụ của chúng tôi</h2>
                <div className={styles.serviceGrid}>
                    <div className={styles.serviceCard}>
                        <span className={styles.serviceIcon}>❤️</span>
                        <h3>Nội khoa</h3>
                        <p>Khám và điều trị các bệnh nội khoa</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <span className={styles.serviceIcon}>🔪</span>
                        <h3>Ngoại khoa</h3>
                        <p>Phẫu thuật và điều trị ngoại khoa</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <span className={styles.serviceIcon}>👶</span>
                        <h3>Nhi khoa</h3>
                        <p>Chăm sóc sức khỏe trẻ em</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <span className={styles.serviceIcon}>🤰</span>
                        <h3>Sản phụ khoa</h3>
                        <p>Chăm sóc sức khỏe phụ nữ</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <span className={styles.serviceIcon}>💓</span>
                        <h3>Tim mạch</h3>
                        <p>Chuyên khoa tim mạch</p>
                    </div>
                    <div className={styles.serviceCard}>
                        <span className={styles.serviceIcon}>🦴</span>
                        <h3>Cơ Xương Khớp</h3>
                        <p>Điều trị bệnh xương khớp</p>
                    </div>
                </div>
                <div className={styles.viewMore}>
                    <Link to="/services" className={styles.btnViewMore}>
                        Xem tất cả dịch vụ →
                    </Link>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>10,000+</span>
                    <span className={styles.statLabel}>Bệnh nhân</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>50+</span>
                    <span className={styles.statLabel}>Bác sĩ</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>10+</span>
                    <span className={styles.statLabel}>Chuyên khoa</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statNumber}>98%</span>
                    <span className={styles.statLabel}>Hài lòng</span>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <h2>Đặt lịch khám ngay hôm nay</h2>
                <p>Chăm sóc sức khỏe của bạn là ưu tiên hàng đầu</p>
                <Link to="/booking" className={styles.btnCta}>
                    📅 Đặt lịch ngay
                </Link>
            </section>
        </div>
    );
}