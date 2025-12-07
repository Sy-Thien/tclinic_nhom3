import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './DoctorDetail.module.css';

export default function DoctorDetail() {
    const { id } = useParams();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctorDetail();
    }, [id]);

    const fetchDoctorDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/public/doctors/${id}`);
            setDoctor(response.data);
        } catch (error) {
            console.error('Error fetching doctor:', error);
            alert('Không tìm thấy bác sĩ');
            navigate('/doctors');
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để đặt lịch');
            navigate('/login');
            return;
        }

        // ✅ Validate doctor trước khi navigate
        if (!doctor) {
            alert('❌ Không tìm thấy thông tin bác sĩ');
            return;
        }

        // Navigate đến trang booking với params (KHÔNG truyền date/time)
        const params = new URLSearchParams();
        params.set('doctor', id);
        params.set('doctor_name', doctor.name || doctor.full_name);
        if (doctor.specialty?.id || doctor.specialty_id) {
            params.set('specialty', doctor.specialty?.id || doctor.specialty_id);
        }
        // ❌ KHÔNG truyền date/time - để user chọn trong Booking page
        navigate(`/booking?${params.toString()}`);
    };

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
            <button className={styles.btnBack} onClick={() => navigate('/doctors')}>
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

                    <button className={styles.btnBooking} onClick={handleBooking}>
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