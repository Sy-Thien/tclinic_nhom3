import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AdminSpecialties.module.css';

export default function AdminSpecialties() {
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: ''
    });

    // Lấy danh sách chuyên khoa
    const fetchSpecialties = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            if (searchTerm) params.append('search', searchTerm);

            const response = await axios.get(`http://localhost:5000/api/admin/specialties?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSpecialties(response.data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
            alert('Lỗi khi tải danh sách chuyên khoa');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecialties();
    }, [searchTerm]);

    // Xem chi tiết chuyên khoa
    const handleViewDetail = async (specialty) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/admin/specialties/${specialty.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedSpecialty(response.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching specialty detail:', error);
            alert('Lỗi khi tải thông tin chuyên khoa');
        }
    };

    // Mở modal tạo mới
    const handleCreate = () => {
        setFormData({
            name: '',
            description: '',
            image: ''
        });
        setShowCreateModal(true);
    };

    // Tạo chuyên khoa mới
    const handleCreateSpecialty = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/admin/specialties',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Thêm chuyên khoa thành công');
            setShowCreateModal(false);
            fetchSpecialties();
        } catch (error) {
            console.error('Error creating specialty:', error);
            alert(error.response?.data?.message || 'Lỗi khi thêm chuyên khoa');
        }
    };

    // Mở modal chỉnh sửa
    const handleEdit = (specialty) => {
        setSelectedSpecialty(specialty);
        setFormData({
            name: specialty.name || '',
            description: specialty.description || '',
            image: specialty.image || ''
        });
        setShowEditModal(true);
    };

    // Cập nhật chuyên khoa
    const handleUpdateSpecialty = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/admin/specialties/${selectedSpecialty.id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Cập nhật chuyên khoa thành công');
            setShowEditModal(false);
            fetchSpecialties();
        } catch (error) {
            console.error('Error updating specialty:', error);
            alert(error.response?.data?.message || 'Lỗi khi cập nhật chuyên khoa');
        }
    };

    // Xóa chuyên khoa
    const handleDelete = (specialty) => {
        setSelectedSpecialty(specialty);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:5000/api/admin/specialties/${selectedSpecialty.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('Xóa chuyên khoa thành công');
            setShowDeleteModal(false);
            fetchSpecialties();
        } catch (error) {
            console.error('Error deleting specialty:', error);
            alert(error.response?.data?.message || 'Lỗi khi xóa chuyên khoa');
        }
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải dữ liệu...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Quản lý chuyên khoa</h1>
                <p>Thêm, sửa, xóa chuyên khoa trong hệ thống</p>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                <input
                    type="text"
                    placeholder="Tìm theo tên chuyên khoa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <button onClick={handleCreate} className={styles.btnCreate}>
                    Thêm chuyên khoa
                </button>
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên chuyên khoa</th>
                            <th>Mô tả</th>
                            <th>Số bác sĩ</th>
                            <th>Số dịch vụ</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {specialties.length === 0 ? (
                            <tr>
                                <td colSpan="6" className={styles.noData}>
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
                                    <td className={styles.actionButtons}>
                                        <button
                                            onClick={() => handleViewDetail(specialty)}
                                            className={styles.btnView}
                                            title="Xem chi tiết"
                                        >
                                            Xem
                                        </button>
                                        <button
                                            onClick={() => handleEdit(specialty)}
                                            className={styles.btnEdit}
                                            title="Chỉnh sửa"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(specialty)}
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
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Thêm chuyên khoa mới</h2>
                            <button onClick={() => setShowCreateModal(false)} className={styles.closeBtn}>
                                Đóng
                            </button>
                        </div>

                        <form onSubmit={handleCreateSpecialty} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Tên chuyên khoa *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="VD: Nội khoa, Ngoại khoa..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                    placeholder="Mô tả về chuyên khoa..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Hình ảnh (URL)</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
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
                            <h2>Chỉnh sửa chuyên khoa</h2>
                            <button onClick={() => setShowEditModal(false)} className={styles.closeBtn}>
                                Đóng
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSpecialty} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Tên chuyên khoa *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Hình ảnh (URL)</label>
                                <input
                                    type="text"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
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

            {/* Detail Modal */}
            {showDetailModal && selectedSpecialty && (
                <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Chi tiết chuyên khoa</h2>
                            <button onClick={() => setShowDetailModal(false)} className={styles.closeBtn}>
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
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedSpecialty && (
                <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Xác nhận xóa</h2>
                            <button onClick={() => setShowDeleteModal(false)} className={styles.closeBtn}>
                                Đóng
                            </button>
                        </div>

                        <div className={styles.deleteConfirm}>
                            <p>Bạn có chắc chắn muốn xóa chuyên khoa:</p>
                            <p className={styles.specialtyName}>{selectedSpecialty.name}</p>
                            {(selectedSpecialty.doctorCount > 0 || selectedSpecialty.serviceCount > 0) && (
                                <p className={styles.warning}>
                                    Cảnh báo: Chuyên khoa này có {selectedSpecialty.doctorCount} bác sĩ và {selectedSpecialty.serviceCount} dịch vụ!
                                </p>
                            )}
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
