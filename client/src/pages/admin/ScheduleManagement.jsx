import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './ScheduleManagement.module.css';

export default function ScheduleManagement() {
    const [doctors, setDoctors] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('day'); // day, week, month

    // Form state
    const [formData, setFormData] = useState({
        doctor_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '09:00',
        max_patients: 1,
        room_id: '',
        note: ''
    });

    // Multiple slots form
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkData, setBulkData] = useState({
        doctor_id: '',
        date: new Date().toISOString().split('T')[0],
        room_id: '',
        time_interval: 60, // minutes
        start_time: '08:00',
        end_time: '17:00',
        break_start: '12:00',
        break_end: '13:00',
        max_patients_per_slot: 1
    });

    useEffect(() => {
        fetchDoctors();
        fetchRooms();
    }, []);

    useEffect(() => {
        if (selectedDoctor || selectedDate) {
            fetchTimeSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/doctors-list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(response.data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchRooms = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/rooms', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const fetchTimeSlots = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (selectedDoctor) params.append('doctor_id', selectedDoctor);
            if (selectedDate) params.append('date', selectedDate);

            const response = await axios.get(`http://localhost:5000/api/admin/time-slots?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTimeSlots(response.data);
        } catch (error) {
            console.error('Error fetching time slots:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBulkChange = (e) => {
        const { name, value } = e.target;
        setBulkData(prev => ({ ...prev, [name]: value }));
    };

    const generateTimeSlots = () => {
        const slots = [];
        const { start_time, end_time, break_start, break_end, time_interval } = bulkData;

        let currentTime = start_time;
        const endTimeValue = end_time;

        while (currentTime < endTimeValue) {
            // Tính end time của slot
            const [hours, minutes] = currentTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + parseInt(time_interval);
            const endHours = Math.floor(totalMinutes / 60);
            const endMinutes = totalMinutes % 60;
            const slotEndTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

            // Kiểm tra xem có trong giờ nghỉ không
            const isBreakTime = break_start && break_end &&
                currentTime >= break_start && currentTime < break_end;

            if (!isBreakTime && slotEndTime <= endTimeValue) {
                slots.push({
                    start_time: currentTime,
                    end_time: slotEndTime,
                    max_patients: parseInt(bulkData.max_patients_per_slot)
                });
            }

            currentTime = slotEndTime;
        }

        return slots;
    };

    const handleSubmitSingle = async (e) => {
        e.preventDefault();

        if (!formData.doctor_id) {
            alert('Vui lòng chọn bác sĩ');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/admin/time-slots', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Tạo khung giờ thành công');
            fetchTimeSlots();
            // Reset form
            setFormData({
                doctor_id: formData.doctor_id,
                date: formData.date,
                start_time: '08:00',
                end_time: '09:00',
                max_patients: 1,
                room_id: '',
                note: ''
            });
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const handleSubmitBulk = async (e) => {
        e.preventDefault();

        if (!bulkData.doctor_id) {
            alert('Vui lòng chọn bác sĩ');
            return;
        }

        const slots = generateTimeSlots();

        if (slots.length === 0) {
            alert('Không có khung giờ nào được tạo');
            return;
        }

        if (!window.confirm(`Bạn muốn tạo ${slots.length} khung giờ?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/admin/time-slots/multiple', {
                doctor_id: bulkData.doctor_id,
                date: bulkData.date,
                room_id: bulkData.room_id || null,
                slots
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Tạo lịch khám thành công');
            fetchTimeSlots();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const handleDelete = async (slotId) => {
        if (!window.confirm('Bạn có chắc muốn xóa khung giờ này?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/admin/time-slots/${slotId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Xóa khung giờ thành công');
            fetchTimeSlots();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const handleToggleAvailability = async (slot) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/admin/time-slots/${slot.id}`, {
                is_available: !slot.is_available
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchTimeSlots();
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const groupSlotsByDoctor = () => {
        const grouped = {};
        timeSlots.forEach(slot => {
            const doctorName = slot.doctor?.full_name || 'Unknown';
            if (!grouped[doctorName]) {
                grouped[doctorName] = [];
            }
            grouped[doctorName].push(slot);
        });
        return grouped;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>📅 Quản Lý Lịch Khám Bệnh</h1>
                    <p>Tạo và quản lý các khung giờ khám bệnh cho bác sĩ</p>
                </div>
                <button
                    className={styles.btnToggleMode}
                    onClick={() => setBulkMode(!bulkMode)}
                >
                    {bulkMode ? '➡️ Chế độ đơn' : '📋 Tạo hàng loạt'}
                </button>
            </div>

            <div className={styles.content}>
                {/* FORM SECTION */}
                <div className={styles.formSection}>
                    {!bulkMode ? (
                        // SINGLE SLOT FORM
                        <div className={styles.card}>
                            <h2>➕ Thêm Khung Giờ Đơn</h2>
                            <form onSubmit={handleSubmitSingle} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Bác sĩ *</label>
                                        <select
                                            name="doctor_id"
                                            value={formData.doctor_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">-- Chọn bác sĩ --</option>
                                            {doctors.map(doctor => (
                                                <option key={doctor.id} value={doctor.id}>
                                                    {doctor.full_name} - {doctor.specialty?.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Ngày khám *</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Giờ bắt đầu *</label>
                                        <input
                                            type="time"
                                            name="start_time"
                                            value={formData.start_time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Giờ kết thúc *</label>
                                        <input
                                            type="time"
                                            name="end_time"
                                            value={formData.end_time}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Số BN tối đa *</label>
                                        <input
                                            type="number"
                                            name="max_patients"
                                            value={formData.max_patients}
                                            onChange={handleChange}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Phòng khám</label>
                                        <select
                                            name="room_id"
                                            value={formData.room_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">-- Không chọn --</option>
                                            {rooms.map(room => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name} - Tầng {room.floor}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Ghi chú</label>
                                        <input
                                            type="text"
                                            name="note"
                                            value={formData.note}
                                            onChange={handleChange}
                                            placeholder="Ghi chú (nếu có)"
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={styles.btnSubmit}>
                                    ➕ Thêm Khung Giờ
                                </button>
                            </form>
                        </div>
                    ) : (
                        // BULK CREATION FORM
                        <div className={styles.card}>
                            <h2>📋 Tạo Lịch Khám Hàng Loạt</h2>
                            <form onSubmit={handleSubmitBulk} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Bác sĩ *</label>
                                        <select
                                            name="doctor_id"
                                            value={bulkData.doctor_id}
                                            onChange={handleBulkChange}
                                            required
                                        >
                                            <option value="">-- Chọn bác sĩ --</option>
                                            {doctors.map(doctor => (
                                                <option key={doctor.id} value={doctor.id}>
                                                    {doctor.full_name} - {doctor.specialty?.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Ngày khám *</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={bulkData.date}
                                            onChange={handleBulkChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Phòng khám</label>
                                        <select
                                            name="room_id"
                                            value={bulkData.room_id}
                                            onChange={handleBulkChange}
                                        >
                                            <option value="">-- Không chọn --</option>
                                            {rooms.map(room => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name} - Tầng {room.floor}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Giờ bắt đầu làm việc *</label>
                                        <input
                                            type="time"
                                            name="start_time"
                                            value={bulkData.start_time}
                                            onChange={handleBulkChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Giờ kết thúc làm việc *</label>
                                        <input
                                            type="time"
                                            name="end_time"
                                            value={bulkData.end_time}
                                            onChange={handleBulkChange}
                                            required
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Khoảng cách (phút) *</label>
                                        <select
                                            name="time_interval"
                                            value={bulkData.time_interval}
                                            onChange={handleBulkChange}
                                            required
                                        >
                                            <option value="15">15 phút</option>
                                            <option value="30">30 phút</option>
                                            <option value="45">45 phút</option>
                                            <option value="60">60 phút</option>
                                            <option value="90">90 phút</option>
                                            <option value="120">120 phút</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.breakTimeSection}>
                                    <h3>⏸️ Giờ Nghỉ Trưa (Tùy Chọn)</h3>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label>Bắt đầu nghỉ</label>
                                            <input
                                                type="time"
                                                name="break_start"
                                                value={bulkData.break_start}
                                                onChange={handleBulkChange}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Kết thúc nghỉ</label>
                                            <input
                                                type="time"
                                                name="break_end"
                                                value={bulkData.break_end}
                                                onChange={handleBulkChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Số BN tối đa mỗi khung giờ *</label>
                                    <input
                                        type="number"
                                        name="max_patients_per_slot"
                                        value={bulkData.max_patients_per_slot}
                                        onChange={handleBulkChange}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className={styles.previewInfo}>
                                    <p>Sẽ tạo khoảng <strong>{generateTimeSlots().length}</strong> khung giờ</p>
                                </div>

                                <button type="submit" className={styles.btnSubmit}>
                                    📋 Tạo Lịch Hàng Loạt
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* VIEW SECTION */}
                <div className={styles.viewSection}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>📋 Danh Sách Khung Giờ</h2>
                            <div className={styles.filters}>
                                <select
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                    className={styles.filterSelect}
                                >
                                    <option value="">Tất cả bác sĩ</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.full_name}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className={styles.filterDate}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className={styles.loading}>⏳ Đang tải...</div>
                        ) : timeSlots.length === 0 ? (
                            <div className={styles.empty}>
                                <p>📭 Không có khung giờ nào</p>
                            </div>
                        ) : (
                            <div className={styles.slotsContainer}>
                                {Object.entries(groupSlotsByDoctor()).map(([doctorName, slots]) => (
                                    <div key={doctorName} className={styles.doctorSection}>
                                        <h3 className={styles.doctorName}>👨‍⚕️ {doctorName}</h3>
                                        <div className={styles.slotsGrid}>
                                            {slots.map(slot => (
                                                <div
                                                    key={slot.id}
                                                    className={`${styles.slotCard} ${!slot.is_available ? styles.slotUnavailable : ''
                                                        } ${slot.current_patients >= slot.max_patients ? styles.slotFull : ''
                                                        }`}
                                                >
                                                    <div className={styles.slotTime}>
                                                        <strong>{slot.start_time}</strong>
                                                        <span>→</span>
                                                        <strong>{slot.end_time}</strong>
                                                    </div>

                                                    <div className={styles.slotInfo}>
                                                        <span className={styles.slotDate}>📅 {slot.date}</span>
                                                        <span className={styles.slotPatients}>
                                                            👥 {slot.current_patients}/{slot.max_patients}
                                                        </span>
                                                        {slot.room && (
                                                            <span className={styles.slotRoom}>
                                                                🏥 {slot.room.name}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {slot.note && (
                                                        <div className={styles.slotNote}>📝 {slot.note}</div>
                                                    )}

                                                    <div className={styles.slotActions}>
                                                        <button
                                                            className={styles.btnToggle}
                                                            onClick={() => handleToggleAvailability(slot)}
                                                            title={slot.is_available ? 'Tắt' : 'Bật'}
                                                        >
                                                            {slot.is_available ? '✅' : '❌'}
                                                        </button>
                                                        <button
                                                            className={styles.btnDelete}
                                                            onClick={() => handleDelete(slot.id)}
                                                            disabled={slot.current_patients > 0}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
