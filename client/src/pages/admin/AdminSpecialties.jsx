import React, { Component } from 'react';
import api from '../../utils/api';
import withRouter from '../../utils/withRouter';
import DeleteConfirmModal from '../../components/admin/DeleteConfirmModal';
import styles from './AdminSpecialties.module.css';

class AdminSpecialties extends Component {
    constructor(props) {
        super(props);
        this.state = {
            specialties: [],
            loading: true,
            searchTerm: '',
            showCreateModal: false,
            showEditModal: false,
            showDeleteModal: false,
            showDetailModal: false,
            selectedSpecialty: null,
            deleting: false, // ✅ Thêm trạng thái đang xóa
            formData: {
                name: '',
                description: '',
                image: ''
            }
        };
    }

    // Lấy danh sách chuyên khoa
    fetchSpecialties = async () => {
        try {
            this.setState({ loading: true });
            const params = new URLSearchParams();
            if (this.state.searchTerm) params.append('search', this.state.searchTerm);
            const response = await api.get(`/api/admin/specialties?${params}`);
            this.setState({ specialties: response.data });
        } catch (error) {
            console.error('Error fetching specialties:', error);
            alert('Lỗi khi tải danh sách chuyên khoa');
        } finally {
            this.setState({ loading: false });
        }
    };

