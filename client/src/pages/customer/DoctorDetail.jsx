import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './DoctorDetail.module.css';

class DoctorDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            doctor: null,
            loading: true
        };
    }

    componentDidMount() {
        this.fetchDoctorDetail();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.params.id !== this.props.params.id) {
            this.fetchDoctorDetail();
        }
    }

    fetchDoctorDetail = async () => {
        const { id } = this.props.params;
        try {
            this.setState({ loading: true });
            const response = await api.get(`/api/public/doctors/${id}`);
            this.setState({ doctor: response.data });
        } catch (error) {
            console.error('Error fetching doctor:', error);
            alert('Không tìm thấy bác sĩ');
            this.props.navigate('/doctors');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleBooking = () => {
        const { doctor } = this.state;
        const { id } = this.props.params;
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để đặt lịch');
            this.props.navigate('/login');
            return;
        }

        if (!doctor) {
            alert('❌ Không tìm thấy thông tin bác sĩ');
            return;
        }

        const params = new URLSearchParams();
        params.set('doctor', id);
        params.set('doctor_name', doctor.name || doctor.full_name);
        if (doctor.specialty?.id || doctor.specialty_id) {
            params.set('specialty', doctor.specialty?.id || doctor.specialty_id);
        }
        this.props.navigate(`/booking?${params.toString()}`);
    };

    render() {
        const { doctor, loading } = this.state;

        if (loading) {
            return (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải...</p>
                </div>
            );
        }

        if (!doctor) {
            return null;
        }

        return (
            <div className={styles.container}>
                <button className={styles.btnBack} onClick={() => this.props.navigate('/doctors')}>
                    ← Quay lại
                </button>

                <div className={styles.doctorProfile}>
                    {/* Left Column */}
                    <div className={styles.leftColumn}>
                        <div className={styles.avatarSection}>
                            {doctor.avatar ? (
                                <img src={doctor.avatar} alt={doctor.name} className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {doctor.name.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Thông tin liên hệ</h3>
                            <div className={styles.infoItem}>
                                <span className={styles.icon}>📞</span>
                                <div>
                                    <strong>Điện thoại</strong>
                                    <p>{doctor.phone || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.icon}>📧</span>
                                <div>
                                    <strong>Email</strong>
                                    <p>{doctor.email}</p>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.icon}>🏥</span>
                                <div>
                                    <strong>Chuyên khoa</strong>
                                    <p>{doctor.specialty?.name || 'Đa khoa'}</p>
                                </div>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.icon}>💰</span>
                                <div>
                                    <strong>Giá khám</strong>
                                    <p className={styles.price}>200.000đ</p>
                                    <small style={{ color: '#888', fontSize: '11px' }}>Mặc định, tùy dịch vụ có thể khác</small>
                                </div>
                            </div>
                        </div>

                        <button className={styles.btnBooking} onClick={this.handleBooking}>
                            Đặt lịch khám
                        </button>
                    </div>

                    {/* Right Column */}
                    <div className={styles.rightColumn}>
                        <div className={styles.header}>
                            <h1>{doctor.name}</h1>
                            <span className={styles.badge}>
                                {doctor.specialty?.name || 'Đa khoa'}
                            </span>
                        </div>

                        <div className={styles.section}>
                            <h2>Giới thiệu</h2>
                            <p className={styles.description}>
                                {doctor.description || 'Bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân, luôn đặt sức khỏe bệnh nhân lên hàng đầu.'}
                            </p>
                        </div>

                        {doctor.specialty && (
                            <div className={styles.section}>
                                <h2>Chuyên khoa</h2>
                                <div className={styles.specialtyCard}>
                                    <h3>{doctor.specialty.name}</h3>
                                    <p>{doctor.specialty.description}</p>
                                </div>
                            </div>
                        )}

                        <div className={styles.section}>
                            <h2>Dịch vụ khám</h2>
                            <ul className={styles.serviceList}>
                                <li>Khám sức khỏe tổng quát</li>
                                <li>Tư vấn điều trị chuyên sâu</li>
                                <li>Theo dõi sức khỏe định kỳ</li>
                                <li>Chẩn đoán và kê đơn thuốc</li>
                            </ul>
                        </div>

                        <div className={styles.section}>
                            <h2>Lịch làm việc</h2>
                            <div className={styles.schedule}>
                                <div className={styles.scheduleItem}>
                                    <strong>Thứ 2 - Thứ 6:</strong>
                                    <span>08:00 - 17:00</span>
                                </div>
                                <div className={styles.scheduleItem}>
                                    <strong>Thứ 7:</strong>
                                    <span>08:00 - 12:00</span>
                                </div>
                                <div className={styles.scheduleItem}>
                                    <strong>Chủ nhật:</strong>
                                    <span>Nghỉ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(DoctorDetail);
