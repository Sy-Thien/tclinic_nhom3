import styles from './About.module.css';

export default function About() {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1>🏥 Giới thiệu về Phòng Khám</h1>
                <p>Chăm sóc sức khỏe toàn diện - Tận tâm và chuyên nghiệp</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.icon}>🎯</span>
                        <h2>Sứ mệnh của chúng tôi</h2>
                    </div>
                    <p>
                        Phòng Khám Tclinic cam kết mang đến dịch vụ chăm sóc sức khỏe chất lượng cao,
                        với đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại.
                    </p>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.icon}>⭐</span>
                        <h2>Giá trị cốt lõi</h2>
                    </div>
                    <div className={styles.valueGrid}>
                        <div className={styles.valueCard}>
                            <span className={styles.valueIcon}>💙</span>
                            <h3>Tận tâm</h3>
                            <p>Chăm sóc bệnh nhân với sự tận tình và chu đáo nhất</p>
                        </div>
                        <div className={styles.valueCard}>
                            <span className={styles.valueIcon}>🔬</span>
                            <h3>Chuyên nghiệp</h3>
                            <p>Đội ngũ bác sĩ giàu kinh nghiệm, được đào tạo bài bản</p>
                        </div>
                        <div className={styles.valueCard}>
                            <span className={styles.valueIcon}>🏆</span>
                            <h3>Chất lượng</h3>
                            <p>Trang thiết bị hiện đại, quy trình điều trị chuẩn quốc tế</p>
                        </div>
                        <div className={styles.valueCard}>
                            <span className={styles.valueIcon}>🤝</span>
                            <h3>Uy tín</h3>
                            <p>Được hàng nghìn bệnh nhân tin tưởng lựa chọn</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.icon}>🏥</span>
                        <h2>Dịch vụ của chúng tôi</h2>
                    </div>
                    <div className={styles.serviceList}>
                        <div className={styles.serviceItem}>
                            <span>✓</span>
                            <span>Khám và tư vấn sức khỏe tổng quát</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <span>✓</span>
                            <span>Chuyên khoa: Nội, Ngoại, Sản, Nhi, Tim mạch, Da liễu...</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <span>✓</span>
                            <span>Xét nghiệm và chẩn đoán hình ảnh</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <span>✓</span>
                            <span>Điều trị và theo dõi bệnh nhân</span>
                        </div>
                        <div className={styles.serviceItem}>
                            <span>✓</span>
                            <span>Tư vấn dinh dưỡng và chăm sóc sức khỏe</span>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.icon}>📊</span>
                        <h2>Thành tựu</h2>
                    </div>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>10,000+</div>
                            <div className={styles.statLabel}>Bệnh nhân</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>50+</div>
                            <div className={styles.statLabel}>Bác sĩ</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>10+</div>
                            <div className={styles.statLabel}>Chuyên khoa</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>98%</div>
                            <div className={styles.statLabel}>Hài lòng</div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}