import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import styles from './DoctorList.module.css';

export default function DoctorList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'all');
    const [selectedSpecialtyName, setSelectedSpecialtyName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    // Cập nhật tên chuyên khoa khi filter thay đổi
    useEffect(() => {
        if (selectedSpecialty && selectedSpecialty !== 'all') {
            const spec = specialties.find(s => s.id === parseInt(selectedSpecialty));
            setSelectedSpecialtyName(spec?.name || '');
        } else {
            setSelectedSpecialtyName('');
        }
    }, [selectedSpecialty, specialties]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [doctorsRes, specialtiesRes] = await Promise.all([
                api.get('/api/public/doctors'),
                api.get('/api/public/specialties')
            ]);

            setDoctors(doctorsRes.data);
            setSpecialties(specialtiesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDoctors = doctors.filter(doctor => {
        // Filter by specialty
        const matchSpecialty = selectedSpecialty === 'all' || doctor.specialty_id === parseInt(selectedSpecialty);

        // Filter by search term (name, description, education)
        const searchLower = searchTerm.toLowerCase();
        const matchSearch =
            doctor.full_name.toLowerCase().includes(searchLower) ||
            (doctor.description && doctor.description.toLowerCase().includes(searchLower)) ||
            (doctor.education && doctor.education.toLowerCase().includes(searchLower)) ||
            (doctor.specialty_name && doctor.specialty_name.toLowerCase().includes(searchLower));

        return matchSpecialty && matchSearch;
    });

    // Sort doctors
    const sortedDoctors = [...filteredDoctors].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.full_name.localeCompare(b.full_name);
            case 'experience':
                const expA = a.experience ? parseInt(a.experience.match(/\d+/)?.[0] || 0) : 0;
                const expB = b.experience ? parseInt(b.experience.match(/\d+/)?.[0] || 0) : 0;
                return expB - expA;
            default:
                return 0;
        }
    });

    const handleViewDetail = (doctorId) => {
        navigate(`/doctors/${doctorId}`);
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>👨‍⚕️ {selectedSpecialtyName ? `Bác sĩ ${selectedSpecialtyName}` : 'Đội Ngũ Bác Sĩ'}</h1>
                <p>{selectedSpecialtyName
                    ? `Danh sách bác sĩ chuyên khoa ${selectedSpecialtyName}`
                    : 'Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm chăm sóc sức khỏe của bạn'}</p>
            </div>

            {/* Filter Section */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="🔍 Tìm theo tên, chuyên môn, học vị..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.filterRow}>
                    <div className={styles.filterItem}>
                        <label>Chuyên khoa:</label>
                        <select
                            value={selectedSpecialty}
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            {specialties.map(specialty => (
                                <option key={specialty.id} value={specialty.id}>
                                    {specialty.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterItem}>
                        <label>Sắp xếp:</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">Tên A-Z</option>
                            <option value="experience">Kinh nghiệm</option>
                        </select>
                    </div>
                </div>

                <div className={styles.resultCount}>
                    Tìm thấy <strong>{sortedDoctors.length}</strong> bác sĩ
                </div>
            </div>

            {/* Doctor Grid */}
            <div className={styles.doctorGrid}>
                {sortedDoctors.length === 0 ? (
                    <div className={styles.noData}>
                        <p>❌ Không tìm thấy bác sĩ phù hợp</p>
                        <p className={styles.noDataHint}>Thử thay đổi bộ lọc hoặc chọn ngày khác</p>
                    </div>
                ) : (
                    sortedDoctors.map(doctor => (
                        <div key={doctor.id} className={styles.doctorCard}>
                            <div className={styles.doctorAvatar}>
                                {doctor.avatar ? (
                                    <img src={doctor.avatar} alt={doctor.full_name} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {doctor.full_name.split(' ').pop().charAt(0)}
                                    </div>
                                )}
                            </div>

                            <div className={styles.doctorInfo}>
                                <h3>{doctor.education ? `${doctor.education} ` : ''}{doctor.full_name}</h3>
                                <p className={styles.specialty}>
                                    <span className={styles.badge}>
                                        {doctor.specialty_name || 'Đa khoa'}
                                    </span>
                                </p>

                                <div className={styles.details}>
                                    {doctor.experience && (
                                        <p className={styles.experience}>
                                            ⏱️ {doctor.experience}
                                        </p>
                                    )}
                                    <p className={styles.workingHours}>
                                        📅 Thứ 2 - Thứ 6: 7:00 - 17:00
                                    </p>
                                </div>

                                {doctor.description && (
                                    <p className={styles.bio}>
                                        {doctor.description.split('\n')[0].substring(0, 120)}...
                                    </p>
                                )}

                                <button
                                    className={styles.btnViewDetail}
                                    onClick={() => handleViewDetail(doctor.id)}
                                >
                                    Xem chi tiết & đặt lịch →
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
