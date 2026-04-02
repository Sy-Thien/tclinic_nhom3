import React, { Component } from 'react';
import withRouter from '../../utils/withRouter';
import api from '../../utils/api';
import styles from './DrugManagement.module.css';

class DrugManagement extends Component {
    constructor(props) {
        super(props);
        this.state = {
            drugs: [],
            warnings: [],
            loading: true,
            showForm: false,
            editingId: null,
            searchTerm: '',
            filterStatus: 'all',
            sortBy: 'name',
            formData: {
                name: '',
                ingredient: '',
                quantity: 0,
                unit: 'viên',
                expiry_date: '',
                warning_level: 10,
                price: 0,
                usage_guide: '',
                note: ''
            },
            showStockModal: false,
            stockAction: 'add',
            stockData: {
                drugId: null, drugName: '', currentStock: 0, unit: 'viên',
                quantity: 1, newPrice: '', note: ''
            }
        };
    }

    componentDidMount() {
        const user = localStorage.getItem('user');
        if (!user) {
            this.props.navigate('/login');
            return;
        }
        this.fetchData();
    }

    formatPrice = (price) => {
        if (!price || Number(price) === 0) return <span className={styles.noPrice}>Chưa có giá</span>;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    formatPriceStr = (price) => {
        if (!price || Number(price) === 0) return '—';
        return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
    };

    fetchData = async () => {
        try {
            this.setState({ loading: true });
            const [drugsRes, warningsRes] = await Promise.all([
                api.get('/api/admin/drugs'),
                api.get('/api/admin/drugs/stock/warnings')
            ]);
            this.setState({
                drugs: drugsRes.data.data || [],
                warnings: warningsRes.data.data || []
            });
        } catch (error) {
            console.error('Error:', error);
            alert('Lỗi khi tải dữ liệu');
        } finally {
            this.setState({ loading: false });
        }
    };

    handleAddDrug = async (e) => {
        e.preventDefault();
        const { formData, editingId } = this.state;
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
            this.setState({
                formData: { name: '', ingredient: '', quantity: 0, unit: 'viên', expiry_date: '', warning_level: 10, price: 0, usage_guide: '', note: '' },
                showForm: false,
                editingId: null
            });
            this.fetchData();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ ${error.response?.data?.message || 'Lỗi khi lưu'}`);
        }
    };

    handleEditDrug = (drug) => {
        this.setState({
            formData: {
                name: drug.name || '',
                ingredient: drug.ingredient || '',
                quantity: drug.quantity ?? 0,
                unit: drug.unit || 'viên',
                expiry_date: drug.expiry_date ? drug.expiry_date.substring(0, 10) : '',
                warning_level: drug.warning_level ?? 10,
                price: drug.price ?? 0,
                usage_guide: drug.usage_guide || '',
                note: drug.note || ''
            },
            editingId: drug.id,
            showForm: true
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    handleDeleteDrug = async (id) => {
        if (!window.confirm('Bạn chắc chắn muốn xóa thuốc này?')) return;
        try {
            await api.delete(`/api/admin/drugs/${id}`);
            alert('✅ Xóa thuốc thành công!');
            this.fetchData();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Lỗi khi xóa');
        }
    };

    openStockModal = (drug, type) => {
        this.setState({
            stockAction: type,
            stockData: {
                drugId: drug.id,
                drugName: drug.name,
                currentStock: drug.quantity,
                unit: drug.unit || 'viên',
                quantity: 1,
                newPrice: drug.price ? String(drug.price) : '',
                note: ''
            },
            showStockModal: true
        });
    };

    handleUpdateStock = async () => {
        const { stockData, stockAction } = this.state;
        const qty = parseInt(stockData.quantity);
        if (!qty || qty <= 0) { alert('Số lượng phải lớn hơn 0'); return; }
        try {
            await api.put(`/api/admin/drugs/${stockData.drugId}/stock`, {
                quantity: qty,
                type: stockAction
            });
            if (stockAction === 'add' && stockData.newPrice && parseFloat(stockData.newPrice) > 0) {
                await api.put(`/api/admin/drugs/${stockData.drugId}`, {
                    price: parseFloat(stockData.newPrice)
                });
            }
            this.setState({ showStockModal: false });
            this.fetchData();
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ ${error.response?.data?.message || 'Lỗi cập nhật kho'}`);
        }
    };

    getFilteredDrugs = () => {
        const { drugs, searchTerm, filterStatus, sortBy } = this.state;
        return drugs
            .filter(drug => {
                const matchSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    drug.ingredient?.toLowerCase().includes(searchTerm.toLowerCase());
                if (!matchSearch) return false;
                if (filterStatus === 'low') return drug.quantity <= drug.warning_level;
                if (filterStatus === 'noprice') return !drug.price || Number(drug.price) === 0;
                if (filterStatus === 'expired') {
                    return drug.expiry_date && new Date(drug.expiry_date) - new Date() < 30 * 24 * 60 * 60 * 1000;
                }
                return true;
            })
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'price_asc') return (Number(a.price) || 0) - (Number(b.price) || 0);
                if (sortBy === 'price_desc') return (Number(b.price) || 0) - (Number(a.price) || 0);
                if (sortBy === 'quantity') return a.quantity - b.quantity;
                return 0;
            });
    };

    render() {
        const {
            drugs, warnings, loading, showForm, editingId, searchTerm,
            filterStatus, sortBy, formData, showStockModal, stockAction, stockData
        } = this.state;

        const filteredDrugs = this.getFilteredDrugs();
        const totalValue = drugs.reduce((sum, d) => sum + (Number(d.price) || 0) * (Number(d.quantity) || 0), 0);
        const noPriceCount = drugs.filter(d => !d.price || Number(d.price) === 0).length;
        const lowStockCount = drugs.filter(d => d.quantity <= d.warning_level).length;

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
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1>💊 Quản lý kho thuốc</h1>
                        <p className={styles.headerSub}>Quản lý thuốc và tồn kho — giá thuốc ảnh hưởng trực tiếp đến hóa đơn</p>
                    </div>
                    <button
                        className={styles.btnAdd}
                        onClick={() => {
                            this.setState({
                                showForm: !showForm,
                                editingId: null,
                                formData: { name: '', ingredient: '', quantity: 0, unit: 'viên', expiry_date: '', warning_level: 10, price: 0, usage_guide: '', note: '' }
                            });
                        }}
                    >
                        + Thêm thuốc
                    </button>
                </div>

                {/* Stats Cards */}
                <div className={styles.statsBar}>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>💊</span>
                        <div>
                            <div className={styles.statValue}>{drugs.length}</div>
                            <div className={styles.statLabel}>Loại thuốc</div>
                        </div>
                    </div>
                    <div className={`${styles.statCard} ${lowStockCount > 0 ? styles.statWarn : ''}`}>
                        <span className={styles.statIcon}>⚠️</span>
                        <div>
                            <div className={styles.statValue}>{lowStockCount}</div>
                            <div className={styles.statLabel}>Sắp hết hàng</div>
                        </div>
                    </div>
                    <div className={`${styles.statCard} ${noPriceCount > 0 ? styles.statDanger : ''}`}>
                        <span className={styles.statIcon}>🏷️</span>
                        <div>
                            <div className={styles.statValue}>{noPriceCount}</div>
                            <div className={styles.statLabel}>Chưa có giá</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statIcon}>💰</span>
                        <div>
                            <div className={styles.statValue}>{new Intl.NumberFormat('vi-VN').format(totalValue)} đ</div>
                            <div className={styles.statLabel}>Tổng giá trị kho</div>
                        </div>
                    </div>
                </div>

                {/* No-price warning banner */}
                {noPriceCount > 0 && (
                    <div className={styles.bannerDanger}>
                        ⚠️ Có <strong>{noPriceCount} thuốc chưa có giá</strong> — khi lập hóa đơn, những thuốc này sẽ tính là 0đ.
                        <button className={styles.bannerBtn} onClick={() => this.setState({ filterStatus: 'noprice' })}>
                            Xem danh sách →
                        </button>
                    </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                    <div className={styles.warningsSection}>
                        <h2>Cảnh báo kho ({warnings.length})</h2>
                        <div className={styles.warningsList}>
                            {warnings.map(warning => (
                                <div key={warning.id} className={styles.warningCard}>
                                    <span className={styles.warningType}>
                                        {warning.warning_type === 'low_stock' ? '📦 Tồn kho thấp' : '⏳ Sắp hết hạn'}
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
                        <h2>{editingId ? '✏️ Cập nhật thuốc' : '➕ Thêm thuốc mới'}</h2>
                        <form onSubmit={this.handleAddDrug} className={styles.form}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Tên thuốc <span className={styles.required}>*</span></label>
                                    <input type="text" placeholder="VD: Paracetamol 500mg" value={formData.name}
                                        onChange={(e) => this.setState({ formData: { ...formData, name: e.target.value } })} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Thành phần hoạt chất</label>
                                    <input type="text" placeholder="VD: Paracetamol" value={formData.ingredient}
                                        onChange={(e) => this.setState({ formData: { ...formData, ingredient: e.target.value } })} />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Số lượng tồn kho <span className={styles.required}>*</span></label>
                                    <input type="number" placeholder="0" value={formData.quantity}
                                        onChange={(e) => this.setState({ formData: { ...formData, quantity: parseInt(e.target.value) || 0 } })} required min="0" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Đơn vị tính</label>
                                    <select value={formData.unit} onChange={(e) => this.setState({ formData: { ...formData, unit: e.target.value } })}>
                                        <option value="viên">Viên</option>
                                        <option value="gói">Gói</option>
                                        <option value="ống">Ống</option>
                                        <option value="lọ">Lọ</option>
                                        <option value="chai">Chai</option>
                                        <option value="hộp">Hộp</option>
                                        <option value="tuýp">Tuýp</option>
                                        <option value="ml">ml</option>
                                        <option value="mg">mg</option>
                                        <option value="g">g</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Giá bán / đơn vị <span className={styles.required}>*</span>
                                        <span className={styles.labelNote}> (dùng để tính hóa đơn)</span>
                                    </label>
                                    <input type="number" placeholder="0" value={formData.price}
                                        onChange={(e) => this.setState({ formData: { ...formData, price: parseFloat(e.target.value) || 0 } })} min="0" step="500" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Cảnh báo khi tồn dưới</label>
                                    <input type="number" placeholder="10" value={formData.warning_level}
                                        onChange={(e) => this.setState({ formData: { ...formData, warning_level: parseInt(e.target.value) || 0 } })} min="0" />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Hạn sử dụng</label>
                                    <input type="date" value={formData.expiry_date}
                                        onChange={(e) => this.setState({ formData: { ...formData, expiry_date: e.target.value } })} />
                                </div>
                            </div>

                            <div className={styles.formRowFull}>
                                <label>Hướng dẫn sử dụng</label>
                                <textarea placeholder="VD: Uống 2 viên/lần, 3 lần/ngày sau ăn..." value={formData.usage_guide || ''}
                                    onChange={(e) => this.setState({ formData: { ...formData, usage_guide: e.target.value } })} rows={2} />
                            </div>

                            <div className={styles.formRowFull}>
                                <label>Ghi chú bảo quản</label>
                                <textarea placeholder="VD: Bảo quản nơi khô ráo, thoáng mát, tránh ánh sáng..." value={formData.note || ''}
                                    onChange={(e) => this.setState({ formData: { ...formData, note: e.target.value } })} rows={2} />
                            </div>

                            <div className={styles.formActions}>
                                <button type="submit" className={styles.btnSave}>
                                    {editingId ? '💾 Cập nhật' : '➕ Thêm thuốc'}
                                </button>
                                <button type="button" className={styles.btnCancel}
                                    onClick={() => this.setState({ showForm: false, editingId: null })}>
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search & Filter Bar */}
                <div className={styles.filterBar}>
                    <input type="text" placeholder="🔍 Tìm theo tên hoặc thành phần..." value={searchTerm}
                        onChange={(e) => this.setState({ searchTerm: e.target.value })} className={styles.searchInput} />
                    <select className={styles.filterSelect} value={filterStatus}
                        onChange={(e) => this.setState({ filterStatus: e.target.value })}>
                        <option value="all">Tất cả ({drugs.length})</option>
                        <option value="low">⚠️ Sắp hết hàng ({lowStockCount})</option>
                        <option value="noprice">🏷️ Chưa có giá ({noPriceCount})</option>
                        <option value="expired">⏳ Sắp hết hạn</option>
                    </select>
                    <select className={styles.filterSelect} value={sortBy}
                        onChange={(e) => this.setState({ sortBy: e.target.value })}>
                        <option value="name">Sắp xếp: Tên A→Z</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                        <option value="quantity">Tồn kho thấp nhất</option>
                    </select>
                    <span className={styles.resultCount}>{filteredDrugs.length} / {drugs.length}</span>
                </div>

                {/* Drugs Table */}
                {filteredDrugs.length === 0 ? (
                    <div className={styles.empty}><p>Không tìm thấy thuốc nào</p></div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Tên thuốc / Thành phần</th>
                                    <th>Tồn kho</th>
                                    <th>Đơn vị</th>
                                    <th className={styles.priceCol}>Giá / đơn vị <span className={styles.invoiceHint}>💡 dùng cho HĐ</span></th>
                                    <th>Hạn dùng</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrugs.map(drug => {
                                    const isLowStock = drug.quantity <= drug.warning_level;
                                    const isExpiringSoon = drug.expiry_date &&
                                        new Date(drug.expiry_date) - new Date() < 30 * 24 * 60 * 60 * 1000;
                                    const noPrice = !drug.price || Number(drug.price) === 0;

                                    return (
                                        <tr key={drug.id}
                                            className={noPrice ? styles.rowNoPrice : (isLowStock || isExpiringSoon ? styles.warning : '')}>
                                            <td>
                                                <div className={styles.drugName}>{drug.name}</div>
                                                {drug.ingredient && <div className={styles.ingredient}>{drug.ingredient}</div>}
                                                {(drug.usage_guide || drug.note) && (
                                                    <div className={styles.drugMeta}>
                                                        {drug.usage_guide && <span className={styles.usageGuide} title={drug.usage_guide}>📋 HD</span>}
                                                        {drug.note && <span className={styles.noteIcon} title={drug.note}>📝 GC</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`${styles.stockBadge} ${isLowStock ? styles.stockLow : styles.stockOk}`}>
                                                    {drug.quantity}
                                                </span>
                                                {isLowStock && <span className={styles.badge}>Thấp</span>}
                                            </td>
                                            <td className={styles.unitCell}>{drug.unit}</td>
                                            <td className={styles.priceCol}>
                                                {noPrice ? (
                                                    <span className={styles.noPrice}>⚠️ Chưa có giá</span>
                                                ) : (
                                                    <span className={styles.priceValue}>{this.formatPriceStr(drug.price)}</span>
                                                )}
                                            </td>
                                            <td>
                                                {drug.expiry_date
                                                    ? <span className={isExpiringSoon ? styles.expiryWarn : ''}>
                                                        {new Date(drug.expiry_date).toLocaleDateString('vi-VN')}
                                                        {isExpiringSoon && ' ⚠️'}
                                                    </span>
                                                    : <span className={styles.noData}>—</span>
                                                }
                                            </td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button className={styles.btnImport} onClick={() => this.openStockModal(drug, 'add')} title="Nhập kho">
                                                        📥 Nhập kho
                                                    </button>
                                                    <button className={styles.btnExport} onClick={() => this.openStockModal(drug, 'remove')} title="Xuất kho">
                                                        📤 Xuất
                                                    </button>
                                                    <button className={styles.btnEdit} onClick={() => this.handleEditDrug(drug)} title="Chỉnh sửa">
                                                        ✏️
                                                    </button>
                                                    <button className={styles.btnDelete} onClick={() => this.handleDeleteDrug(drug.id)} title="Xóa">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Stock Modal */}
                {showStockModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modal}>
                            <div className={styles.modalHeader}>
                                <h2>{stockAction === 'add' ? '📥 Nhập kho' : '📤 Xuất kho'}</h2>
                                <button className={styles.modalClose} onClick={() => this.setState({ showStockModal: false })}>✕</button>
                            </div>
                            <div className={styles.modalBody}>
                                <div className={styles.stockInfo}>
                                    <strong>{stockData.drugName}</strong>
                                    <span>Tồn hiện tại: <b>{stockData.currentStock} {stockData.unit}</b></span>
                                </div>

                                <div className={styles.modalField}>
                                    <label>Số lượng {stockAction === 'add' ? 'nhập' : 'xuất'} <span className={styles.required}>*</span></label>
                                    <input type="number" min="1" value={stockData.quantity}
                                        onChange={(e) => this.setState({ stockData: { ...stockData, quantity: e.target.value } })}
                                        className={styles.modalInput} autoFocus />
                                    <span className={styles.fieldHint}>
                                        {stockAction === 'add'
                                            ? `→ Tồn sau nhập: ${stockData.currentStock + (parseInt(stockData.quantity) || 0)} ${stockData.unit}`
                                            : `→ Tồn sau xuất: ${Math.max(0, stockData.currentStock - (parseInt(stockData.quantity) || 0))} ${stockData.unit}`
                                        }
                                    </span>
                                </div>

                                {stockAction === 'add' && (
                                    <div className={styles.modalField}>
                                        <label>Cập nhật giá bán / {stockData.unit}
                                            <span className={styles.labelNote}> (để trống nếu không đổi giá)</span>
                                        </label>
                                        <input type="number" min="0" step="500"
                                            placeholder={stockData.newPrice ? `Hiện tại: ${this.formatPriceStr(stockData.newPrice)}` : 'Nhập giá mới...'}
                                            value={stockData.newPrice}
                                            onChange={(e) => this.setState({ stockData: { ...stockData, newPrice: e.target.value } })}
                                            className={styles.modalInput} />
                                        <span className={styles.fieldHint}>💡 Giá này dùng để tính tự động trong hóa đơn</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.modalFooter}>
                                <button className={styles.btnModalCancel} onClick={() => this.setState({ showStockModal: false })}>Hủy</button>
                                <button
                                    className={stockAction === 'add' ? styles.btnModalConfirm : styles.btnModalWarn}
                                    onClick={this.handleUpdateStock}
                                >
                                    {stockAction === 'add' ? '✅ Xác nhận nhập kho' : '✅ Xác nhận xuất kho'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default withRouter(DrugManagement);