    componentDidMount() {
        this.fetchSpecialties();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.searchTerm !== this.state.searchTerm) {
            this.fetchSpecialties();
        }
    }

    // Xem chi tiết chuyên khoa
    handleViewDetail = async (specialty) => {
        try {
            const response = await api.get(`/api/admin/specialties/${specialty.id}`);
            this.setState({ selectedSpecialty: response.data });
            this.setState({ showDetailModal: true });
        } catch (error) {
            console.error('Error fetching specialty detail:', error);
            alert('Lỗi khi tải thông tin chuyên khoa');
        }
    };

    // Mở modal tạo mới
    handleCreate = () => {
        this.setState({
            formData: {
                name: '',
                description: '',
                image: ''
            },
            showCreateModal: true
        });
    };

    // Tạo chuyên khoa mới
    handleCreateSpecialty = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/specialties', this.state.formData);
            alert('Thêm chuyên khoa thành công');
            this.setState({ showCreateModal: false });
            this.fetchSpecialties();
        } catch (error) {
            console.error('Error creating specialty:', error);
            alert(error.response?.data?.message || 'Lỗi khi thêm chuyên khoa');
        }
    };

    // Mở modal chỉnh sửa
    handleEdit = (specialty) => {
        this.setState({
            selectedSpecialty: specialty,
            formData: {
                name: specialty.name || '',
                description: specialty.description || '',
                image: specialty.image || ''
            },
            showEditModal: true
        });
    };

    // Cập nhật chuyên khoa
    handleUpdateSpecialty = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/admin/specialties/${this.state.selectedSpecialty.id}`, this.state.formData);
            alert('Cập nhật chuyên khoa thành công');
            this.setState({ showEditModal: false });
            this.fetchSpecialties();
        } catch (error) {
            console.error('Error updating specialty:', error);
            alert(error.response?.data?.message || 'Lỗi khi cập nhật chuyên khoa');
        }
    };

    // Xóa chuyên khoa
    handleDelete = (specialty) => {
        this.setState({ selectedSpecialty: specialty });
        this.setState({ showDeleteModal: true });
    };

    confirmDelete = async () => {
        try {
            this.setState({ deleting: true });
            await api.delete(`/api/admin/specialties/${this.state.selectedSpecialty.id}`);
            alert('✅ Xóa chuyên khoa thành công');
            this.setState({ showDeleteModal: false, selectedSpecialty: null });
            this.fetchSpecialties();
        } catch (error) {
            console.error('Error deleting specialty:', error);
            alert(error.response?.data?.message || '❌ Lỗi khi xóa chuyên khoa');
        } finally {
            this.setState({ deleting: false });
        }
    };

    render() {
        const { loading, specialties, showCreateModal, showEditModal, showDeleteModal, showDetailModal, selectedSpecialty, formData, searchTerm, deleting } = this.state;

        if (loading) {
            return <div className={styles.loading}>Đang tải dữ liệu...</div>;
        }

        return (
            <div className={styles.container} >
                <div className={styles.header}>
                    <h1>Quản lý chuyên khoa</h1>
                    <p>Thêm, sửa, xóa chuyên khoa trong hệ thống</p>
                </div>

                {/* Actions */}
                <div className={styles.actions} >
                    <input
                        type="text"
                        placeholder="Tìm theo tên chuyên khoa..."
                        value={searchTerm}
                        onChange={(e) => this.setState({ searchTerm: e.target.value })}
                        className={styles.searchInput}
                    />
                    <button onClick={this.handleCreate} className={styles.btnCreate}>
                        Thêm chuyên khoa
                    </button>
                </div>

                {/* Table */}
                < div className={styles.tableContainer} >
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên chuyên khoa</th>
                                <th>Mô tả</th>
                                <th>Số bác sĩ</th>
                                <th>Số dịch vụ</th>
                                <th>Số phòng</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {specialties.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className={styles.noData}>
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                specialties.map((specialty) => (
                                    <tr key={specialty.id}>
                                        <td>{specialty.id}</td>
                                        <td className={styles.specialtyName}>{specialty.name}</td>
                                        <td className={styles.description}>
                                            {specialty.description || 'N/A'}
                                        </td>
                                        <td>
                                            <span className={styles.countBadge}>
                                                {specialty.doctorCount} bác sĩ
                                            </span>
                                        </td>
                                        <td>
                                            <span className={styles.countBadge}>
                                                {specialty.serviceCount} dịch vụ
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={styles.countBadgeLink}
                                                onClick={() => this.props.navigate(`/admin/rooms?specialty_id=${specialty.id}`)}
                                                title="Xem phòng của chuyên khoa này"
                                            >
                                                {specialty.roomCount} phòng ↗
                                            </button>
                                        </td>
                                        <td className={styles.actionButtons}>
                                            <button
                                                onClick={() => this.handleViewDetail(specialty)}
                                                className={styles.btnView}
                                                title="Xem chi tiết"
                                            >
                                                Xem
                                            </button>
                                            <button
                                                onClick={() => this.handleEdit(specialty)}
                                                className={styles.btnEdit}
                                                title="Chỉnh sửa"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => this.handleDelete(specialty)}
                                                className={styles.btnDelete}
                                                title="Xóa"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div >

                {/* Create Modal */}
                {
                    showCreateModal && (
                        <div className={styles.modalOverlay} onClick={() => this.setState({ showCreateModal: false })}>
                            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                <div className={styles.modalHeader}>
                                    <h2>Thêm chuyên khoa mới</h2>
                                    <button onClick={() => this.setState({ showCreateModal: false })} className={styles.closeBtn}>
                                        Đóng
                                    </button>
                                </div>

                                <form onSubmit={this.handleCreateSpecialty} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Tên chuyên khoa *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => this.setState(prev => ({ formData: { ...prev.formData, name: e.target.value } }))}
                                            required
                                            placeholder="VD: Nội khoa, Ngoại khoa..."
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Mô tả</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => this.setState(prev => ({ formData: { ...prev.formData, description: e.target.value } }))}
                                            rows="3"
                                            placeholder="Mô tả về chuyên khoa..."
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Hình ảnh (URL)</label>
                                        <input
                                            type="text"
                                            value={formData.image}
                                            onChange={(e) => this.setState(prev => ({ formData: { ...prev.formData, image: e.target.value } }))}
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>

                                    <div className={styles.formActions}>
                                        <button type="button" onClick={() => this.setState({ showCreateModal: false })} className={styles.btnCancel}>
                                            Hủy
                                        </button>
                                        <button type="submit" className={styles.btnSubmit}>
                                            Thêm mới
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Edit Modal */}
                {
                    showEditModal && (
                        <div className={styles.modalOverlay} onClick={() => this.setState({ showEditModal: false })}>
                            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                <div className={styles.modalHeader}>
                                    <h2>Chỉnh sửa chuyên khoa</h2>
                                    <button onClick={() => this.setState({ showEditModal: false })} className={styles.closeBtn}>
                                        Đóng
                                    </button>
                                </div>

                                <form onSubmit={this.handleUpdateSpecialty} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Tên chuyên khoa *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => this.setState(prev => ({ formData: { ...prev.formData, name: e.target.value } }))}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Mô tả</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => this.setState(prev => ({ formData: { ...prev.formData, description: e.target.value } }))}
                                            rows="3"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Hình ảnh (URL)</label>
                                        <input
                                            type="text"
                                            value={formData.image}
                                            onChange={(e) => this.setState(prev => ({ formData: { ...prev.formData, image: e.target.value } }))}
                                        />
                                    </div>

                                    <div className={styles.formActions}>
                                        <button type="button" onClick={() => this.setState({ showEditModal: false })} className={styles.btnCancel}>
                                            Hủy
                                        </button>
                                        <button type="submit" className={styles.btnSubmit}>
                                            Cập nhật
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Detail Modal */}
                {
                    showDetailModal && selectedSpecialty && (
                        <div className={styles.modalOverlay} onClick={() => this.setState({ showDetailModal: false })}>
                            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                <div className={styles.modalHeader}>
                                    <h2>Chi tiết chuyên khoa</h2>
                                    <button onClick={() => this.setState({ showDetailModal: false })} className={styles.closeBtn}>
                                        Đóng
                                    </button>
                                </div>

                                <div className={styles.detailContent}>
                                    <div className={styles.detailSection}>
                                        <h3>Thông tin chung</h3>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <strong>Tên chuyên khoa:</strong>
                                                <span>{selectedSpecialty.name}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <strong>Mô tả:</strong>
                                                <span>{selectedSpecialty.description || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.detailSection}>
                                        <h3>Bác sĩ ({selectedSpecialty.doctors?.length || 0})</h3>
                                        {selectedSpecialty.doctors && selectedSpecialty.doctors.length > 0 ? (
                                            <div className={styles.listItems}>
                                                {selectedSpecialty.doctors.map((doctor) => (
                                                    <div key={doctor.id} className={styles.listItem}>
                                                        <span>{doctor.full_name}</span>
                                                        <span className={doctor.is_active ? styles.statusActive : styles.statusInactive}>
                                                            {doctor.is_active ? 'Hoạt động' : 'Đã khóa'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={styles.noData}>Chưa có bác sĩ</p>
                                        )}
                                    </div>

                                    <div className={styles.detailSection}>
                                        <h3>Dịch vụ ({selectedSpecialty.services?.length || 0})</h3>
                                        {selectedSpecialty.services && selectedSpecialty.services.length > 0 ? (
                                            <div className={styles.listItems}>
                                                {selectedSpecialty.services.map((service) => (
                                                    <div key={service.id} className={styles.listItem}>
                                                        <span>{service.name}</span>
                                                        <span className={styles.price}>
                                                            {service.price?.toLocaleString('vi-VN')} đ
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={styles.noData}>Chưa có dịch vụ</p>
                                        )}
                                    </div>

                                    <div className={styles.detailSection}>
                                        <div className={styles.detailSectionHeader}>
                                            <h3>Phòng khám ({selectedSpecialty.rooms?.length || 0})</h3>
                                            <button
                                                className={styles.btnViewRooms}
                                                onClick={() => { this.setState({ showDetailModal: false }); this.props.navigate(`/admin/rooms?specialty_id=${this.state.selectedSpecialty.id}`); }}
                                            >
                                                Quản lý phòng ↗
                                            </button>
                                        </div>
                                        {selectedSpecialty.rooms && selectedSpecialty.rooms.length > 0 ? (
                                            <div className={styles.listItems}>
                                                {selectedSpecialty.rooms.map((room) => (
                                                    <div key={room.id} className={styles.listItem}>
                                                        <span>{room.room_number ? `P${room.room_number}` : `#${room.id}`} — {room.name}</span>
                                                        <span className={room.status === 'active' ? styles.statusActive : styles.statusInactive}>
                                                            {room.status === 'active' ? 'Hoạt động' : room.status === 'maintenance' ? 'Bảo trì' : 'Tạm đóng'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={styles.noData}>Chưa có phòng khám nào thuộc chuyên khoa này</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* ✅ Delete Modal - Component mới */}
                <DeleteConfirmModal
                    show={showDeleteModal && selectedSpecialty}
                    onClose={() => this.setState({ showDeleteModal: false, selectedSpecialty: null })}
                    onConfirm={this.confirmDelete}
                    title="Xác nhận xóa chuyên khoa"
                    itemName={selectedSpecialty?.name}
                    itemType="chuyên khoa"
                    warningMessage={
                        selectedSpecialty && (selectedSpecialty.doctorCount > 0 || selectedSpecialty.serviceCount > 0)
                            ? `Chuyên khoa này có ${selectedSpecialty.doctorCount} bác sĩ và ${selectedSpecialty.serviceCount} dịch vụ! Xóa sẽ gỡ liên kết ${selectedSpecialty.roomCount || 0} phòng khám (phòng không bị xóa).`
                            : null
                    }
                    loading={deleting}
                />
            </div >
        );
    }
}

export default withRouter(AdminSpecialties);
