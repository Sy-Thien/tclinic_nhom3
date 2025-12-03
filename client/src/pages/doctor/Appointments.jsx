import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Appointments.module.css';

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [realtimeMode, setRealtimeMode] = useState(true); // 🔥 Mặc định BẬT realtime
  const [currentTime, setCurrentTime] = useState(new Date());

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  };
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // Cập nhật giờ hiện tại mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filter, selectedDate, realtimeMode]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filter !== 'all') params.append('status', filter);
      if (selectedDate) params.append('date', selectedDate);
      if (realtimeMode) params.append('realtime', 'true'); // 🔥 REALTIME mode

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
        <div>
          <h1>Lịch khám bệnh - Hôm nay {new Date().toLocaleDateString('vi-VN')}</h1>
          <p style={{ color: '#667eea', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '10px' }}>
            🕐 Giờ hiện tại: {currentTime.toLocaleTimeString('vi-VN')}
          </p>
        </div>

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
        <button
          onClick={() => setRealtimeMode(!realtimeMode)}
          style={{
            padding: '10px 20px',
            background: realtimeMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e0e0e0',
            color: realtimeMode ? 'white' : '#666',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          {realtimeMode ? '🔥 REALTIME (±30 phút)' : '📅 Xem tất cả'}
        </button>

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
          title={realtimeMode ? 'Tắt REALTIME để chọn ngày' : 'Chọn ngày'}
          disabled={realtimeMode}
          style={{ opacity: realtimeMode ? 0.5 : 1, cursor: realtimeMode ? 'not-allowed' : 'pointer' }}
        />

        <button onClick={() => { setFilter('all'); setSelectedDate(getTodayDate()); }}>
          Xóa bộ lọc
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : appointments.length === 0 ? (
        <div className={styles.empty}>
          {realtimeMode ? (
            <>
              <h3>🕐 Không có lịch khám trong giờ này</h3>
              <p style={{ marginTop: '10px', color: '#666' }}>
                Giờ hiện tại: <strong>{currentTime.toLocaleTimeString('vi-VN')}</strong>
              </p>
              <p style={{ color: '#666' }}>
                Chỉ hiển thị lịch khám trong khoảng <strong>± 30 phút</strong>
              </p>
              <button
                onClick={() => setRealtimeMode(false)}
                style={{
                  marginTop: '20px',
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📅 Xem tất cả lịch hôm nay
              </button>
            </>
          ) : (
            'Không có lịch hẹn nào'
          )}
        </div>
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
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {realtimeMode && (
                    <span style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #f39c12 0%, #e74c3c 100%)',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      animation: 'pulse 2s infinite'
                    }}>
                      🔥 ĐANG KHÁM
                    </span>
                  )}
                  {getStatusBadge(appointment.status)}
                </div>
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
                      className={styles.btnExamine}
                      onClick={() => {
                        // 🔥 Kiểm tra ĐÃ ĐẾN GIỜ chưa (± 30 phút)
                        const now = new Date();
                        const appointmentTime = appointment.appointment_time; // HH:mm
                        const [hours, minutes] = appointmentTime.split(':').map(Number);
                        const appointmentMinutes = hours * 60 + minutes;
                        const currentMinutes = now.getHours() * 60 + now.getMinutes();
                        const diff = Math.abs(currentMinutes - appointmentMinutes);

                        if (diff > 30) {
                          alert(`⏰ Chưa đến giờ khám!\n\nGiờ hẹn: ${appointmentTime}\nGiờ hiện tại: ${now.toTimeString().substring(0, 5)}\n\nVui lòng chờ đến giờ hoặc bật chế độ REALTIME.`);
                          return;
                        }

                        navigate('/doctor-portal/examination', {
                          state: {
                            appointment: {
                              ...appointment,
                              patient_name: appointment.patient?.name || appointment.patient?.full_name || 'Khách vãng lai',
                              patient_phone: appointment.patient?.phone || '',
                              patient_email: appointment.patient?.email || '',
                              patient_dob: appointment.patient?.birthday || '',
                              patient_gender: appointment.patient?.gender || '',
                              patient_address: appointment.patient?.address || ''
                            }
                          }
                        });
                      }}
                    >
                      🩺 Khám bệnh
                    </button>
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