import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Doctors.module.css';

export default function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        gender: 0,
        birthday: '',
        address: '',
        specialty_id: '',
        degree: '',
        experience_years: 0,
        description: '',
        username: '',
        password: '',
        status: 1
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
        fetchSpecialties();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/admin/doctors');
            setDoctors(response.data.data || []);
        } catch (error) {
            console.error('Error:', error);
            if (error.response?.status === 403) {
                alert('Bạn không có quyền truy cập!');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data || []);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.full_name.trim()) {
            newErrors.full_name = 'Vui lòng nhập họ tên';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^[0-9]{10}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại không hợp lệ';
        }

        if (!formData.specialty_id) {
            newErrors.specialty_id = 'Vui lòng chọn chuyên khoa';
        }

        if (!editMode) {
            if (!formData.username.trim()) {
                newErrors.username = 'Vui lòng nhập username';
            }

            if (!formData.password.trim()) {
                newErrors.password = 'Vui lòng nhập password';
            } else if (formData.password.length < 6) {
                newErrors.password = 'Password phải có ít nhất 6 ký tự';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (editMode) {
                await api.put(`/api/admin/doctors/${selectedDoctor.id}`, formData);
                alert('✅ Cập nhật bác sĩ thành công!');
            } else {
                await api.post('/api/admin/doctors', formData);
                alert('✅ Thêm bác sĩ thành công!');
            }

            setShowModal(false);
            resetForm();
            fetchDoctors();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Có lỗi xảy ra!');
        }
    };

    const handleEdit = (doctor) => {
        setEditMode(true);
        setSelectedDoctor(doctor);
        setFormData({
            full_name: doctor.full_name || '',
            email: doctor.email || '',
            phone: doctor.phone || '',
            gender: doctor.gender || 0,
            birthday: doctor.birthday || '',
            address: doctor.address || '',
            specialty_id: doctor.specialty_id || '',
            degree: doctor.degree || '',
            experience_years: doctor.experience_years || 0,
            description: doctor.description || '',
            status: doctor.status || 1,
            username: '',
            password: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa bác sĩ này?')) return;

        try {
            await api.delete(`/api/admin/doctors/${id}`);
            alert('✅ Xóa bác sĩ thành công!');
            fetchDoctors();
        } catch (error) {
            console.error('Error:', error);
            alert(error.response?.data?.message || '❌ Không thể xóa bác sĩ!');
        }
    };

    const handleResetPassword = async (id) => {
        const newPassword = prompt('Nhập mật khẩu mới (tối thiểu 6 ký tự):');

        if (!newPassword) return;

        if (newPassword.length < 6) {
            alert('❌ Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }

        try {
            await api.put(`/api/admin/doctors/${id}/reset-password`, {
                new_password: newPassword
            });
            alert('✅ Reset mật khẩu thành công!');
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Lỗi khi reset mật khẩu!');
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            phone: '',
            gender: 0,
            birthday: '',
            address: '',
            specialty_id: '',
            degree: '',
            experience_years: 0,
            description: '',
            username: '',
            password: '',
            status: 1
        });
        setErrors({});
        setEditMode(false);
        setSelectedDoctor(null);
    };

    if (loading) {
        return <div className={styles.loading}>Đang tải...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>👨‍⚕️ Quản Lý Bác Sĩ</h1>
                    <p>Tổng số: {doctors.length} bác sĩ</p>
                </div>
                <button
                    className={styles.btnAdd}
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    ➕ Thêm bác sĩ
                </button>
            </div>

            {/* TABLE */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Chuyên khoa</th>
                            <th>Bằng cấp</th>
                            <th>Kinh nghiệm</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.length === 0 ? (
                            <tr>
                                <td colSpan="8" className={styles.empty}>
                                    Chưa có bác sĩ nào
                                </td>
                            </tr>
                        ) : (
                            doctors.map(doctor => (
                                <tr key={doctor.id}>
                                    <td>
                                        <div className={styles.doctorInfo}>
                                            <div className={styles.doctorName}>{doctor.full_name}</div>
                                            {doctor.username && (
                                                <div className={styles.username}>@{doctor.username}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{doctor.email}</td>
                                    <td>{doctor.phone}</td>
                                    <td className={styles.specialty}>{doctor.specialty_name}</td>
                                    <td>{doctor.degree || 'Chưa cập nhật'}</td>
                                    <td>{doctor.experience_years || 0} năm</td>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            style={{
                                                background: doctor.status ? '#10b981' : '#ef4444'
                                            }}
                                        >
                                            {doctor.status ? 'Hoạt động' : 'Vô hiệu hóa'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.btnEdit}
                                                onClick={() => handleEdit(doctor)}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                className={styles.btnReset}
                                                onClick={() => handleResetPassword(doctor.id)}
                                            >
                                                🔑 Reset PW
                                            </button>
                                            <button
                                                className={styles.btnDelete}
                                                onClick={() => handleDelete(doctor.id)}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>{editMode ? '✏️ Sửa bác sĩ' : '➕ Thêm bác sĩ mới'}</h2>
                            <button
                                className={styles.btnClose}
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Họ tên <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        placeholder="Nguyễn Văn A"
                                    />
                                    {errors.full_name && <span className={styles.error}>{errors.full_name}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Email <span className={styles.required}>*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="doctor@example.com"
                                    />
                                    {errors.email && <span className={styles.error}>{errors.email}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số điện thoại <span className={styles.required}>*</span></label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="0901234567"
                                    />
                                    {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Giới tính</label>
                                    <select name="gender" value={formData.gender} onChange={handleInputChange}>
                                        <option value={0}>Nam</option>
                                        <option value={1}>Nữ</option>
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Ngày sinh</label>
                                    <input
                                        type="date"
                                        name="birthday"
                                        value={formData.birthday}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Chuyên khoa <span className={styles.required}>*</span></label>
                                    <select
                                        name="specialty_id"
                                        value={formData.specialty_id}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">-- Chọn chuyên khoa --</option>
                                        {specialties.map(sp => (
                                            <option key={sp.id} value={sp.id}>{sp.name}</option>
                                        ))}
                                    </select>
                                    {errors.specialty_id && <span className={styles.error}>{errors.specialty_id}</span>}
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Bằng cấp</label>
                                    <input
                                        type="text"
                                        name="degree"
                                        value={formData.degree}
                                        onChange={handleInputChange}
                                        placeholder="Thạc sĩ, Tiến sĩ, ..."
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Kinh nghiệm (năm)</label>
                                    <input
                                        type="number"
                                        name="experience_years"
                                        value={formData.experience_years}
                                        onChange={handleInputChange}
                                        min="0"
                                    />
                                </div>

                                {!editMode && (
                                    <>
                                        <div className={styles.formGroup}>
                                            <label>Username <span className={styles.required}>*</span></label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                placeholder="doctor01"
                                            />
                                            {errors.username && <span className={styles.error}>{errors.username}</span>}
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Password <span className={styles.required}>*</span></label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Tối thiểu 6 ký tự"
                                            />
                                            {errors.password && <span className={styles.error}>{errors.password}</span>}
                                        </div>
                                    </>
                                )}

                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Địa chỉ</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Số nhà, đường, quận, thành phố"
                                    />
                                </div>

                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                    <label>Mô tả</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Giới thiệu về bác sĩ..."
                                    />
                                </div>

                                {editMode && (
                                    <div className={styles.formGroup}>
                                        <label>Trạng thái</label>
                                        <select name="status" value={formData.status} onChange={handleInputChange}>
                                            <option value={1}>Hoạt động</option>
                                            <option value={0}>Vô hiệu hóa</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.btnCancel}
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnSubmit}>
                                    {editMode ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
