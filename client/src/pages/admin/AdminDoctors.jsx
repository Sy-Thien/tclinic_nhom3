import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './AdminDoctors.module.css';

class AdminDoctors extends Component {
    constructor(props) {
        super(props);
        this.state = {
            doctors: [],
            specialties: [],
            loading: false,
            showModal: false,
            modalMode: null, // 'add', 'edit', 'view', 'delete', 'toggle'
            selectedDoctor: null,
            formData: {
                email: '',
                password: '',
                full_name: '',
                phone: '',
                gender: 'male',
                specialty_id: '',
                experience: '',
                education: '',
                description: ''
            },
            filters: {
                search: '',
                specialty_id: '',
                status: 'all'
            }
        };
    }

    componentDidMount() {
        this.fetchDoctors();
        this.fetchSpecialties();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.filters !== this.state.filters) {
            this.fetchDoctors();
            this.fetchSpecialties();
        }
    }

    fetchDoctors = async () => {
        try {
            this.setState({ loading: true });
            const params = new URLSearchParams();
            if (this.state.filters.search) params.append('search', this.state.filters.search);
            if (this.state.filters.specialty_id) params.append('specialty_id', this.state.filters.specialty_id);
            if (this.state.filters.status !== 'all') params.append('status', this.state.filters.status);

            const response = await api.get(`/api/admin/doctors?${params}`);
            this.setState({ doctors: response.data });
        } catch (error) {
            console.error('Error fetching doctors:', error);
            alert('Lỗi khi tải danh sách bác sĩ');
        } finally {
            this.setState({ loading: false });
        }
    };

    fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            this.setState({ specialties: response.data });
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    handleOpenModal = (mode, doctor = null) => {
        if (doctor) {
            this.setState({
                selectedDoctor: doctor,
                formData: {
                    email: doctor.email,
                    password: '',
                    full_name: doctor.full_name,
                    phone: doctor.phone,
                    gender: doctor.gender,
                    specialty_id: doctor.specialty_id || '',
                    experience: doctor.experience || '',
                    education: doctor.education || '',
                    description: doctor.description || ''
                }
            });
        } else {
            this.setState({
                selectedDoctor: null,
                formData: {
                    email: '',
                    password: '',
                    full_name: '',
                    phone: '',
                    gender: 'male',
                    specialty_id: '',
                    experience: '',
                    education: '',
                    description: ''
                }
            });
        }
        this.setState({ showModal: true, modalMode: mode });
    };

    handleCloseModal = () => {
        this.setState({ showModal: false, modalMode: null, selectedDoctor: null });
    };

    getModalTitle = () => {
        const { modalMode, selectedDoctor } = this.state;
        switch (modalMode) {
            case 'add': return 'Thêm bác sĩ mới';
            case 'edit': return 'Sửa thông tin bác sĩ';
            case 'view': return 'Chi tiết bác sĩ';
            case 'delete': return 'Xác nhận xóa';
            case 'toggle': return selectedDoctor?.is_active ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa';
            default: return '';
        }
    };

    getModalHeaderClass = () => {
        const { modalMode, selectedDoctor } = this.state;
        switch (modalMode) {
            case 'delete': return `${styles.modalHeader} ${styles.modalHeaderDanger}`;
            case 'toggle':
                return selectedDoctor?.is_active
                    ? `${styles.modalHeader} ${styles.modalHeaderWarning}`
                    : `${styles.modalHeader} ${styles.modalHeaderSuccess}`;
            default: return styles.modalHeader;
        }
    };

    handleChange = (e) => {
        const { name, value } = e.target;
        this.setState(prev => ({ formData: { ...prev.formData, [name]: value } }));
    };

    handleFilterChange = (e) => {
        const { name, value } = e.target;
        this.setState(prev => ({ filters: { ...prev.filters, [name]: value } }));
    };

    handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!this.state.formData.email || !this.state.formData.full_name || !this.state.formData.phone) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        if (!this.state.selectedDoctor && !this.state.formData.password) {
            alert('Vui lòng nhập mật khẩu cho bác sĩ mới');
            return;
        }

        try {
            this.setState({ loading: true });
            if (this.state.selectedDoctor) {
                // Update
                await api.put(`/api/admin/doctors/${this.state.selectedDoctor.id}`, this.state.formData);
                alert('Cập nhật thông tin bác sĩ thành công!');
            } else {
                // Create
                await api.post('/api/admin/doctors', this.state.formData);
                alert('Thêm bác sĩ mới thành công!');
            }
            this.handleCloseModal();
            this.fetchDoctors();
        } catch (error) {
            console.error('Error saving doctor:', error);
            alert(error.response?.data?.message || 'Lỗi khi lưu thông tin bác sĩ');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleDeleteConfirm = (doctor) => {
        this.handleOpenModal('delete', doctor);
    };

    handleDelete = async () => {
        try {
            this.setState({ loading: true });
            await api.delete(`/api/admin/doctors/${this.state.selectedDoctor.id}`);
            alert('Xóa bác sĩ thành công!');
            this.handleCloseModal();
            this.fetchDoctors();
        } catch (error) {
            console.error('Error deleting doctor:', error);
            alert(error.response?.data?.message || 'Lỗi khi xóa bác sĩ');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleToggleConfirm = (doctor) => {
        this.handleOpenModal('toggle', doctor);
    };

    handleToggleStatus = async () => {
        const { selectedDoctor } = this.state;
        try {
            this.setState({ loading: true });
            await api.put(`/api/admin/doctors/${selectedDoctor.id}/toggle-status`);
            alert(`${selectedDoctor.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'} tài khoản thành công!`);
            this.handleCloseModal();
            this.fetchDoctors();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('Lỗi khi thay đổi trạng thái');
        } finally {
            this.setState({ loading: false });
        }
    };

    render() {
        const { doctors, specialties, loading, showModal, modalMode, selectedDoctor, formData, filters } = this.state;

        return (
            <div className={styles.container} >
                <div className={styles.header}>
                    <h1>Quản lý Bác sĩ</h1>
                    <button className={styles.btnAdd} onClick={() => this.handleOpenModal('add')}>
                        Thêm bác sĩ
                    </button>
                </div>

                {/* Filters */}
                <div className={styles.filters} >
                    <input
                        type="text"
                        name="search"
                        placeholder="Tìm kiếm (tên, email, số điện thoại)..."
                        value={this.state.filters.search}
                        onChange={this.handleFilterChange}
                        className={styles.searchInput}
                    />
                    <select
                        name="specialty_id"
                        value={this.state.filters.specialty_id}
                        onChange={this.handleFilterChange}
                        className={styles.filterSelect}
                    >
                        <option value="">-- Tất cả chuyên khoa --</option>
                        {this.state.specialties.map(sp => (
                            <option key={sp.id} value={sp.id}>{sp.name}</option>
                        ))}
                    </select>
                    <select
                        name="status"
                        value={this.state.filters.status}
                        onChange={this.handleFilterChange}
                        className={styles.filterSelect}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Đã vô hiệu hóa</option>
                    </select>
                </div>

                {/* Table */}
                {loading && <div className={styles.loading}>Đang tải...</div>}

                {
                    !loading && doctors.length === 0 && (
                        <div className={styles.noData}>Không có dữ liệu</div>
                    )
                }

                {
                    !loading && doctors.length > 0 && (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Họ tên</th>
                                        <th>Email</th>
                                        <th>Số điện thoại</th>
                                        <th>Giới tính</th>
                                        <th>Chuyên khoa</th>
                                        <th>Kinh nghiệm</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctors.map(doctor => (
                                        <tr key={doctor.id}>
                                            <td>{doctor.id}</td>
                                            <td>
                                                <div className={styles.doctorName}>
                                                    {doctor.full_name}
                                                </div>
                                            </td>
                                            <td>{doctor.email}</td>
                                            <td>{doctor.phone}</td>
                                            <td>
                                                {doctor.gender === 'male' ? 'Nam' :
                                                    doctor.gender === 'female' ? 'Nữ' : 'Khác'}
                                            </td>
                                            <td>{doctor.specialty?.name || 'Chưa có'}</td>
                                            <td>{doctor.experience || 'Chưa cập nhật'}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${doctor.is_active ? styles.active : styles.inactive}`}>
                                                    {doctor.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        className={styles.btnView}
                                                        onClick={() => this.handleOpenModal('view', doctor)}
                                                        title="Xem"
                                                    >
                                                        Xem
                                                    </button>
                                                    <button
                                                        className={styles.btnEdit}
                                                        onClick={() => this.handleOpenModal('edit', doctor)}
                                                        title="Sửa"
                                                    >
                                                        Sửa
                                                    </button>
                                                    <button
                                                        className={styles.btnToggle}
                                                        onClick={() => this.handleToggleConfirm(doctor)}
                                                        title={doctor.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                                    >
                                                        {doctor.is_active ? 'Khóa' : 'Mở'}
                                                    </button>
                                                    <button
                                                        className={styles.btnDelete}
                                                        onClick={() => this.handleDeleteConfirm(doctor)}
                                                        title="Xóa"
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }

                {/* Unified Modal */}
                {
                    showModal && (
                        <div className={styles.modalOverlay} onClick={this.handleCloseModal}>
                            <div className={modalMode === 'delete' || modalMode === 'toggle' ? styles.modalSmall : styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                <div className={this.getModalHeaderClass()}>
                                    <h2>{this.getModalTitle()}</h2>
                                    <button className={styles.btnClose} onClick={this.handleCloseModal}>×</button>
                                </div>

                                {/* View Mode */}
                                {modalMode === 'view' && selectedDoctor && (
                                    <div className={styles.modalBody}>
                                        <div className={styles.viewGrid}>
                                            <div className={styles.viewItem}>
                                                <label>Email</label>
                                                <span>{selectedDoctor.email}</span>
                                            </div>
                                            <div className={styles.viewItem}>
                                                <label>Họ tên</label>
                                                <span>{selectedDoctor.full_name}</span>
                                            </div>
                                            <div className={styles.viewItem}>
                                                <label>Số điện thoại</label>
                                                <span>{selectedDoctor.phone}</span>
                                            </div>
                                            <div className={styles.viewItem}>
                                                <label>Giới tính</label>
                                                <span>{selectedDoctor.gender === 'male' ? 'Nam' : selectedDoctor.gender === 'female' ? 'Nữ' : 'Khác'}</span>
                                            </div>
                                            <div className={styles.viewItem}>
                                                <label>Chuyên khoa</label>
                                                <span>{selectedDoctor.specialty?.name || 'Chưa có'}</span>
                                            </div>
                                            <div className={styles.viewItem}>
                                                <label>Kinh nghiệm</label>
                                                <span>{selectedDoctor.experience || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className={styles.viewItem}>
                                                <label>Học vấn</label>
                                                <span>{selectedDoctor.education || 'Chưa cập nhật'}</span>
                                            </div>
                                            <div className={styles.viewItem}>
                                                <label>Trạng thái</label>
                                                <span className={`${styles.statusBadge} ${selectedDoctor.is_active ? styles.active : styles.inactive}`}>
                                                    {selectedDoctor.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                                </span>
                                            </div>
                                            <div className={`${styles.viewItem} ${styles.viewItemFull}`}>
                                                <label>Mô tả</label>
                                                <span>{selectedDoctor.description || 'Chưa có mô tả'}</span>
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button type="button" className={styles.btnCancel} onClick={this.handleCloseModal}>
                                                Đóng
                                            </button>
                                            <button type="button" className={styles.btnSubmit} onClick={() => this.setState({ modalMode: 'edit' })}>
                                                Chỉnh sửa
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Add/Edit Mode */}
                                {(modalMode === 'add' || modalMode === 'edit') && (
                                    <form onSubmit={this.handleSubmit} className={styles.form}>
                                        <div className={styles.formGrid}>
                                            <div className={styles.formGroup}>
                                                <label>Email <span className={styles.required}>*</span></label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={this.handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>
                                                    Mật khẩu {modalMode === 'add' && <span className={styles.required}>*</span>}
                                                    {modalMode === 'edit' && <small> (để trống nếu không đổi)</small>}
                                                </label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={this.handleChange}
                                                    required={modalMode === 'add'}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Họ tên <span className={styles.required}>*</span></label>
                                                <input
                                                    type="text"
                                                    name="full_name"
                                                    value={formData.full_name}
                                                    onChange={this.handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Số điện thoại <span className={styles.required}>*</span></label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={this.handleChange}
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Giới tính</label>
                                                <select name="gender" value={formData.gender} onChange={this.handleChange}>
                                                    <option value="male">Nam</option>
                                                    <option value="female">Nữ</option>
                                                    <option value="other">Khác</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Chuyên khoa</label>
                                                <select name="specialty_id" value={formData.specialty_id} onChange={this.handleChange}>
                                                    <option value="">-- Chọn chuyên khoa --</option>
                                                    {specialties.map(sp => (
                                                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Kinh nghiệm</label>
                                                <input
                                                    type="text"
                                                    name="experience"
                                                    value={formData.experience}
                                                    onChange={this.handleChange}
                                                    placeholder="VD: 10 năm kinh nghiệm"
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Học vấn</label>
                                                <input
                                                    type="text"
                                                    name="education"
                                                    value={formData.education}
                                                    onChange={this.handleChange}
                                                    placeholder="VD: Bác sĩ ĐH Y Hà Nội"
                                                />
                                            </div>
                                            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                                <label>Mô tả</label>
                                                <textarea
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={this.handleChange}
                                                    rows={4}
                                                    placeholder="Giới thiệu về bác sĩ..."
                                                />
                                            </div>
                                        </div>
                                        <div className={styles.formActions}>
                                            <button type="button" className={styles.btnCancel} onClick={this.handleCloseModal}>
                                                Hủy
                                            </button>
                                            <button type="submit" className={styles.btnSubmit} disabled={loading}>
                                                {loading ? 'Đang xử lý...' : modalMode === 'edit' ? 'Cập nhật' : 'Thêm mới'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Delete Confirmation */}
                                {modalMode === 'delete' && selectedDoctor && (
                                    <div className={styles.modalBody}>
                                        <p className={styles.confirmText}>
                                            Bạn có chắc chắn muốn xóa bác sĩ <strong>{selectedDoctor.full_name}</strong>?
                                        </p>
                                        <p className={styles.warningText}>Hành động này không thể hoàn tác.</p>
                                        <div className={styles.formActions}>
                                            <button type="button" className={styles.btnCancel} onClick={this.handleCloseModal}>
                                                Hủy
                                            </button>
                                            <button type="button" className={styles.btnDanger} onClick={this.handleDelete} disabled={loading}>
                                                {loading ? 'Đang xóa...' : 'Xóa'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Toggle Status Confirmation */}
                                {modalMode === 'toggle' && selectedDoctor && (
                                    <div className={styles.modalBody}>
                                        <p className={styles.confirmText}>
                                            Bạn có chắc chắn muốn {selectedDoctor.is_active ? 'khóa' : 'mở khóa'} tài khoản bác sĩ <strong>{selectedDoctor.full_name}</strong>?
                                        </p>
                                        {selectedDoctor.is_active && (
                                            <p className={styles.warningText}>Bác sĩ sẽ không thể đăng nhập khi tài khoản bị khóa.</p>
                                        )}
                                        <div className={styles.formActions}>
                                            <button type="button" className={styles.btnCancel} onClick={this.handleCloseModal}>
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                className={selectedDoctor.is_active ? styles.btnWarning : styles.btnSuccess}
                                                onClick={this.handleToggleStatus}
                                                disabled={loading}
                                            >
                                                {loading ? 'Đang xử lý...' : selectedDoctor.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }
}

export default AdminDoctors;
