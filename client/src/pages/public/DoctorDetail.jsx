import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './DoctorDetail.module.css';

export default function DoctorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        fetchDoctorDetail();
    }, [id]);

    useEffect(() => {
        // Set first available date as selected
        if (schedules && schedules.length > 0 && !selectedDate) {
            const firstDate = schedules[0].work_date;
            setSelectedDate(firstDate);
        }
    }, [schedules]);

    const fetchDoctorDetail = async () => {
        try {
            setLoading(true);
            setError(null);
            const [doctorRes, schedulesRes] = await Promise.all([
                api.get(`/api/public/doctors/${id}`),
                api.get(`/api/public/doctors/${id}/schedule`)
            ]);
            console.log('Doctor data:', doctorRes.data);
            setDoctor(doctorRes.data);
            setSchedules(schedulesRes.data || []);
        } catch (error) {
            console.error('Error fetching doctor detail:', error);
            setError(error.response?.data?.message || 'Không thể tải thông tin bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const getWeekDays = (weekOffset = 0) => {
        const days = [];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7));

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            days.push({
                date,
                dateStr,
                dayName: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()],
                displayDate: `${date.getDate()}/${date.getMonth() + 1}`
            });
        }
        return days;
    };

    const getAvailableDates = () => {
        const uniqueDates = [...new Set(schedules.map(s => s.work_date))];
        return uniqueDates.sort().map(dateStr => {
            const date = new Date(dateStr);
            return {
                dateStr,
                dayName: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()],
                displayDate: `${date.getDate()}/${date.getMonth() + 1}`
            };
        });
    };

    const getSlotsForDate = (dateStr) => {
        return schedules.filter(s => s.work_date === dateStr).sort((a, b) => {
            return a.start_time.localeCompare(b.start_time);
        });
    };

    const handleBooking = (slot = null) => {
        // Navigate đến trang booking với params
        const params = new URLSearchParams();
        params.set('doctor', doctor.id);
        params.set('doctor_name', doctor.full_name);
        if (doctor.specialty_id) {
            params.set('specialty', doctor.specialty_id);
        }
        if (slot && selectedDate) {
            params.set('date', selectedDate);
            params.set('time', slot.start_time?.substring(0, 5));
        }
        navigate(`/booking?${params.toString()}`);
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    if (error) {
        return (
            <div className={styles.error}>
                <p>{error}</p>
                <button onClick={() => navigate(-1)}>Quay lại</button>
            </div>
        );
    }

    if (!doctor) {
        return <div className={styles.error}>Không tìm thấy thông tin bác sĩ</div>;
    }

    const availableDates = getAvailableDates();
    const selectedSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

    return (
        <div className={styles.container}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#45c3d2' }}>🏠 Trang chủ</span>
                {' / '}
                <span onClick={() => navigate('/doctors')} style={{ cursor: 'pointer', color: '#45c3d2' }}>Khám chuyên khoa</span>
                {' / '}
                <span>{doctor.specialty_name || 'Tiêu hóa - Bệnh Viêm gan'}</span>
                {' / '}
                <span style={{ fontWeight: 600 }}>{doctor.education || 'Giáo sư, Tiến sĩ'} {doctor.full_name}</span>
            </div>

            {/* Doctor Header - BookingCare Style */}
            <div className={styles.doctorHeader}>
                <div className={styles.doctorBadge}>⭐ Bác sĩ ưu tú</div>
                <div className={styles.doctorMainInfo}>
                    <div className={styles.avatarWrapper}>
                        {doctor.avatar ? (
                            <img src={doctor.avatar} alt={doctor.full_name} className={styles.avatar} />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {doctor.full_name?.split(' ').pop()?.charAt(0) || 'BS'}
                            </div>
                        )}
                    </div>
                    <div className={styles.doctorTextInfo}>
                        <h1 className={styles.doctorTitle}>
                            {doctor.education && `${doctor.education} `}
                            {doctor.full_name}
                        </h1>
                        <div className={styles.doctorSummary}>
                            {doctor.bio?.split('\n')[0] || `Bác sĩ chuyên khoa ${doctor.specialty_name || 'Đa khoa'}`}
                        </div>
                        <div className={styles.specialty}>
                            <strong>📍 Hà Nội</strong>
                        </div>
                        <div className={styles.specialty}>
                            Chuyên ngành: <strong>{doctor.specialty_name || 'Đa khoa'}</strong> • {doctor.experience || 'Nhiều năm kinh nghiệm'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className={styles.contentGrid}>
                {/* Left Column - Schedule */}
                <div className={styles.leftColumn}>
                    <div className={styles.scheduleCard}>
                        <h3><span className={styles.icon}>📅</span> LỊCH KHÁM</h3>

                        {schedules && schedules.length > 0 ? (
                            <>
                                {/* Date Selector Dropdown */}
                                <div className={styles.dateSelector}>
                                    <select
                                        value={selectedDate || ''}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className={styles.dateDropdown}
                                    >
                                        {availableDates.map((dateInfo, index) => (
                                            <option key={index} value={dateInfo.dateStr}>
                                                {dateInfo.dayName} - {dateInfo.displayDate}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={styles.dropdownIcon}>▼</div>
                                </div>

                                {/* Time Slots for Selected Date */}
                                <div className={styles.timeSlotsContainer}>
                                    {selectedSlots.length > 0 ? (
                                        selectedSlots.map((slot, idx) => (
                                            <button
                                                key={idx}
                                                className={styles.timeSlotButton}
                                                onClick={() => handleBooking(slot)}
                                            >
                                                {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                                            </button>
                                        ))
                                    ) : (
                                        <div className={styles.noSchedule}>Không có lịch khám</div>
                                    )}
                                </div>

                                <div className={styles.noteText}>
                                    <span className={styles.handIcon}>👋</span> Chọn giờ và đặt (Phí đặt lịch 0đ)
                                </div>
                            </>
                        ) : (
                            <div className={styles.noScheduleInfo}>
                                <p>Bác sĩ chưa có lịch làm việc</p>
                            </div>
                        )}

                        <button className={styles.btnBooking} onClick={handleBooking}>
                            📅 Chọn giờ và đặt lịch (Phí đặt lịch 0đ)
                        </button>
                    </div>

                    {/* Location Info */}
                    <div className={styles.infoCard}>
                        <h3><span className={styles.icon}>📍</span> ĐỊA CHỈ KHÁM</h3>
                        <div className={styles.locationInfo}>
                            <p className={styles.clinicName}>Bệnh viện Ung bướu Hưng Việt</p>
                            <p>34 và 40 Đại Cổ Việt, Hai Bà Trưng, Hà Nội</p>
                            {doctor.phone && <p>📞 Liên hệ: {doctor.phone}</p>}
                        </div>
                    </div>

                    {/* Price Info */}
                    <div className={styles.infoCard}>
                        <h3><span className={styles.icon}>💰</span> GIÁ KHÁM</h3>
                        <div className={styles.locationInfo}>
                            <p><strong>500.000đ</strong></p>
                            <p style={{ fontSize: '12px', color: '#999' }}>Giá có thể thay đổi tùy dịch vụ</p>
                        </div>
                    </div>

                    {/* Insurance */}
                    <div className={styles.infoCard}>
                        <h3><span className={styles.icon}>🏥</span> BẢO HIỂM</h3>
                        <div className={styles.locationInfo}>
                            <p>Có áp dụng bảo hiểm y tế</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Details */}
                <div className={styles.rightColumn}>
                    {/* Main Bio Section */}
                    <div className={styles.bioCard}>
                        <h3>{doctor.education && doctor.education.includes('Giáo sư') ? 'Giáo sư, Tiến sĩ, Bác sĩ' : 'Bác sĩ'} {doctor.full_name}</h3>
                        <div className={styles.detailList}>
                            {doctor.bio && doctor.bio.split('\n').map((paragraph, idx) => (
                                paragraph.trim() && <li key={idx}>• {paragraph.trim()}</li>
                            ))}
                        </div>
                    </div>

                    {/* Specialties & Treatment */}
                    <div className={styles.detailCard}>
                        <h3>Khám và điều trị</h3>
                        <div className={styles.detailList}>
                            <li>• {doctor.specialty_name ? `Chuyên ngành Ngoại – Phẫu thuật Nội soi ${doctor.specialty_name}` : 'Khám và điều trị các bệnh chuyên khoa'}</li>
                            <li>• Khám, Nội soi, Xét nghiệm sàng lọc ung thư đại trực tràng</li>
                            <li>• Trúc tiếp thực hiện các kỹ thuật nội soi bao gồm nội soi dạ dày, đại tràng</li>
                            <li>• Bác sĩ dành thời gian để giải thích rõ tình trạng bệnh và phác đồ điều trị, giúp người bệnh an tâm và hiểu rõ qua trình chăm sóc sức khỏe</li>
                        </div>
                    </div>

                    {/* Work Experience */}
                    <div className={styles.detailCard}>
                        <h3>Quá trình công tác</h3>
                        <div className={styles.detailList}>
                            <li>• Hiện là Bác sĩ tại Phòng khám TClinic</li>
                            {doctor.experience && <li>• {doctor.experience}</li>}
                            {doctor.education && doctor.education.includes('Giám đốc') && (
                                <li>• Nguyên Giám đốc Bệnh viện Đại học Y Hà Nội</li>
                            )}
                        </div>
                    </div>

                    {/* Education */}
                    {doctor.education && (
                        <div className={styles.detailCard}>
                            <h3>Quá trình đào tạo</h3>
                            <div className={styles.detailList}>
                                <li>• {doctor.education}</li>
                                <li>• Nhiều năm tu nghiệp tại nước ngoài</li>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
