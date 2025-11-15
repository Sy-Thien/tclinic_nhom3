import { useEffect, useState } from 'react';
import api from '../../utils/api';
import styles from './SpecialtyList.module.css';

export default function SpecialtyList() {
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSpecialty, setEditingSpecialty] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchSpecialties();
    }, []);

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/admin/specialties');
            setSpecialties(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSpecialty) {
                await api.put(`/api/admin/specialties/${editingSpecialty.id}`, formData);
                alert('Cập nhật thành công!');
            } else {
                await api.post('/api/admin/specialties', formData);
                alert('Thêm chuyên khoa thành công!');
            }
            setShowModal(false);
            fetchSpecialties();
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi!');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            await api.delete(`/api/admin/specialties/${id}`);
            alert('Xóa thành công!');
            fetchSpecialties();
        } catch (error) {
            alert('Lỗi khi xóa!');
        }
    };

    const handleAdd = () => {
        setEditingSpecialty(null);
        setFormData({ name: '', description: '' });
        setShowModal(true);
    };

    const handleEdit = (specialty) => {
        setEditingSpecialty(specialty);
        setFormData({
            name: specialty.name,
            description: specialty.description || ''
        });
        setShowModal(true);
    };

    if (loading) return <div className={styles.loading}>Đang tải...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Quản lý Chuyên khoa</h1>
                <button onClick={handleAdd} className={styles.addBtn}>
                    + Thêm chuyên khoa
                </button>
            </div>

            <div className={styles.grid}>
                {specialties.map(spec => (
                    <div key={spec.id} className={styles.card}>
                        <h3>{spec.name}</h3>
                        <p>{spec.description || 'Chưa có mô tả'}</p>
                        <div className={styles.actions}>
                            <button onClick={() => handleEdit(spec)} className={styles.editBtn}>Sửa</button>
                            <button onClick={() => handleDelete(spec.id)} className={styles.deleteBtn}>Xóa</button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h2>{editingSpecialty ? 'Sửa chuyên khoa' : 'Thêm chuyên khoa'}</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Tên chuyên khoa"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <textarea
                                placeholder="Mô tả"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                            />
                            <div className={styles.modalFooter}>
                                <button type="button" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}