import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import styles from './DoctorList.module.css';

export default function DoctorList() {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        specialty_id: searchParams.get('specialty') || '',
        search: searchParams.get('search') || ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchSpecialties();
    }, []);

    useEffect(() => {
        fetchDoctors();
    }, [filters]);

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (filters.specialty_id) params.append('specialty_id', filters.specialty_id);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/api/public/doctors?${params}`);
            setDoctors(response.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        // Cập nhật URL
        const newParams = new URLSearchParams();
        if (newFilters.specialty_id) newParams.set('specialty', newFilters.specialty_id);
        if (newFilters.search) newParams.set('search', newFilters.search);
        setSearchParams(newParams);
    };

    const handleClearFilters = () => {
        setFilters({ specialty_id: '', search: '' });
        setSearchParams({});
    };

    const handleBooking = (doctorId) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để đặt lịch');
            navigate('/login');
            return;
        }
        navigate(`/booking?doctor=${doctorId}`);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1>Đội ngũ Bác sĩ</h1>
                <p>Tìm kiếm bác sĩ phù hợp với nhu cầu của bạn</p>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <input
                        type="text"
                        placeholder="🔍 Tìm theo tên bác sĩ..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <select
                        value={filters.specialty_id}
                        onChange={(e) => handleFilterChange('specialty_id', e.target.value)}
                        className={styles.selectInput}
                    >
                        <option value="">Tất cả chuyên khoa</option>
                        {specialties.map(specialty => (
                            <option key={specialty.id} value={specialty.id}>
                                {specialty.name}
                            </option>
                        ))}
                    </select>
                </div>

                {(filters.specialty_id || filters.search) && (
                    <button onClick={handleClearFilters} className={styles.btnClear}>
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* Results */}
            <div className={styles.results}>
                <p className={styles.resultCount}>
                    Tìm thấy <strong>{doctors.length}</strong> bác sĩ
                </p>
            </div>

            {/* Doctor List */}
            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải...</p>
                </div>
            ) : doctors.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>😔</div>
                    <h3>Không tìm thấy bác sĩ phù hợp</h3>
                    <p>Vui lòng thử thay đổi bộ lọc</p>
                    <button onClick={handleClearFilters}>Xóa bộ lọc</button>
                </div>
            ) : (
                <div className={styles.doctorGrid}>
                    {doctors.map(doctor => (
                        <div key={doctor.id} className={styles.doctorCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.avatar}>
                                    {doctor.avatar ? (
                                        <img src={doctor.avatar} alt={doctor.name} />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            {doctor.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.badge}>
                                    {doctor.specialty?.name || 'Đa khoa'}
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <h3 className={styles.doctorName}>{doctor.name}</h3>

                                <p className={styles.doctorDesc}>
                                    {doctor.description || 'Bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân'}
                                </p>

                                <div className={styles.doctorInfo}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.icon}>📞</span>
                                        <span>{doctor.phone || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.icon}>💰</span>
                                        <span>
                                            {doctor.price
                                                ? `${doctor.price.toLocaleString()}đ`
                                                : 'Liên hệ'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <button
                                    className={styles.btnViewDetail}
                                    onClick={() => navigate(`/doctors/${doctor.id}`)}
                                >
                                    Xem chi tiết
                                </button>
                                <button
                                    className={styles.btnBooking}
                                    onClick={() => handleBooking(doctor.id)}
                                >
                                    Đặt lịch
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}