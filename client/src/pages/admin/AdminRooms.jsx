import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AdminRooms.module.css';

export default function AdminRooms() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        location: ''
    });

    // Lấy danh sách phòng khám
    const fetchRooms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            if (searchTerm) params.append('search', searchTerm);

            const response = await axios.get(`http://localhost:5000/api/admin/rooms?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            alert('Lỗi khi tải danh sách phòng khám');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [searchTerm]);

    // Mở modal tạo mới
    const handleCreate = () => {
        setFormData({
            name: '',
            location: ''
        });
        setShowCreateModal(true);
    };

    // Tạo phòng khám mới
    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/admin/rooms',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Thêm phòng khám thành công');
            setShowCreateModal(false);
            fetchRooms();
        } catch (error) {
            console.error('Error creating room:', error);
            alert(error.response?.data?.message || 'Lỗi khi thêm phòng khám');
        }
    };

    // Mở modal chỉnh sửa
    const handleEdit = (room) => {
        setSelectedRoom(room);
        setFormData({
            name: room.name || '',
            location: room.location || ''
        });
        setShowEditModal(true);
    };

    // Cập nhật phòng khám
    const handleUpdateRoom = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/admin/rooms/${selectedRoom.id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Cập nhật phòng khám thành công');
            setShowEditModal(false);
            fetchRooms();
        } catch (error) {
            console.error('Error updating room:', error);
            alert(error.response?.data?.message || 'Lỗi khi cập nhật phòng khám');
        }
    };

    // Xóa phòng khám
    const handleDelete = (room) => {
        setSelectedRoom(room);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:5000/api/admin/rooms/${selectedRoom.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Xóa phòng khám thành công');
            setShowDeleteModal(false);
            fetchRooms();
        } catch (error) {
            console.error('Error deleting room:', error);
            alert(error.response?.data?.message || 'Lỗi khi xóa phòng khám');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải dữ liệu...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Quản lý phòng khám</h1>
                <p>Quản lý số phòng và vị trí trong hệ thống</p>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                <input
                    type="text"
                    placeholder="🔍 Tìm theo tên phòng hoặc vị trí..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <button onClick={handleCreate} className={styles.btnCreate}>
                    ➕ Thêm phòng khám
                </button>
            </div>

            {/* Room Grid */}
            <div className={styles.roomGrid}>
                {rooms.length === 0 ? (
                    <div className={styles.noData}>Không có dữ liệu</div>
                ) : (
                    rooms.map((room) => (
                        <div key={room.id} className={styles.roomCard}>
                            <div className={styles.roomIcon}>🏥</div>
                            <div className={styles.roomInfo}>
                                <h3 className={styles.roomName}>{room.name}</h3>
                                <p className={styles.roomLocation}>
                                    📍 {room.location || 'Chưa có vị trí'}
                                </p>
                            </div>
                            <div className={styles.roomActions}>
                                <button
                                    onClick={() => handleEdit(room)}
                                    className={styles.btnEdit}
                                    title="Chỉnh sửa"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDelete(room)}
                                    className={styles.btnDelete}
                                    title="Xóa"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Thêm phòng khám mới</h2>
                            <button onClick={() => setShowCreateModal(false)} className={styles.closeBtn}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateRoom} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Tên phòng *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="VD: P101, Phòng khám 1..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Vị trí</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="VD: Tầng 1, Tòa A..."
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
            {showEditModal && (
                <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Chỉnh sửa phòng khám</h2>
                            <button onClick={() => setShowEditModal(false)} className={styles.closeBtn}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateRoom} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Tên phòng *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Vị trí</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                            <button onClick={() => setShowDeleteModal(false)} className={styles.closeBtn}>
                                ✕
                            </button>
                        </div>

                        <div className={styles.deleteConfirm}>
                            <p>Bạn có chắc chắn muốn xóa phòng khám:</p>
                            <p className={styles.roomName}>{selectedRoom.name}</p>
                            <p className={styles.warning}>⚠️ Không thể khôi phục sau khi xóa!</p>
                        </div>

                        <div className={styles.formActions}>
                            <button onClick={() => setShowDeleteModal(false)} className={styles.btnCancel}>
                                Hủy
                            </button>
                            <button onClick={confirmDelete} className={styles.btnDelete}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
