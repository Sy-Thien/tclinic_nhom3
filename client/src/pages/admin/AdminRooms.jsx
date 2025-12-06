import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AdminRooms.module.css';

export default function AdminRooms() {
    const [rooms, setRooms] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFloor, setFilterFloor] = useState('');
    const [filterSpecialty, setFilterSpecialty] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [viewMode, setViewMode] = useState('floor'); // 'floor' | 'list'
    const [stats, setStats] = useState(null);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        room_number: '',
        floor: 1,
        specialty_id: '',
        location: '',
        status: 'active',
        capacity: 1,
        description: ''
    });

    // Lấy danh sách phòng khám
    const fetchRooms = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (filterFloor) params.append('floor', filterFloor);
            if (filterSpecialty) params.append('specialty_id', filterSpecialty);
            if (filterStatus) params.append('status', filterStatus);

            const response = await api.get(`/api/admin/rooms?${params}`);
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            alert('Lỗi khi tải danh sách phòng khám');
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách chuyên khoa
    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/admin/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    // Lấy thống kê
    const fetchStats = async () => {
        try {
            const response = await api.get('/api/admin/rooms/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchRooms();
        fetchSpecialties();
        fetchStats();
    }, [searchTerm, filterFloor, filterSpecialty, filterStatus]);

    // Nhóm phòng theo tầng
    const roomsByFloor = rooms.reduce((acc, room) => {
        const floor = room.floor || 0;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(room);
        return acc;
    }, {});

    // Mở modal tạo mới
    const handleCreate = (presetFloor = null) => {
        setFormData({
            name: '',
            room_number: '',
            floor: presetFloor || 1,
            specialty_id: '',
            location: '',
            status: 'active',
            capacity: 1,
            description: ''
        });
        setShowCreateModal(true);
    };

    // Tạo phòng khám mới
    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/rooms', formData);
            alert('Thêm phòng khám thành công');
            setShowCreateModal(false);
            fetchRooms();
            fetchStats();
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Lỗi khi thêm phòng khám'));
        }
    };

    // Mở modal chỉnh sửa
    const handleEdit = (room) => {
        setSelectedRoom(room);
        setFormData({
            name: room.name || '',
            room_number: room.room_number || '',
            floor: room.floor || 1,
            specialty_id: room.specialty_id || '',
            location: room.location || '',
            status: room.status || 'active',
            capacity: room.capacity || 1,
            description: room.description || ''
        });
        setShowEditModal(true);
    };

    // Cập nhật phòng khám
    const handleUpdateRoom = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/admin/rooms/${selectedRoom.id}`, formData);
            alert('Cập nhật phòng khám thành công');
            setShowEditModal(false);
            fetchRooms();
            fetchStats();
        } catch (error) {
            console.error('Error updating room:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Lỗi khi cập nhật phòng khám'));
        }
    };

    // Xóa phòng khám
    const handleDelete = (room) => {
        setSelectedRoom(room);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/admin/rooms/${selectedRoom.id}`);
            alert('Xóa phòng khám thành công');
            setShowDeleteModal(false);
            fetchRooms();
            fetchStats();
        } catch (error) {
            console.error('Error deleting room:', error);
            alert('Lỗi: ' + (error.response?.data?.message || 'Lỗi khi xóa phòng khám'));
        }
    };

    // Status badge
    const getStatusBadge = (status) => {
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
    const getSpecialtyColor = (specialtyId) => {
        const colors = [
            '#3b82f6', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
            '#ffecd2', '#a8edea', '#d299c2', '#89f7fe', '#cd9cf2'
        ];
        return colors[specialtyId % colors.length];
    };

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
                <button onClick={() => handleCreate()} className={styles.btnCreate}>
                    Thêm phòng khám
                </button>
            </div>

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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />

                <select
                    value={filterFloor}
                    onChange={(e) => setFilterFloor(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="">Tất cả tầng</option>
                    {[1, 2, 3, 4, 5].map(f => (
                        <option key={f} value={f}>Tầng {f}</option>
                    ))}
                </select>

                <select
                    value={filterSpecialty}
                    onChange={(e) => setFilterSpecialty(e.target.value)}
                    className={styles.filterSelect}
                >
                    <option value="">Tất cả chuyên khoa</option>
                    {specialties.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
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
                        onClick={() => setViewMode('floor')}
                    >
                        Theo tầng
                    </button>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
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
                    <button onClick={() => handleCreate()} className={styles.btnCreate}>
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
                                    onClick={() => handleCreate(parseInt(floor))}
                                >
                                    + Thêm phòng
                                </button>
                            </div>
                            <div className={styles.roomGrid}>
                                {roomsByFloor[floor].map(room => (
                                    <div
                                        key={room.id}
                                        className={`${styles.roomCard} ${room.status !== 'active' ? styles.disabled : ''}`}
                                        style={{ borderLeftColor: room.specialty ? getSpecialtyColor(room.specialty.id) : '#e0e0e0' }}
                                    >
                                        <div className={styles.roomHeader}>
                                            <span className={styles.roomNumber}>
                                                {room.room_number || `P${room.id}`}
                                            </span>
                                            {getStatusBadge(room.status)}
                                        </div>
                                        <h3 className={styles.roomName}>{room.name}</h3>
                                        {room.specialty && (
                                            <div className={styles.roomSpecialty} style={{ color: getSpecialtyColor(room.specialty.id) }}>
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
                                                onClick={() => handleEdit(room)}
                                                className={styles.btnEdit}
                                                title="Chỉnh sửa"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => handleDelete(room)}
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
                                            <span className={styles.specialtyBadge} style={{ background: getSpecialtyColor(room.specialty.id) }}>
                                                {room.specialty.name}
                                            </span>
                                        ) : (
                                            <span className={styles.noSpecialty}>Chưa phân loại</span>
                                        )}
                                    </td>
                                    <td>{room.location || '-'}</td>
                                    <td>{room.capacity || 1}</td>
                                    <td>{getStatusBadge(room.status)}</td>
                                    <td>
                                        <button
                                            onClick={() => handleEdit(room)}
                                            className={styles.btnEdit}
                                            title="Chỉnh sửa"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(room)}
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
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Thêm phòng khám mới</h2>
                            <button onClick={() => setShowCreateModal(false)} className={styles.closeBtn}>Đóng</button>
                        </div>
                        <form onSubmit={handleCreateRoom} className={styles.form}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Tên phòng <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="VD: Phòng khám Nội tổng quát 1"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Số phòng</label>
                                    <input
                                        type="text"
                                        value={formData.room_number}
                                        onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                        placeholder="VD: 101, A01..."
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Tầng</label>
                                    <select
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
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
                                        onChange={(e) => setFormData({ ...formData, specialty_id: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="VD: Dãy A, bên trái thang máy..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả thêm về phòng khám..."
                                    rows={3}
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.btnCancel}>
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
                <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Chỉnh sửa phòng khám</h2>
                            <button onClick={() => setShowEditModal(false)} className={styles.closeBtn}>Đóng</button>
                        </div>
                        <form onSubmit={handleUpdateRoom} className={styles.form}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Tên phòng <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Số phòng</label>
                                    <input
                                        type="text"
                                        value={formData.room_number}
                                        onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Tầng</label>
                                    <select
                                        value={formData.floor}
                                        onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
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
                                        onChange={(e) => setFormData({ ...formData, specialty_id: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Trạng thái</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" onClick={() => setShowEditModal(false)} className={styles.btnCancel}>
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
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Xác nhận xóa</h2>
                            <button onClick={() => setShowDeleteModal(false)} className={styles.closeBtn}>Đóng</button>
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
                            <button onClick={() => setShowDeleteModal(false)} className={styles.btnCancel}>
                                Hủy
                            </button>
                            <button onClick={confirmDelete} className={styles.btnDeleteConfirm}>
                                Xóa phòng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
