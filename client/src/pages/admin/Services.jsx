import React, { Component } from 'react';
import api from '../../utils/api';
import styles from './Services.module.css';

class Services extends Component {
    constructor(props) {
        super(props);
        this.state = {
            services: [],
            specialties: [],
            loading: true,
            searchTerm: '',
            filterSpecialty: 'all',
            showModal: false,
            modalMode: 'add',
            selectedService: null,
            submitting: false,
            formData: {
                name: '',
                description: '',
                price: '',
                duration: '',
                specialty_id: ''
            }
        };
    }

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        try {
            this.setState({ loading: true });
            const [servicesRes, specialtiesRes] = await Promise.all([
                api.get('/api/admin/services'),
                api.get('/api/public/specialties')
            ]);
            this.setState({
                services: servicesRes.data.services || servicesRes.data || [],
                specialties: specialtiesRes.data || []
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            try {
                const publicRes = await api.get('/api/public/services');
                this.setState({ services: publicRes.data || [] });
            } catch (e) {
                console.error('Error fetching public services:', e);
            }
        } finally {
            this.setState({ loading: false });
        }
    };

    getFilteredServices = () => {
        const { services, searchTerm, filterSpecialty } = this.state;
        return services.filter(service => {
            const matchSearch = service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchSpecialty = filterSpecialty === 'all' ||
                service.specialty_id === parseInt(filterSpecialty);
            return matchSearch && matchSpecialty;
        });
    };

    formatPrice = (price) => {
        if (!price) return 'Liên hệ';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    getSpecialtyName = (specialtyId) => {
        const specialty = this.state.specialties.find(s => s.id === specialtyId);
        return specialty?.name || 'Chưa phân loại';
    };

    getSpecialtyIcon = (specialtyId) => {
        const icons = {
            1: '💊', 2: '🔪', 3: '🤰', 4: '👶', 5: '❤️',
            6: '🧠', 7: '🫁', 8: '😮‍💨', 9: '👂', 10: '👁️',
            11: '🧴', 12: '🦷', 13: '🦴', 14: '🎗️', 15: '🧘'
        };
        return icons[specialtyId] || '💡';
    };

    handleAdd = () => {
        this.setState({
            modalMode: 'add',
            selectedService: null,
            formData: { name: '', description: '', price: '', duration: '', specialty_id: '' },
            showModal: true
        });
    };

    handleEdit = (service) => {
        this.setState({
            modalMode: 'edit',
            selectedService: service,
            formData: {
                name: service.name || '',
                description: service.description || '',
                price: service.price || '',
                duration: service.duration || '',
                specialty_id: service.specialty_id || ''
            },
            showModal: true
        });
    };

    handleSubmit = async (e) => {
        e.preventDefault();
        const { formData, modalMode, selectedService } = this.state;

        if (!formData.name.trim()) {
            alert('Vui lòng nhập tên dịch vụ');
            return;
        }

        try {
            this.setState({ submitting: true });

            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: formData.price ? Number(formData.price) : 0,
                duration: formData.duration ? Number(formData.duration) : null,
                specialty_id: formData.specialty_id ? Number(formData.specialty_id) : null
            };

            if (modalMode === 'add') {
                await api.post('/api/admin/services', payload);
                alert('✅ Thêm dịch vụ thành công!');
            } else {
                await api.put(`/api/admin/services/${selectedService.id}`, payload);
                alert('✅ Cập nhật dịch vụ thành công!');
            }

            this.setState({ showModal: false });
            this.fetchData();
        } catch (error) {
            console.error('Error saving service:', error);
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể lưu dịch vụ'));
        } finally {
            this.setState({ submitting: false });
        }
    };

    handleDelete = async (service) => {
        if (!confirm(`Bạn có chắc muốn xóa dịch vụ "${service.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/api/admin/services/${service.id}`);
            alert('✅ Xóa dịch vụ thành công!');
            this.fetchData();
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Không thể xóa dịch vụ'));
        }
    };

    render() {
        const { services, specialties, loading, searchTerm, filterSpecialty, showModal, modalMode, submitting, formData } = this.state;

        const filteredServices = this.getFilteredServices();
        const totalServices = services.length;
        const avgPrice = services.length > 0
            ? Math.round(services.reduce((sum, s) => sum + Number(s.price || 0), 0) / services.length)
            : 0;
        const specialtyCount = [...new Set(services.map(s => s.specialty_id))].filter(Boolean).length;

        if (loading) {
            return (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            );
        }

        return (
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1>Quản lý Dịch vụ</h1>
                        <p>Quản lý danh sách dịch vụ khám chữa bệnh</p>
                    </div>
                    <button className={styles.btnAdd} onClick={this.handleAdd}>
                        Thêm dịch vụ
                    </button>
                </div>

                {/* Stats */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>📋</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{totalServices}</span>
                            <span className={styles.statLabel}>Tổng dịch vụ</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>💰</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{this.formatPrice(avgPrice)}</span>
                            <span className={styles.statLabel}>Giá trung bình</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🏥</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{specialtyCount}</span>
                            <span className={styles.statLabel}>Chuyên khoa</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🔍</div>
                        <div className={styles.statInfo}>
                            <span className={styles.statValue}>{filteredServices.length}</span>
                            <span className={styles.statLabel}>Hiển thị</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.searchBox}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => this.setState({ searchTerm: e.target.value })}
                        />
                    </div>
                    <select
                        value={filterSpecialty}
                        onChange={(e) => this.setState({ filterSpecialty: e.target.value })}
                        className={styles.filterSelect}
                    >
                        <option value="all">Tất cả chuyên khoa</option>
                        {specialties.map(sp => (
                            <option key={sp.id} value={sp.id}>
                                {sp.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Services Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên dịch vụ</th>
                                <th>Chuyên khoa</th>
                                <th>Giá</th>
                                <th>Thời gian</th>
                                <th>Mô tả</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className={styles.emptyRow}>
                                        Không tìm thấy dịch vụ nào
                                    </td>
                                </tr>
                            ) : (
                                filteredServices.map(service => (
                                    <tr key={service.id}>
                                        <td className={styles.idCell}>{service.id}</td>
                                        <td className={styles.nameCell}>
                                            <span className={styles.serviceIcon}>
                                                {this.getSpecialtyIcon(service.specialty_id)}
                                            </span>
                                            {service.name}
                                        </td>
                                        <td>
                                            <span className={styles.specialtyBadge}>
                                                {this.getSpecialtyName(service.specialty_id)}
                                            </span>
                                        </td>
                                        <td className={styles.priceCell}>
                                            {this.formatPrice(service.price)}
                                        </td>
                                        <td className={styles.durationCell}>
                                            {service.duration ? `${service.duration} phút` : '-'}
                                        </td>
                                        <td className={styles.descCell}>
                                            {service.description?.length > 50
                                                ? service.description.substring(0, 50) + '...'
                                                : service.description || '-'}
                                        </td>
                                        <td className={styles.actionsCell}>
                                            <button
                                                className={styles.btnEdit}
                                                onClick={() => this.handleEdit(service)}
                                                title="Sửa"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                className={styles.btnDelete}
                                                onClick={() => this.handleDelete(service)}
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

                {/* Modal */}
                {showModal && (
                    <div className={styles.modalOverlay} onClick={() => this.setState({ showModal: false })}>
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2>{modalMode === 'add' ? 'Thêm dịch vụ mới' : 'Sửa dịch vụ'}</h2>
                                <button
                                    className={styles.closeBtn}
                                    onClick={() => this.setState({ showModal: false })}
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={this.handleSubmit} className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>Tên dịch vụ <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => this.setState({ formData: { ...formData, name: e.target.value } })}
                                        placeholder="Nhập tên dịch vụ"
                                        required
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Chuyên khoa</label>
                                        <select
                                            value={formData.specialty_id}
                                            onChange={(e) => this.setState({ formData: { ...formData, specialty_id: e.target.value } })}
                                        >
                                            <option value="">Chọn chuyên khoa</option>
                                            {specialties.map(sp => (
                                                <option key={sp.id} value={sp.id}>
                                                    {sp.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Giá (VNĐ)</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => this.setState({ formData: { ...formData, price: e.target.value } })}
                                            placeholder="0"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Thời gian (phút)</label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => this.setState({ formData: { ...formData, duration: e.target.value } })}
                                        placeholder="30"
                                        min="0"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Mô tả</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => this.setState({ formData: { ...formData, description: e.target.value } })}
                                        placeholder="Mô tả chi tiết về dịch vụ..."
                                        rows={3}
                                    />
                                </div>

                                <div className={styles.modalActions}>
                                    <button
                                        type="button"
                                        className={styles.btnCancel}
                                        onClick={() => this.setState({ showModal: false })}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.btnSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Đang lưu...' : (modalMode === 'add' ? 'Thêm' : 'Lưu')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export default Services;
