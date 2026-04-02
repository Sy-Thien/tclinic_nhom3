import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './DoctorPatients.module.css';

class DoctorPatients extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            patients: [],
            filteredPatients: [],
            searchTerm: '',
            currentPage: 1
        };
        this.itemsPerPage = 10;
    }

    componentDidMount() {
        this.fetchMyPatients();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.searchTerm !== this.state.searchTerm || prevState.patients !== this.state.patients) {
            this.filterPatients();
        }
    }

    fetchMyPatients = async () => {
        try {
            this.setState({ loading: true });
            const response = await api.get('/api/doctor/appointments/my-patients');
            const patientList = response.data.patients || [];

            this.setState({
                patients: patientList,
                filteredPatients: patientList
            });
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            this.setState({ loading: false });
        }
    };

    filterPatients = () => {
        const { searchTerm, patients } = this.state;
        if (!searchTerm.trim()) {
            this.setState({ filteredPatients: patients });
            return;
        }

        const search = searchTerm.toLowerCase();
        const filtered = patients.filter(p =>
            p.full_name?.toLowerCase().includes(search) ||
            p.phone?.includes(search) ||
            p.email?.toLowerCase().includes(search)
        );
        this.setState({ filteredPatients: filtered, currentPage: 1 });
    };

    formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN');
    };

    calculateAge = (birthday) => {
        if (!birthday) return '';
        const birth = new Date(birthday);
        const age = new Date().getFullYear() - birth.getFullYear();
        return `${age} tuổi`;
    };

    getGenderText = (gender) => {
        if (gender === 'male') return 'Nam';
        if (gender === 'female') return 'Nữ';
        return 'Khác';
    };

    render() {
        const { navigate } = this.props;
        const { loading, patients, filteredPatients, searchTerm, currentPage } = this.state;

        // Pagination
        const totalPages = Math.ceil(filteredPatients.length / this.itemsPerPage);
        const startIndex = (currentPage - 1) * this.itemsPerPage;
        const currentPatients = filteredPatients.slice(startIndex, startIndex + this.itemsPerPage);

        if (loading) {
            return (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải danh sách bệnh nhân...</p>
                </div>
            );
        }

        return (
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1>Bệnh Nhân Của Tôi</h1>
                        <p className={styles.subtitle}>
                            Danh sách bệnh nhân đã từng khám với bạn • Tổng: {patients.length} bệnh nhân
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className={styles.searchSection}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm theo tên, số điện thoại hoặc email..."
                            value={searchTerm}
                            onChange={(e) => this.setState({ searchTerm: e.target.value })}
                        />
                        {searchTerm && (
                            <button
                                className={styles.clearBtn}
                                onClick={() => this.setState({ searchTerm: '' })}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    <div className={styles.resultCount}>
                        Hiển thị {filteredPatients.length} kết quả
                    </div>
                </div>

                {/* Patients List */}
                {filteredPatients.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📭</div>
                        <h3>Không tìm thấy bệnh nhân</h3>
                        <p>
                            {searchTerm
                                ? 'Thử tìm với từ khóa khác'
                                : 'Bạn chưa có lịch sử khám bệnh nhân nào'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={styles.patientsList}>
                            {currentPatients.map(patient => (
                                <div key={patient.id} className={styles.patientCard}>
                                    <div className={styles.patientAvatar}>
                                        <span>{patient.full_name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className={styles.patientInfo}>
                                        <h3 className={styles.patientName}>{patient.full_name}</h3>
                                        <div className={styles.patientMeta}>
                                            {patient.gender && (
                                                <span>{this.getGenderText(patient.gender)}</span>
                                            )}
                                            {patient.birthday && (
                                                <span>{this.calculateAge(patient.birthday)}</span>
                                            )}
                                            {patient.phone && (
                                                <span>{patient.phone}</span>
                                            )}
                                        </div>
                                        <div className={styles.patientVisits}>
                                            <span className={styles.visitBadge}>
                                                {patient.visitCount} lần khám
                                            </span>
                                            <span className={styles.lastVisit}>
                                                Gần nhất: {this.formatDate(patient.lastVisit)}
                                            </span>
                                        </div>
                                        {patient.lastDiagnosis && (
                                            <div className={styles.lastDiagnosis}>
                                                {patient.lastDiagnosis.substring(0, 60)}
                                                {patient.lastDiagnosis.length > 60 && '...'}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.patientActions}>
                                        <button
                                            className={styles.viewHistoryBtn}
                                            onClick={() => navigate(`/doctor-portal/patient-history/${patient.id}`)}
                                        >
                                            Xem hồ sơ
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    disabled={currentPage === 1}
                                    onClick={() => this.setState({ currentPage: currentPage - 1 })}
                                >
                                    ← Trước
                                </button>
                                <div className={styles.pageNumbers}>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page =>
                                            page === 1 ||
                                            page === totalPages ||
                                            Math.abs(page - currentPage) <= 2
                                        )
                                        .map((page, index, arr) => {
                                            const prevPage = arr[index - 1];
                                            const showEllipsis = prevPage && page - prevPage > 1;

                                            return (
                                                <span key={page}>
                                                    {showEllipsis && <span className={styles.ellipsis}>...</span>}
                                                    <button
                                                        className={`${styles.pageNum} ${currentPage === page ? styles.active : ''}`}
                                                        onClick={() => this.setState({ currentPage: page })}
                                                    >
                                                        {page}
                                                    </button>
                                                </span>
                                            );
                                        })}
                                </div>
                                <button
                                    className={styles.pageBtn}
                                    disabled={currentPage === totalPages}
                                    onClick={() => this.setState({ currentPage: currentPage + 1 })}
                                >
                                    Sau →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }
}

export default withRouter(DoctorPatients);
