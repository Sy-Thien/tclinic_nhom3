import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './DrugManagement.module.css';

export default function DrugManagement() {
    const [drugs, setDrugs] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        ingredient: '',
        quantity: 0,
        unit: 'viên',
        expiry_date: '',
        warning_level: 10,
        price: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (!user) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [drugsRes, warningsRes] = await Promise.all([
                api.get('/api/admin/drugs'),
                api.get('/api/admin/drugs/stock/warnings')
            ]);
            setDrugs(drugsRes.data.data || []);
            setWarnings(warningsRes.data.data || []);
        } catch (error) {
            console.error('Error:', error);
            alert('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDrug = async (e) => {
        e.preventDefault();
        try {
            if (!formData.name || formData.quantity < 0) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            if (editingId) {
                await api.put(`/api/admin/drugs/${editingId}`, formData);
                alert('✅ Cập nhật thuốc thành công!');
            } else {
                await api.post('/api/admin/drugs', formData);
                alert('✅ Thêm thuốc thành công!');
            }

            setFormData({
                name: '',
                ingredient: '',
                quantity: 0,
                unit: 'viên',
                expiry_date: '',
                warning_level: 10,
                price: 0
            });
            setShowForm(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ ${error.response?.data?.message || 'Lỗi khi lưu'}`);
        }
    };

    const handleEditDrug = (drug) => {
        setFormData(drug);
        setEditingId(drug.id);
        setShowForm(true);
    };

    const handleDeleteDrug = async (id) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa thuốc này?')) return;

        try {
            await api.delete(`/api/admin/drugs/${id}`);
            alert('✅ Xóa thuốc thành công!');
            fetchData();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Lỗi khi xóa');
        }
    };

    const handleUpdateStock = async (id, type) => {
        const quantity = prompt(`Nhập số lượng ${type === 'add' ? 'thêm' : 'xóa'}:`, '1');
        if (!quantity) return;

        try {
            await api.put(`/api/admin/drugs/${id}/stock`, {
                quantity: parseInt(quantity),
                type
            });
            alert('✅ Cập nhật tồn kho thành công!');
            fetchData();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ ${error.response?.data?.message || 'Lỗi'}`);
        }
    };

    const filteredDrugs = drugs.filter(drug =>
        drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drug.ingredient?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Quản lý kho thuốc</h1>
                <button
                    className={styles.btnAdd}
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingId(null);
                        setFormData({
                            name: '',
                            ingredient: '',
                            quantity: 0,
                            unit: 'viên',
                            expiry_date: '',
                            warning_level: 10,
                            price: 0
                        });
                    }}
                >
                    Thêm thuốc
                </button>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className={styles.warningsSection}>
                    <h2>Cảnh báo kho ({warnings.length})</h2>
                    <div className={styles.warningsList}>
                        {warnings.map(warning => (
                            <div key={warning.id} className={styles.warningCard}>
                                <span className={styles.warningType}>
                                    {warning.warning_type === 'low_stock' ? 'Tồn kho thấp' : 'Sắp hết hạn'}
                                </span>
                                <div className={styles.warningContent}>
                                    <h4>{warning.name}</h4>
                                    <p className={styles.warningMessage}>{warning.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className={styles.formSection}>
                    <h2>{editingId ? 'Cập nhật thuốc' : 'Thêm thuốc mới'}</h2>
                    <form onSubmit={handleAddDrug} className={styles.form}>
                        <div className={styles.formRow}>
                            <input
                                type="text"
                                placeholder="Tên thuốc *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Thành phần"
                                value={formData.ingredient}
                                onChange={(e) => setFormData({ ...formData, ingredient: e.target.value })}
                            />
                        </div>

                        <div className={styles.formRow}>
                            <input
                                type="number"
                                placeholder="Số lượng *"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                required
                                min="0"
                            />
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="viên">Viên</option>
                                <option value="mg">mg</option>
                                <option value="ml">ml</option>
                                <option value="g">g</option>
                                <option value="chai">Chai</option>
                                <option value="hộp">Hộp</option>
                            </select>
                        </div>

                        <div className={styles.formRow}>
                            <input
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                placeholder="Hạn dùng"
                            />
                            <input
                                type="number"
                                placeholder="Cảnh báo kho khi dưới"
                                value={formData.warning_level}
                                onChange={(e) => setFormData({ ...formData, warning_level: parseInt(e.target.value) })}
                                min="0"
                            />
                        </div>

                        <div className={styles.formRow}>
                            <input
                                type="number"
                                placeholder="Giá (đ)"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                min="0"
                                step="1000"
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button type="submit" className={styles.btnSave}>
                                {editingId ? 'Cập nhật' : 'Thêm'}
                            </button>
                            <button
                                type="button"
                                className={styles.btnCancel}
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                }}
                            >
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search & Filter */}
            <div className={styles.filterBar}>
                <input
                    type="text"
                    placeholder="Tìm kiếm thuốc..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
                <span className={styles.resultCount}>
                    {filteredDrugs.length} / {drugs.length} thuốc
                </span>
            </div>

            {/* Drugs Table */}
            {filteredDrugs.length === 0 ? (
                <div className={styles.empty}>
                    <p>Không tìm thấy thuốc nào</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Tên thuốc</th>
                                <th>Thành phần</th>
                                <th>Tồn kho</th>
                                <th>Hạn dùng</th>
                                <th>Giá</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDrugs.map(drug => {
                                const isLowStock = drug.quantity <= drug.warning_level;
                                const isExpiringSoon =
                                    drug.expiry_date &&
                                    new Date(drug.expiry_date) - new Date() < 30 * 24 * 60 * 60 * 1000;

                                return (
                                    <tr key={drug.id} className={isLowStock || isExpiringSoon ? styles.warning : ''}>
                                        <td className={styles.drugName}>
                                            <strong>{drug.name}</strong>
                                        </td>
                                        <td className={styles.ingredient}>{drug.ingredient || '-'}</td>
                                        <td className={styles.quantity}>
                                            <span className={isLowStock ? styles.lowStock : ''}>
                                                {drug.quantity} {drug.unit}
                                            </span>
                                            {isLowStock && <span className={styles.badge}>Cảnh báo</span>}
                                        </td>
                                        <td className={styles.expiry}>
                                            {drug.expiry_date
                                                ? new Date(drug.expiry_date).toLocaleDateString('vi-VN')
                                                : '-'}
                                            {isExpiringSoon && <span className={styles.badge}>Gần hạn</span>}
                                        </td>
                                        <td className={styles.price}>
                                            {drug.price ? `${drug.price.toLocaleString('vi-VN')}đ` : '-'}
                                        </td>
                                        <td className={styles.actions}>
                                            <button
                                                className={styles.btnStock}
                                                onClick={() => handleUpdateStock(drug.id, 'add')}
                                                title="Thêm tồn"
                                            >
                                                Nhập
                                            </button>
                                            <button
                                                className={styles.btnStock}
                                                onClick={() => handleUpdateStock(drug.id, 'remove')}
                                                title="Xóa tồn"
                                            >
                                                Xuất
                                            </button>
                                            <button
                                                className={styles.btnEdit}
                                                onClick={() => handleEditDrug(drug)}
                                                title="Sửa"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className={styles.btnDelete}
                                                onClick={() => handleDeleteDrug(drug.id)}
                                                title="Xóa"
                                            >
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
