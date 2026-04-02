import { Component } from 'react';
import { Link } from 'react-router-dom';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './AdminRooms.module.css';

class AdminRooms extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rooms: [],
            specialties: [],
            loading: true,
            searchTerm: '',
            filterFloor: '',
            // Pre-fill specialty filter from URL param (?specialty_id=X)
            filterSpecialty: new URLSearchParams(props.location.search).get('specialty_id') || '',
            filterStatus: '',
            viewMode: 'floor', // 'floor' | 'list'
            stats: null,
            // Modals
            showCreateModal: false,
            showEditModal: false,
            showDeleteModal: false,
            selectedRoom: null,
            // Form data
            formData: {
                name: '',
                room_number: '',
                floor: 1,
                specialty_id: '',
                location: '',
                status: 'active',
                capacity: 1,
                description: ''
            }
        };
    }

    componentDidMount() {
        this.fetchRooms();
        this.fetchSpecialties();
        this.fetchStats();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.searchTerm !== this.state.searchTerm ||
            prevState.filterFloor !== this.state.filterFloor ||
            prevState.filterSpecialty !== this.state.filterSpecialty ||
            prevState.filterStatus !== this.state.filterStatus) {
            this.fetchRooms();
            this.fetchSpecialties();
            this.fetchStats();
        }
    }

    // Lấy danh sách phòng khám
    fetchRooms = async () => {
        try {
            this.setState({ loading: true });
            const params = new URLSearchParams();
            if (this.state.searchTerm) params.append('search', this.state.searchTerm);
            if (this.state.filterFloor) params.append('floor', this.state.filterFloor);
            if (this.state.filterSpecialty) params.append('specialty_id', this.state.filterSpecialty);
            if (this.state.filterStatus) params.append('status', this.state.filterStatus);

            const response = await api.get(`/api/admin/rooms?${params}`);
            this.setState({ rooms: response.data });
        } catch (error) {
            console.error('Error fetching rooms:', error);
            alert('Lỗi khi tải danh sách phòng khám');
        } finally {
            this.setState({ loading: false });
        }
    };

    // Lấy danh sách chuyên khoa
    fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/admin/specialties');
            this.setState({ specialties: response.data });
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    // Lấy thống kê
    fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/rooms/stats');
            this.setState({ stats: response.data });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Mở modal tạo mới
    handleCreate = (presetFloor = null) => {
        this.setState({
            formData: {
                name: '',
                room_number: '',
                floor: presetFloor || 1,
                specialty_id: '',
                location: '',
                status: 'active',
                capacity: 1,
                description: ''
            },
            showCreateModal: true
        });
    };

    // Tạo phòng khám mới
    handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/rooms', this.state.formData);
            alert('Thêm phòng khám thành công');
            this.setState({ showCreateModal: false });
            this.fetchRooms();
            this.fetchStats();
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Lỗi khi thêm phòng khám'));
        }
    };

    // Mở modal chỉnh sửa
    handleEdit = (room) => {
        this.setState({
            selectedRoom: room,
            formData: {
                name: room.name || '',
                room_number: room.room_number || '',
                floor: room.floor || 1,
                specialty_id: room.specialty_id || '',
                location: room.location || '',
                status: room.status || 'active',
                capacity: room.capacity || 1,
                description: room.description || ''
            },
            showEditModal: true
        });
    };

    // Cập nhật phòng khám
    handleUpdateRoom = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/admin/rooms/${this.state.selectedRoom.id}`, this.state.formData);
            alert('Cập nhật phòng khám thành công');
            this.setState({ showEditModal: false });
            this.fetchRooms();
            this.fetchStats();
        } catch (error) {
            console.error('Error updating room:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Lỗi khi cập nhật phòng khám'));
        }
    };

    // Xóa phòng khám
    handleDelete = (room) => {
        this.setState({ selectedRoom: room, showDeleteModal: true });
    };

    confirmDelete = async () => {
        try {
            await api.delete(`/api/admin/rooms/${this.state.selectedRoom.id}`);
            alert('Xóa phòng khám thành công');
            this.setState({ showDeleteModal: false });
            this.fetchRooms();
            this.fetchStats();
        } catch (error) {
            console.error('Error deleting room:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Lỗi khi xóa phòng khám'));
        }
    };

    // Status badge
    getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className={`${styles.badge} ${styles.active}`}>Hoạt động</span>;
            case 'inactive':
                return <span className={`${styles.badge} ${styles.inactive}`}>Tạm đóng</span>;
            case 'maintenance':
                return <span className={`${styles.badge} ${styles.maintenance}`}>Bảo trì</span>;
            default:
                return <span className={styles.badge}>{status}</span>;
        }
    };

    // Get specialty color
    getSpecialtyColor = (specialtyId) => {
        const colors = [
            '#3b82f6', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
            '#ffecd2', '#a8edea', '#d299c2', '#89f7fe', '#cd9cf2'
        ];
        return colors[specialtyId % colors.length];
    };

    render() {
        const { navigate } = this.props;
        const { rooms, specialties, loading, searchTerm, filterFloor, filterSpecialty, filterStatus, viewMode, stats, showCreateModal, showEditModal, showDeleteModal, selectedRoom, formData } = this.state;

        // Nhóm phòng theo tầng
        const roomsByFloor = rooms.reduce((acc, room) => {
            const floor = room.floor || 0;
            if (!acc[floor]) acc[floor] = [];
            acc[floor].push(room);
            return acc;
        }, {});

        if (loading && rooms.length === 0) {
            return <div className={styles.loading}>Đang tải dữ liệu...</div>;
        }

        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1>Quản Lý Phòng Khám</h1>
                        <p>Quản lý phòng khám theo tầng và chuyên khoa</p>
                    </div>
                    <button onClick={() => this.handleCreate()} className={styles.btnCreate}>
                        Thêm phòng khám
                    </button>
                </div>

                {/* Specialty breadcrumb when filtering by specialty */}
                {filterSpecialty && (() => {
                    const spec = specialties.find(s => String(s.id) === String(filterSpecialty));
                    return spec ? (
                        <div className={styles.specialtyBreadcrumb}>
                            <span>📋 Đang xem phòng của chuyên khoa: <strong>{spec.name}</strong> ({rooms.length} phòng)</span>
                            <button className={styles.clearFilterBtn} onClick={() => { this.setState({ filterSpecialty: '' }); this.props.navigate('/admin/rooms'); }}>
                                ✕ Bỏ lọc
                            </button>
                        </div>
                    ) : null;
                })()}

                {/* Stats Cards */}
                {stats && (
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>Tổng</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statNumber}>{stats.total}</span>
                                <span className={styles.statLabel}>Tổng phòng</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.success}`}>
                            <div className={styles.statIcon}>HĐ</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statNumber}>{stats.byStatus?.active || 0}</span>
                                <span className={styles.statLabel}>Đang hoạt động</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.warning}`}>
                            <div className={styles.statIcon}>BT</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statNumber}>{stats.byStatus?.maintenance || 0}</span>
                                <span className={styles.statLabel}>Đang bảo trì</span>
                            </div>
                        </div>
                        <div className={`${styles.statCard} ${styles.danger}`}>
                            <div className={styles.statIcon}>Đ</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statNumber}>{stats.byStatus?.inactive || 0}</span>
                                <span className={styles.statLabel}>Tạm đóng</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className={styles.filters}>
                    <input
                        type="text"
                        placeholder="Tìm phòng khám..."
                        value={searchTerm}
                        onChange={(e) => this.setState({ searchTerm: e.target.value })}
                        className={styles.searchInput}
                    />

                    <select
                        value={filterFloor}
                        onChange={(e) => this.setState({ filterFloor: e.target.value })}
                        className={styles.filterSelect}
                    >
                        <option value="">Tất cả tầng</option>
                        {[1, 2, 3, 4, 5].map(f => (
                            <option key={f} value={f}>Tầng {f}</option>
                        ))}
                    </select>

                    <select
                        value={filterSpecialty}
                        onChange={(e) => this.setState({ filterSpecialty: e.target.value })}
                        className={styles.filterSelect}
                    >
                        <option value="">Tất cả chuyên khoa</option>
                        {specialties.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => this.setState({ filterStatus: e.target.value })}
                        className={styles.filterSelect}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="maintenance">Bảo trì</option>
                        <option value="inactive">Tạm đóng</option>
                    </select>

                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'floor' ? styles.active : ''}`}
                            onClick={() => this.setState({ viewMode: 'floor' })}
                        >
                            Theo tầng
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                            onClick={() => this.setState({ viewMode: 'list' })}
                        >
                            Danh sách
                        </button>
                    </div>
                </div>

                {/* Content */}
                {rooms.length === 0 ? (
                    <div className={styles.noData}>
                        <span className={styles.noDataIcon}>Phòng</span>
                        <p>Chưa có phòng khám nào</p>
                        <button onClick={() => this.handleCreate()} className={styles.btnCreate}>
                            Thêm phòng khám đầu tiên
                        </button>
                    </div>
                ) : viewMode === 'floor' ? (
                    /* Floor View */
                    <div className={styles.floorView}>
                        {Object.keys(roomsByFloor).sort((a, b) => a - b).map(floor => (
                            <div key={floor} className={styles.floorSection}>
                                <div className={styles.floorHeader}>
                                    <h2>Tầng {floor}</h2>
                                    <span className={styles.roomCount}>{roomsByFloor[floor].length} phòng</span>
                                    <button
                                        className={styles.btnAddRoom}
                                        onClick={() => this.handleCreate(parseInt(floor))}
                                    >
                                        + Thêm phòng
                                    </button>
                                </div>
                                <div className={styles.roomGrid}>
                                    {roomsByFloor[floor].map(room => (
                                        <div
                                            key={room.id}
                                            className={`${styles.roomCard} ${room.status !== 'active' ? styles.disabled : ''}`}
                                            style={{ borderLeftColor: room.specialty ? this.getSpecialtyColor(room.specialty.id) : '#e0e0e0' }}
                                        >
                                            <div className={styles.roomHeader}>
                                                <span className={styles.roomNumber}>
                                                    {room.room_number || `P${room.id}`}
                                                </span>
                                                {this.getStatusBadge(room.status)}
                                            </div>
                                            <h3 className={styles.roomName}>{room.name}</h3>
                                            {room.specialty && (
                                                <div className={styles.roomSpecialty} style={{ color: this.getSpecialtyColor(room.specialty.id) }}>
                                                    {room.specialty.name}
                                                </div>
                                            )}
                                            {room.location && (
                                                <div className={styles.roomLocation}>
                                                    Vị trí: {room.location}
                                                </div>
                                            )}
                                            <div className={styles.roomMeta}>
                                                <span>Sức chứa: {room.capacity || 1}</span>
                                            </div>
                                            <div className={styles.roomActions}>
                                                <button
                                                    onClick={() => this.handleEdit(room)}
                                                    className={styles.btnEdit}
                                                    title="Chỉnh sửa"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => this.handleDelete(room)}
                                                    className={styles.btnDelete}
                                                    title="Xóa"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Số phòng</th>
                                    <th>Tên phòng</th>
                                    <th>Tầng</th>
                                    <th>Chuyên khoa</th>
                                    <th>Vị trí</th>
                                    <th>Sức chứa</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map(room => (
                                    <tr key={room.id}>
                                        <td><strong>{room.room_number || `P${room.id}`}</strong></td>
                                        <td>{room.name}</td>
                                        <td>Tầng {room.floor || 1}</td>
                                        <td>
                                            {room.specialty ? (
                                                <span className={styles.specialtyBadge} style={{ background: this.getSpecialtyColor(room.specialty.id) }}>
                                                    {room.specialty.name}
                                                </span>
                                            ) : (
                                                <span className={styles.noSpecialty}>Chưa phân loại</span>
                                            )}
                                        </td>
                                        <td>{room.location || '-'}</td>
                                        <td>{room.capacity || 1}</td>
                                        <td>{this.getStatusBadge(room.status)}</td>
                                        <td>
                                            <button
                                                onClick={() => this.handleEdit(room)}
                                                className={styles.btnEdit}
                                                title="Chỉnh sửa"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => this.handleDelete(room)}
                                                className={styles.btnDelete}
                                                title="Xóa"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showCreateModal: false })}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Thêm phòng khám mới</h2>
                                <button onClick={() => this.setState({ showCreateModal: false })} className={styles.closeBtn}>Đóng</button>
                            </div>
                            <form onSubmit={this.handleCreateRoom} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Tên phòng <span className={styles.required}>*</span></label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, name: e.target.value } })}
                                            required
                                            placeholder="VD: Phòng khám Nội tổng quát 1"
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Số phòng</label>
                                        <input
                                            type="text"
                                            value={formData.room_number}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, room_number: e.target.value } })}
                                            placeholder="VD: 101, A01..."
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Tầng</label>
                                        <select
                                            value={formData.floor}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, floor: parseInt(e.target.value) } })}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(f => (
                                                <option key={f} value={f}>Tầng {f}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Chuyên khoa</label>
                                        <select
                                            value={formData.specialty_id}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, specialty_id: e.target.value } })}
                                        >
                                            <option value="">-- Chọn chuyên khoa --</option>
                                            {specialties.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Sức chứa</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, capacity: parseInt(e.target.value) } })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Trạng thái</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, status: e.target.value } })}
                                        >
                                            <option value="active">Hoạt động</option>
                                            <option value="maintenance">Bảo trì</option>
                                            <option value="inactive">Tạm đóng</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Vị trí chi tiết</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => this.setState({ formData: { ...this.state.formData, location: e.target.value } })}
                                        placeholder="VD: Dãy A, bên trái thang máy..."
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => this.setState({ formData: { ...this.state.formData, description: e.target.value } })}
                                        placeholder="Mô tả thêm về phòng khám..."
                                        rows={3}
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
                )}

                {/* Edit Modal */}
                {showEditModal && selectedRoom && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showEditModal: false })}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Chỉnh sửa phòng khám</h2>
                                <button onClick={() => this.setState({ showEditModal: false })} className={styles.closeBtn}>Đóng</button>
                            </div>
                            <form onSubmit={this.handleUpdateRoom} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Tên phòng <span className={styles.required}>*</span></label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, name: e.target.value } })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Số phòng</label>
                                        <input
                                            type="text"
                                            value={formData.room_number}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, room_number: e.target.value } })}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Tầng</label>
                                        <select
                                            value={formData.floor}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, floor: parseInt(e.target.value) } })}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(f => (
                                                <option key={f} value={f}>Tầng {f}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Chuyên khoa</label>
                                        <select
                                            value={formData.specialty_id}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, specialty_id: e.target.value } })}
                                        >
                                            <option value="">-- Chọn chuyên khoa --</option>
                                            {specialties.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Sức chứa</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, capacity: parseInt(e.target.value) } })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Trạng thái</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => this.setState({ formData: { ...this.state.formData, status: e.target.value } })}
                                        >
                                            <option value="active">Hoạt động</option>
                                            <option value="maintenance">Bảo trì</option>
                                            <option value="inactive">Tạm đóng</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Vị trí chi tiết</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => this.setState({ formData: { ...this.state.formData, location: e.target.value } })}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => this.setState({ formData: { ...this.state.formData, description: e.target.value } })}
                                        rows={3}
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
                )}

                {/* Delete Modal */}
                {showDeleteModal && selectedRoom && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showDeleteModal: false })}>
                        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>Xác nhận xóa</h2>
                                <button onClick={() => this.setState({ showDeleteModal: false })} className={styles.closeBtn}>Đóng</button>
                            </div>
                            <div className={styles.deleteConfirm}>
                                <p>Bạn có chắc chắn muốn xóa phòng khám:</p>
                                <p className={styles.deleteRoomName}>
                                    {selectedRoom.room_number && `[${selectedRoom.room_number}] `}
                                    {selectedRoom.name}
                                </p>
                                <p className={styles.warning}>Cảnh báo: Hành động này không thể hoàn tác!</p>
                            </div>
                            <div className={styles.formActions}>
                                <button onClick={() => this.setState({ showDeleteModal: false })} className={styles.btnCancel}>
                                    Hủy
                                </button>
                                <button onClick={this.confirmDelete} className={styles.btnDeleteConfirm}>
                                    Xóa phòng
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default withRouter(AdminRooms);
