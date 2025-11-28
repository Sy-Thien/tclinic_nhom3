import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AdminTimeSlots.module.css';

export default function AdminTimeSlots() {
    const [doctors, setDoctors] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [searchDoctor, setSearchDoctor] = useState('');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateForm, setGenerateForm] = useState({
        doctor_id: '',
        start_date: '',
        end_date: '',
        slot_duration: 30
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchTimeSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/admin/doctors-list');
            setDoctors(response.data);
        } catch (error) {
            console.error('Lỗi lấy danh sách bác sĩ:', error);
        }
    };

    const fetchTimeSlots = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/admin/time-slots', {
                params: {
                    doctor_id: selectedDoctor,
                    date: selectedDate
                }
            });
            setTimeSlots(response.data.data || response.data || []);
        } catch (error) {
            console.error('Lỗi lấy khung giờ:', error);
            setTimeSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSlots = async (e) => {
        e.preventDefault();
        if (!generateForm.doctor_id || !generateForm.start_date || !generateForm.end_date) {
            alert('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/api/admin/time-slots/generate', generateForm);
            alert(`✅ ${response.data.message}`);
            setShowGenerateModal(false);
            if (selectedDoctor && selectedDate) {
                fetchTimeSlots();
            }
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Lỗi tạo khung giờ'));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSlot = async (slotId, currentStatus) => {
        try {
            await api.put(`/api/admin/time-slots/${slotId}`, {
                is_available: !currentStatus
            });
            fetchTimeSlots();
        } catch (error) {
            alert('❌ Lỗi khi thay đổi trạng thái');
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Bạn có chắc muốn xóa khung giờ này?')) return;
        try {
            await api.delete(`/api/admin/time-slots/${slotId}`);
            fetchTimeSlots();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Lỗi xóa khung giờ'));
        }
    };

    const handleDeleteAllSlots = async () => {
        if (!selectedDoctor || !selectedDate) return;
        if (!window.confirm(`Bạn có chắc muốn xóa TẤT CẢ khung giờ của ngày ${selectedDate}?`)) return;

        try {
            await api.delete('/api/admin/time-slots/bulk', {
                data: { doctor_id: selectedDoctor, date: selectedDate }
            });
            alert('✅ Đã xóa tất cả khung giờ');
            fetchTimeSlots();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Lỗi xóa khung giờ'));
        }
    };

    // Lọc bác sĩ theo tìm kiếm
    const filteredDoctors = doctors.filter(doc =>
        doc.full_name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
        doc.specialty?.name?.toLowerCase().includes(searchDoctor.toLowerCase())
    );

    const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor);

    // Format time
    const formatTime = (time) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>⏰ Quản Lý Khung Giờ</h1>
                    <p>Tạo và quản lý các khung giờ khám bệnh cụ thể cho từng ngày</p>
                </div>
                <button
                    className={styles.btnGenerate}
                    onClick={() => setShowGenerateModal(true)}
                >
                    ➕ Tạo khung giờ tự động
                </button>
            </div>

            <div className={styles.content}>
                {/* Bộ lọc */}
                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <label>👨‍⚕️ Chọn bác sĩ</label>
                        <input
                            type="text"
                            placeholder="🔍 Tìm bác sĩ..."
                            value={searchDoctor}
                            onChange={(e) => setSearchDoctor(e.target.value)}
                            className={styles.searchInput}
                        />
                        <div className={styles.doctorsList}>
                            {filteredDoctors.slice(0, 10).map(doctor => (
                                <button
                                    key={doctor.id}
                                    className={`${styles.doctorBtn} ${selectedDoctor === doctor.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedDoctor(doctor.id)}
                                >
                                    <span className={styles.doctorName}>{doctor.full_name}</span>
                                    <span className={styles.doctorSpecialty}>{doctor.specialty?.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>📅 Chọn ngày</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={today}
                            className={styles.dateInput}
                        />
                    </div>
                </div>

                {/* Hiển thị thông tin đang chọn */}
                {selectedDoctor && selectedDate && (
                    <div className={styles.selectedInfo}>
                        <span>📋 Khung giờ của <strong>{selectedDoctorInfo?.full_name}</strong></span>
                        <span>ngày <strong>{new Date(selectedDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                        {timeSlots.length > 0 && (
                            <button
                                className={styles.btnDeleteAll}
                                onClick={handleDeleteAllSlots}
                            >
                                🗑️ Xóa tất cả
                            </button>
                        )}
                    </div>
                )}

                {/* Danh sách khung giờ */}
                {selectedDoctor && selectedDate ? (
                    loading ? (
                        <div className={styles.loading}>⏳ Đang tải...</div>
                    ) : timeSlots.length > 0 ? (
                        <div className={styles.slotsGrid}>
                            {timeSlots.map(slot => (
                                <div
                                    key={slot.id}
                                    className={`${styles.slotCard} ${!slot.is_available ? styles.unavailable : ''} ${slot.current_patients >= slot.max_patients ? styles.full : ''}`}
                                >
                                    <div className={styles.slotTime}>
                                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </div>
                                    <div className={styles.slotInfo}>
                                        <span className={styles.slotPatients}>
                                            👥 {slot.current_patients || 0}/{slot.max_patients || 1}
                                        </span>
                                        {slot.room && (
                                            <span className={styles.slotRoom}>🏥 {slot.room}</span>
                                        )}
                                    </div>
                                    <div className={styles.slotStatus}>
                                        {!slot.is_available ? (
                                            <span className={styles.statusOff}>Đã tắt</span>
                                        ) : slot.current_patients >= slot.max_patients ? (
                                            <span className={styles.statusFull}>Đã đầy</span>
                                        ) : (
                                            <span className={styles.statusAvailable}>Còn chỗ</span>
                                        )}
                                    </div>
                                    <div className={styles.slotActions}>
                                        <button
                                            className={`${styles.btnToggle} ${!slot.is_available ? styles.toggleOn : ''}`}
                                            onClick={() => handleToggleSlot(slot.id, slot.is_available)}
                                            title={slot.is_available ? 'Tắt khung giờ' : 'Bật khung giờ'}
                                        >
                                            {slot.is_available ? '🔒' : '🔓'}
                                        </button>
                                        <button
                                            className={styles.btnDelete}
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            title="Xóa khung giờ"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>📭</div>
                            <p>Chưa có khung giờ nào cho ngày này</p>
                            <button
                                className={styles.btnGenerate}
                                onClick={() => {
                                    setGenerateForm(prev => ({
                                        ...prev,
                                        doctor_id: selectedDoctor,
                                        start_date: selectedDate,
                                        end_date: selectedDate
                                    }));
                                    setShowGenerateModal(true);
                                }}
                            >
                                ➕ Tạo khung giờ cho ngày này
                            </button>
                        </div>
                    )
                ) : (
                    <div className={styles.placeholder}>
                        <div className={styles.placeholderIcon}>👆</div>
                        <p>Vui lòng chọn bác sĩ và ngày để xem khung giờ</p>
                    </div>
                )}
            </div>

            {/* Modal tạo khung giờ tự động */}
            {showGenerateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowGenerateModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>➕ Tạo Khung Giờ Tự Động</h2>
                            <button className={styles.btnClose} onClick={() => setShowGenerateModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleGenerateSlots} className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Chọn bác sĩ <span className={styles.required}>*</span></label>
                                <select
                                    value={generateForm.doctor_id}
                                    onChange={(e) => setGenerateForm(prev => ({ ...prev, doctor_id: e.target.value }))}
                                    required
                                >
                                    <option value="">-- Chọn bác sĩ --</option>
                                    {doctors.map(doc => (
                                        <option key={doc.id} value={doc.id}>{doc.full_name} - {doc.specialty?.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Từ ngày <span className={styles.required}>*</span></label>
                                    <input
                                        type="date"
                                        value={generateForm.start_date}
                                        onChange={(e) => setGenerateForm(prev => ({ ...prev, start_date: e.target.value }))}
                                        min={today}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Đến ngày <span className={styles.required}>*</span></label>
                                    <input
                                        type="date"
                                        value={generateForm.end_date}
                                        onChange={(e) => setGenerateForm(prev => ({ ...prev, end_date: e.target.value }))}
                                        min={generateForm.start_date || today}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Thời lượng mỗi slot (phút)</label>
                                <select
                                    value={generateForm.slot_duration}
                                    onChange={(e) => setGenerateForm(prev => ({ ...prev, slot_duration: parseInt(e.target.value) }))}
                                >
                                    <option value={15}>15 phút</option>
                                    <option value={30}>30 phút</option>
                                    <option value={45}>45 phút</option>
                                    <option value={60}>60 phút</option>
                                </select>
                            </div>
                            <p className={styles.note}>
                                💡 Hệ thống sẽ tự động tạo khung giờ dựa theo lịch làm việc của bác sĩ (đã cấu hình ở phần "Lịch làm việc")
                            </p>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.btnCancel} onClick={() => setShowGenerateModal(false)}>
                                    Hủy
                                </button>
                                <button type="submit" className={styles.btnSubmit} disabled={loading}>
                                    {loading ? '⏳ Đang tạo...' : '✅ Tạo khung giờ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
