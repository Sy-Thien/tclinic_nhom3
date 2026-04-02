import React, { Component } from 'react';
import api from '../../utils/api';
import withRouter from '../../utils/withRouter';
import styles from './DoctorList.module.css';

class DoctorList extends Component {
    constructor(props) {
        super(props);
        const { searchParams } = this.props;
        this.state = {
            doctors: [],
            specialties: [],
            loading: true,
            filters: {
                specialty_id: searchParams.get('specialty') || '',
                search: searchParams.get('search') || '',
                sort: searchParams.get('sort') || 'name'
            }
        };
    }

    componentDidMount() {
        this.fetchSpecialties();
        this.fetchDoctors();
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevState.filters.specialty_id !== this.state.filters.specialty_id ||
            prevState.filters.search !== this.state.filters.search ||
            prevState.filters.sort !== this.state.filters.sort
        ) {
            this.fetchDoctors();
        }
    }

    fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            this.setState({ specialties: response.data });
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    fetchDoctors = async () => {
        try {
            this.setState({ loading: true });
            const { filters } = this.state;
            const params = {};
            if (filters.specialty_id) params.specialty_id = filters.specialty_id;
            if (filters.search) params.search = filters.search;
            if (filters.sort) params.sort = filters.sort;

            const response = await api.get('/api/public/doctors', { params });
            this.setState({ doctors: response.data });
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    handleFilterChange = (key, value) => {
        const { setSearchParams } = this.props;
        this.setState(prevState => {
            const newFilters = { ...prevState.filters, [key]: value };
            const params = new URLSearchParams();
            if (newFilters.specialty_id) params.set('specialty', newFilters.specialty_id);
            if (newFilters.search) params.set('search', newFilters.search);
            if (newFilters.sort && newFilters.sort !== 'name') params.set('sort', newFilters.sort);
            setSearchParams(params);
            return { filters: newFilters };
        });
    };

    handleClearFilters = () => {
        const { setSearchParams } = this.props;
        this.setState({ filters: { specialty_id: '', search: '', sort: 'name' } });
        setSearchParams(new URLSearchParams());
    };

    render() {
        const { doctors, specialties, loading, filters } = this.state;
        const { navigate } = this.props;

        return (
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <h1>Đội ngũ Bác sĩ</h1>
                    <p>Các bác sĩ giàu kinh nghiệm, tận tâm với bệnh nhân</p>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <input
                            type="text"
                            placeholder="Tìm bác sĩ..."
                            value={filters.search}
                            onChange={(e) => this.handleFilterChange('search', e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.selectInput}
                            value={filters.specialty_id}
                            onChange={(e) => this.handleFilterChange('specialty_id', e.target.value)}
                        >
                            <option value="">Tất cả chuyên khoa</option>
                            {specialties.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.selectInput}
                            value={filters.sort}
                            onChange={(e) => this.handleFilterChange('sort', e.target.value)}
                        >
                            <option value="name">Tên A-Z</option>
                            <option value="experience">Kinh nghiệm</option>
                            <option value="rating">Đánh giá cao</option>
                        </select>
                    </div>
                    {(filters.specialty_id || filters.search) && (
                        <button className={styles.btnClear} onClick={this.handleClearFilters}>
                            Xóa lọc
                        </button>
                    )}
                </div>

                {/* Results */}
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Đang tải...</p>
                    </div>
                ) : doctors.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <h3>Không tìm thấy bác sĩ</h3>
                        <p>Thử thay đổi bộ lọc</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.results}>
                            <p className={styles.resultCount}>
                                Tìm thấy <strong>{doctors.length}</strong> bác sĩ
                            </p>
                        </div>
                        <div className={styles.doctorGrid}>
                            {doctors.map(doctor => (
                                <div key={doctor.id} className={styles.doctorCard}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.avatar}>
                                            {doctor.avatar ? (
                                                <img src={doctor.avatar} alt={doctor.full_name} />
                                            ) : (
                                                <div className={styles.avatarPlaceholder}>
                                                    {doctor.full_name?.charAt(0) || 'B'}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.badges}>
                                            <span className={styles.badge}>
                                                {doctor.specialty?.name || 'Đa khoa'}
                                            </span>
                                            {doctor.average_rating > 0 && (
                                                <span className={styles.rating}>
                                                    ⭐ {parseFloat(doctor.average_rating).toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <h3 className={styles.doctorName}>{doctor.full_name}</h3>
                                        {doctor.experience_years > 0 && (
                                            <p className={styles.experience}>
                                                {doctor.experience_years} năm kinh nghiệm
                                            </p>
                                        )}
                                        {doctor.description && (
                                            <p className={styles.doctorDesc}>{doctor.description}</p>
                                        )}
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <button
                                            className={styles.btnViewDetail}
                                            onClick={() => navigate(`/doctors/${doctor.id}`)}
                                        >
                                            Chi tiết
                                        </button>
                                        <button
                                            className={styles.btnBooking}
                                            onClick={() => navigate(`/booking?doctor=${doctor.id}`)}
                                        >
                                            Đặt lịch
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }
}

export default withRouter(DoctorList);
