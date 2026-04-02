import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './DoctorList.module.css';

class DoctorList extends Component {
    constructor(props) {
        super(props);
        const { searchParams } = this.props;
        this.state = {
            doctors: [],
            specialties: [],
            selectedSpecialty: searchParams.get('specialty') || 'all',
            selectedSpecialtyName: '',
            searchTerm: '',
            sortBy: 'name',
            loading: true
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevState.selectedSpecialty !== this.state.selectedSpecialty ||
            prevState.specialties !== this.state.specialties
        ) {
            const { selectedSpecialty, specialties } = this.state;
            if (selectedSpecialty && selectedSpecialty !== 'all') {
                const spec = specialties.find(s => s.id === parseInt(selectedSpecialty));
                this.setState({ selectedSpecialtyName: spec?.name || '' });
            } else {
                this.setState({ selectedSpecialtyName: '' });
            }
        }
    }

    fetchData = async () => {
        try {
            this.setState({ loading: true });
            const [doctorsRes, specialtiesRes] = await Promise.all([
                api.get('/api/public/doctors'),
                api.get('/api/public/specialties')
            ]);

            this.setState({
                doctors: doctorsRes.data,
                specialties: specialtiesRes.data
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    getFilteredDoctors = () => {
        const { doctors, selectedSpecialty, searchTerm } = this.state;
        return doctors.filter(doctor => {
            const matchSpecialty = selectedSpecialty === 'all' || doctor.specialty_id === parseInt(selectedSpecialty);
            const searchLower = searchTerm.toLowerCase();
            const matchSearch =
                doctor.full_name.toLowerCase().includes(searchLower) ||
                (doctor.description && doctor.description.toLowerCase().includes(searchLower)) ||
                (doctor.education && doctor.education.toLowerCase().includes(searchLower)) ||
                (doctor.specialty_name && doctor.specialty_name.toLowerCase().includes(searchLower));
            return matchSpecialty && matchSearch;
        });
    };

    getSortedDoctors = (filteredDoctors) => {
        const { sortBy } = this.state;
        return [...filteredDoctors].sort((a, b) => {
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
    };

    handleViewDetail = (doctorId) => {
        this.props.navigate(`/doctors/${doctorId}`);
    };

    render() {
        const { selectedSpecialtyName, searchTerm, selectedSpecialty, sortBy, specialties, loading } = this.state;

        if (loading) {
            return <div className={styles.loading}>Đang tải...</div>;
        }

        const filteredDoctors = this.getFilteredDoctors();
        const sortedDoctors = this.getSortedDoctors(filteredDoctors);

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
                            onChange={(e) => this.setState({ searchTerm: e.target.value })}
                        />
                    </div>

                    <div className={styles.filterRow}>
                        <div className={styles.filterItem}>
                            <label>Chuyên khoa:</label>
                            <select
                                value={selectedSpecialty}
                                onChange={(e) => this.setState({ selectedSpecialty: e.target.value })}
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
                                onChange={(e) => this.setState({ sortBy: e.target.value })}
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
                                        onClick={() => this.handleViewDetail(doctor.id)}
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
}

export default withRouter(DoctorList);
