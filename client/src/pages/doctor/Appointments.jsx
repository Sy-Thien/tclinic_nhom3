import { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './Appointments.module.css';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [filter, selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filter !== 'all') params.append('status', filter);
      if (selectedDate) params.append('date', selectedDate);

      const response = await api.get(`/api/doctor/appointments?${params}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    if (!window.confirm('Xác nhận lịch hẹn này?')) return;

    try {
      await api.put(`/api/doctor/appointments/${id}/confirm`);
      alert('Xác nhận thành công!');
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi xác nhận');
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Lý do hủy:');
    if (!reason) return;

    try {
      await api.put(`/api/doctor/appointments/${id}/cancel`, { reason });
      alert('Hủy lịch thành công!');
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi hủy');
    }
  };

  const handleComplete = async (id) => {
    if (!window.confirm('Đánh dấu đã hoàn thành khám?')) return;

    try {
      await api.put(`/api/doctor/appointments/${id}/complete`);
      alert('Hoàn thành!');
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Chờ xác nhận', class: styles.pending },
      confirmed: { text: 'Đã xác nhận', class: styles.confirmed },
      completed: { text: 'Hoàn thành', class: styles.completed },
      cancelled: { text: 'Đã hủy', class: styles.cancelled }
    };
    const badge = badges[status] || { text: status, class: '' };
    return <span className={`${styles.badge} ${badge.class}`}>{badge.text}</span>;
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Lịch khám bệnh</h1>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Tổng lịch</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>Chờ xác nhận</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.confirmed}</span>
            <span className={styles.statLabel}>Đã xác nhận</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{stats.completed}</span>
            <span className={styles.statLabel}>Hoàn thành</span>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Tất cả</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          placeholder="Chọn ngày"
        />

        <button onClick={() => { setFilter('all'); setSelectedDate(''); }}>
          Xóa bộ lọc
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : appointments.length === 0 ? (
        <div className={styles.empty}>Không có lịch hẹn nào</div>
      ) : (
        <div className={styles.appointmentList}>
          {appointments.map(appointment => (
            <div key={appointment.id} className={styles.appointmentCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>{appointment.patient?.name || 'Khách vãng lai'}</h3>
                  <p className={styles.service}>
                    {appointment.service?.specialty?.name} - {appointment.service?.name}
                  </p>
                </div>
                {getStatusBadge(appointment.status)}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.info}>
                  <div className={styles.infoItem}>
                    <span className={styles.icon}>📅</span>
                    <div>
                      <strong>{appointment.appointment_date}</strong>
                      <span> lúc </span>
                      <strong>{appointment.appointment_hour}</strong>
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.icon}>👤</span>
                    <span>{appointment.patient?.phone}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.icon}>📧</span>
                    <span>{appointment.patient?.email}</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.icon}>💰</span>
                    <span>{appointment.service?.price?.toLocaleString()}đ</span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.icon}>⏱️</span>
                    <span>{appointment.service?.duration} phút</span>
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                {appointment.status === 'pending' && (
                  <>
                    <button
                      className={styles.btnConfirm}
                      onClick={() => handleConfirm(appointment.id)}
                    >
                      ✅ Xác nhận
                    </button>
                    <button
                      className={styles.btnCancel}
                      onClick={() => handleCancel(appointment.id)}
                    >
                      ❌ Hủy
                    </button>
                  </>
                )}

                {appointment.status === 'confirmed' && (
                  <>
                    <button
                      className={styles.btnComplete}
                      onClick={() => handleComplete(appointment.id)}
                    >
                      ✔️ Hoàn thành
                    </button>
                    <button
                      className={styles.btnCancel}
                      onClick={() => handleCancel(appointment.id)}
                    >
                      ❌ Hủy
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}