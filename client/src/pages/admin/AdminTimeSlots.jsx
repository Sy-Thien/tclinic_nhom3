import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import styles from './AdminTimeSlots.module.css';

export default function AdminTimeSlots() {
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('all');
    const [searchDoctor, setSearchDoctor] = useState('');
    const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

    // Doctor schedule (lịch định kỳ)
    const [doctorSchedule, setDoctorSchedule] = useState([]);

    // Computed slots (tính từ schedule + bookings)
    const [weekData, setWeekData] = useState({});

    // Locked slots (chỉ lưu những slot bị khóa đặc biệt)
    const [lockedSlots, setLockedSlots] = useState({});

    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOptions = [
        { value: 'Thứ 2', index: 1 },
        { value: 'Thứ 3', index: 2 },
        { value: 'Thứ 4', index: 3 },
        { value: 'Thứ 5', index: 4 },
        { value: 'Thứ 6', index: 5 },
        { value: 'Thứ 7', index: 6 },
        { value: 'Chủ nhật', index: 0 }
    ];

    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function getWeekDates(startDate) {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            dates.push(d);
        }
        return dates;
    }

    function generateSlotsFromSchedule(schedule, slotDuration = 30) {
        if (!schedule) return [];

        const slots = [];
        const [startHour, startMin] = schedule.start_time.split(':').map(Number);
        const [endHour, endMin] = schedule.end_time.split(':').map(Number);

        let breakStart = null, breakEnd = null;
        if (schedule.break_start && schedule.break_end) {
            const [bsH, bsM] = schedule.break_start.split(':').map(Number);
            const [beH, beM] = schedule.break_end.split(':').map(Number);
            breakStart = bsH * 60 + bsM;
            breakEnd = beH * 60 + beM;
        }

        let current = startHour * 60 + startMin;
        const end = endHour * 60 + endMin;

        while (current + slotDuration <= end) {
            const slotStart = current;
            const slotEnd = current + slotDuration;

            // Skip break time
            if (breakStart !== null && breakEnd !== null) {
                if (slotStart < breakEnd && slotEnd > breakStart) {
                    current += slotDuration;
                    continue;
                }
            }

            const startStr = `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}`;
            const endStr = `${String(Math.floor(slotEnd / 60)).padStart(2, '0')}:${String(slotEnd % 60).padStart(2, '0')}`;

            slots.push({ start: startStr, end: endStr });
            current += slotDuration;
        }

        return slots;
    }

    useEffect(() => {
        fetchDoctors();
        fetchSpecialties();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            fetchDoctorSchedule();
        }
    }, [selectedDoctor]);

    useEffect(() => {
        if (selectedDoctor && doctorSchedule.length > 0) {
            fetchWeekData();
        }
    }, [selectedDoctor, currentWeekStart, doctorSchedule]);

    const fetchDoctors = async () => {
        try {
            const response = await api.get('/api/admin/doctors-list');
            setDoctors(response.data);
        } catch (error) {
            console.error('Lỗi lấy danh sách bác sĩ:', error);
        }
    };

    const fetchSpecialties = async () => {
        try {
            const response = await api.get('/api/public/specialties');
            setSpecialties(response.data);
        } catch (error) {
            console.error('Lỗi lấy chuyên khoa:', error);
        }
    };

    const fetchDoctorSchedule = async () => {
        try {
            const response = await api.get(`/api/admin/doctor-schedules/${selectedDoctor}`);
            setDoctorSchedule(response.data || []);
        } catch (error) {
            console.error('Lỗi lấy lịch bác sĩ:', error);
            setDoctorSchedule([]);
        }
    };

    const fetchWeekData = async () => {
        if (!selectedDoctor) return;

        try {
            setLoading(true);
            const weekDates = getWeekDates(currentWeekStart);
            const data = {};
            const locked = {};

            // Map schedule by day
            const scheduleByDay = {};
            doctorSchedule.forEach(s => {
                const dayIndex = dayOptions.find(d => d.value === s.day_of_week)?.index;
                if (dayIndex !== undefined) {
                    scheduleByDay[dayIndex] = s;
                }
            });

            await Promise.all(weekDates.map(async (date) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayIndex = date.getDay();
                const schedule = scheduleByDay[dayIndex];

                if (!schedule || !schedule.is_active) {
                    data[dateStr] = { hasSchedule: false, slots: [], bookings: [] };
                    return;
                }

                // Generate slots từ schedule
                const generatedSlots = generateSlotsFromSchedule(schedule);

                // Lấy bookings của ngày này
                try {
                    const bookingsRes = await api.get('/api/admin/bookings', {
                        params: {
                            doctor_id: selectedDoctor,
                            appointment_date: dateStr,
                            status: 'pending,confirmed'
                        }
                    });
                    const bookings = bookingsRes.data?.data || bookingsRes.data || [];

                    // Lấy locked slots nếu có
                    try {
                        const lockedRes = await api.get('/api/admin/time-slots', {
                            params: { doctor_id: selectedDoctor, date: dateStr }
                        });
                        const lockedData = lockedRes.data?.data || lockedRes.data || [];
                        lockedData.forEach(slot => {
                            if (!slot.is_available) {
                                const key = `${dateStr}_${slot.start_time.substring(0, 5)}`;
                                locked[key] = { id: slot.id, reason: slot.note || 'Đã khóa' };
                            }
                        });
                    } catch (err) {
                        // Ignore - no locked slots
                    }

                    // Merge slots với booking info
                    const slotsWithStatus = generatedSlots.map(slot => {
                        const booking = bookings.find(b =>
                            b.appointment_time && b.appointment_time.substring(0, 5) === slot.start
                        );
                        const lockedKey = `${dateStr}_${slot.start}`;
                        const isLocked = !!locked[lockedKey];

                        return {
                            ...slot,
                            isBooked: !!booking,
                            booking: booking || null,
                            isLocked,
                            lockedInfo: locked[lockedKey] || null
                        };
                    });

                    data[dateStr] = {
                        hasSchedule: true,
                        schedule,
                        slots: slotsWithStatus,
                        bookings
                    };
                } catch (err) {
                    data[dateStr] = {
                        hasSchedule: true,
                        schedule,
                        slots: generatedSlots.map(s => ({ ...s, isBooked: false, isLocked: false })),
                        bookings: []
                    };
                }
            }));

            setWeekData(data);
            setLockedSlots(locked);
        } catch (error) {
            console.error('Lỗi lấy dữ liệu tuần:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLockSlot = async (dateStr, slot) => {
        if (slot.isLocked && slot.lockedInfo?.id) {
            // Unlock
            try {
                await api.put(`/api/admin/time-slots/${slot.lockedInfo.id}`, { is_available: true });
                fetchWeekData();
            } catch (error) {
                alert('❌ Lỗi mở khóa slot');
            }
        } else {
            // Lock - create time slot record với is_available = false
            try {
                await api.post('/api/admin/time-slots', {
                    doctor_id: selectedDoctor,
                    date: dateStr,
                    start_time: slot.start + ':00',
                    end_time: slot.end + ':00',
                    is_available: false,
                    max_patients: 1,
                    note: 'Khóa thủ công'
                });
                fetchWeekData();
            } catch (error) {
                // Nếu slot đã tồn tại, cập nhật
                try {
                    const existingRes = await api.get('/api/admin/time-slots', {
                        params: { doctor_id: selectedDoctor, date: dateStr }
                    });
                    const existing = (existingRes.data?.data || existingRes.data || [])
                        .find(s => s.start_time.substring(0, 5) === slot.start);
                    if (existing) {
                        await api.put(`/api/admin/time-slots/${existing.id}`, { is_available: false });
                        fetchWeekData();
                    }
                } catch (err2) {
                    alert('❌ Lỗi khóa slot');
                }
            }
        }
    };

    const handleLockDay = async (dateStr, lock = true) => {
        const dayData = weekData[dateStr];
        if (!dayData || !dayData.hasSchedule) return;

        const action = lock ? 'Khóa' : 'Mở khóa';
        if (!window.confirm(`${action} TẤT CẢ khung giờ ngày ${new Date(dateStr).toLocaleDateString('vi-VN')}?`)) return;

        try {
            setLoading(true);
            for (const slot of dayData.slots) {
                if (slot.isBooked) continue; // Không khóa slot đã có lịch

                if (lock && !slot.isLocked) {
                    await api.post('/api/admin/time-slots', {
                        doctor_id: selectedDoctor,
                        date: dateStr,
                        start_time: slot.start + ':00',
                        end_time: slot.end + ':00',
                        is_available: false,
                        max_patients: 1,
                        note: 'Khóa cả ngày'
                    }).catch(() => { }); // Ignore if exists
                } else if (!lock && slot.isLocked && slot.lockedInfo?.id) {
                    await api.put(`/api/admin/time-slots/${slot.lockedInfo.id}`, { is_available: true });
                }
            }
            fetchWeekData();
        } catch (error) {
            alert('❌ Lỗi thao tác');
        } finally {
            setLoading(false);
        }
    };

    const goToPreviousWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const goToNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(getMonday(new Date()));
    };

    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.full_name.toLowerCase().includes(searchDoctor.toLowerCase()) ||
            doc.specialty?.name?.toLowerCase().includes(searchDoctor.toLowerCase());
        const matchesSpecialty = selectedSpecialty === 'all' || doc.specialty_id === parseInt(selectedSpecialty);
        return matchesSearch && matchesSpecialty;
    });

    const specialtyCounts = useMemo(() => {
        const counts = {};
        doctors.forEach(doc => {
            const specId = doc.specialty_id || 0;
            counts[specId] = (counts[specId] || 0) + 1;
        });
        return counts;
    }, [doctors]);

    const selectedDoctorInfo = doctors.find(d => d.id === selectedDoctor);
    const weekDates = getWeekDates(currentWeekStart);
    const today = new Date().toISOString().split('T')[0];

    // Tính toán thống kê schedule
    const scheduleStats = useMemo(() => {
        if (!doctorSchedule.length) return null;

        const activeDays = doctorSchedule.filter(s => s.is_active).length;
        const workHours = doctorSchedule.filter(s => s.is_active).map(s => {
            const [sh, sm] = s.start_time.split(':').map(Number);
            const [eh, em] = s.end_time.split(':').map(Number);
            return (eh * 60 + em - sh * 60 - sm) / 60;
        }).reduce((a, b) => a + b, 0);

        return { activeDays, workHours: workHours.toFixed(1) };
    }, [doctorSchedule]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>⏰ Quản Lý Khung Giờ Khám</h1>
                    <p>Lịch làm việc định kỳ hàng tuần. Khóa/mở từng khung giờ khi cần thiết.</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className={styles.infoBanner}>
                <span>💡</span>
                <div>
                    <strong>Cách hoạt động:</strong> Lịch làm việc của bác sĩ được thiết lập định kỳ theo tuần (ví dụ: Thứ 2-6, 8h-17h).
                    Hệ thống tự động tạo khung giờ khám cho tất cả các tuần. Bạn chỉ cần khóa những slot đặc biệt khi bác sĩ nghỉ.
                </div>
            </div>

            {/* Specialty Tabs */}
            <div className={styles.specialtyTabs}>
                <button
                    className={`${styles.tabBtn} ${selectedSpecialty === 'all' ? styles.activeTab : ''}`}
                    onClick={() => setSelectedSpecialty('all')}
                >
                    Tất cả ({doctors.length})
                </button>
                {specialties.map(spec => (
                    <button
                        key={spec.id}
                        className={`${styles.tabBtn} ${selectedSpecialty === String(spec.id) ? styles.activeTab : ''}`}
                        onClick={() => setSelectedSpecialty(String(spec.id))}
                    >
                        {spec.name} ({specialtyCounts[spec.id] || 0})
                    </button>
                ))}
            </div>

            <div className={styles.mainContent}>
                {/* Sidebar: Doctor Selection */}
                <div className={styles.sidebar}>
                    <h3>👨‍⚕️ Chọn Bác Sĩ</h3>
                    <input
                        type="text"
                        placeholder="🔍 Tìm bác sĩ..."
                        value={searchDoctor}
                        onChange={(e) => setSearchDoctor(e.target.value)}
                        className={styles.searchInput}
                    />
                    <div className={styles.doctorsList}>
                        {filteredDoctors.map(doctor => (
                            <button
                                key={doctor.id}
                                className={`${styles.doctorBtn} ${selectedDoctor === doctor.id ? styles.selected : ''}`}
                                onClick={() => setSelectedDoctor(doctor.id)}
                            >
                                <span className={styles.doctorName}>{doctor.full_name}</span>
                                <span className={styles.doctorSpecialty}>{doctor.specialty?.name}</span>
                            </button>
                        ))}
                        {filteredDoctors.length === 0 && <p className={styles.noData}>Không tìm thấy bác sĩ</p>}
                    </div>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {selectedDoctor ? (
                        <>
                            {/* Doctor Info Header */}
                            <div className={styles.contentHeader}>
                                <div className={styles.doctorInfo}>
                                    <span>📋 <strong>{selectedDoctorInfo?.full_name}</strong></span>
                                    <span className={styles.specialty}>({selectedDoctorInfo?.specialty?.name})</span>
                                </div>
                                <button className={styles.btnSchedule} onClick={() => window.location.href = '/admin/doctor-schedules'}>
                                    ⚙️ Sửa lịch định kỳ
                                </button>
                            </div>

                            {/* Schedule Summary */}
                            {doctorSchedule.length > 0 ? (
                                <div className={styles.scheduleSummary}>
                                    <h4>📅 Lịch làm việc định kỳ:</h4>
                                    <div className={styles.scheduleGrid}>
                                        {dayOptions.map(day => {
                                            const schedule = doctorSchedule.find(s => s.day_of_week === day.value);
                                            const isActive = schedule?.is_active;
                                            return (
                                                <div key={day.value} className={`${styles.scheduleDay} ${isActive ? styles.active : styles.inactive}`}>
                                                    <span className={styles.dayLabel}>{day.value}</span>
                                                    {isActive ? (
                                                        <span className={styles.dayTime}>
                                                            {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                                                        </span>
                                                    ) : (
                                                        <span className={styles.dayOffText}>Nghỉ</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {scheduleStats && (
                                        <p className={styles.scheduleNote}>
                                            ✅ Làm việc {scheduleStats.activeDays} ngày/tuần, tổng ~{scheduleStats.workHours}h/tuần
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.noSchedule}>
                                    <p>⚠️ Bác sĩ chưa có lịch làm việc định kỳ</p>
                                    <button className={styles.btnSchedule} onClick={() => window.location.href = '/admin/doctor-schedules'}>
                                        ➕ Tạo lịch làm việc
                                    </button>
                                </div>
                            )}

                            {/* Week View */}
                            {doctorSchedule.length > 0 && (
                                <>
                                    <div className={styles.weekNavigation}>
                                        <button onClick={goToPreviousWeek}>◀ Tuần trước</button>
                                        <button onClick={goToCurrentWeek} className={styles.btnToday}>Tuần này</button>
                                        <span className={styles.weekRange}>
                                            {weekDates[0].toLocaleDateString('vi-VN')} - {weekDates[6].toLocaleDateString('vi-VN')}
                                        </span>
                                        <button onClick={goToNextWeek}>Tuần sau ▶</button>
                                    </div>

                                    {loading ? (
                                        <div className={styles.loading}>⏳ Đang tải...</div>
                                    ) : (
                                        <div className={styles.weekGrid}>
                                            {weekDates.map((date) => {
                                                const dateStr = date.toISOString().split('T')[0];
                                                const dayData = weekData[dateStr] || { hasSchedule: false, slots: [] };
                                                const isToday = dateStr === today;
                                                const isPast = dateStr < today;

                                                const lockedCount = dayData.slots?.filter(s => s.isLocked).length || 0;
                                                const bookedCount = dayData.slots?.filter(s => s.isBooked).length || 0;
                                                const availableCount = dayData.slots?.filter(s => !s.isLocked && !s.isBooked).length || 0;

                                                return (
                                                    <div key={dateStr} className={`${styles.dayColumn} ${isToday ? styles.today : ''} ${isPast ? styles.past : ''} ${!dayData.hasSchedule ? styles.noWork : ''}`}>
                                                        <div className={styles.dayHeader}>
                                                            <div className={styles.dayName}>{dayNames[date.getDay()]}</div>
                                                            <div className={styles.dayDate}>{date.getDate()}/{date.getMonth() + 1}</div>
                                                            {isToday && <span className={styles.todayBadge}>Hôm nay</span>}
                                                        </div>

                                                        {dayData.hasSchedule ? (
                                                            <>
                                                                <div className={styles.dayStats}>
                                                                    <span title="Còn trống" className={styles.available}>✅ {availableCount}</span>
                                                                    {bookedCount > 0 && <span title="Có lịch hẹn" className={styles.booked}>👥 {bookedCount}</span>}
                                                                    {lockedCount > 0 && <span title="Đã khóa" className={styles.locked}>🔒 {lockedCount}</span>}
                                                                </div>

                                                                <div className={styles.daySlots}>
                                                                    {dayData.slots.map((slot, idx) => (
                                                                        <div
                                                                            key={idx}
                                                                            className={`${styles.slotItem} ${slot.isLocked ? styles.disabled : ''} ${slot.isBooked ? styles.hasBooking : ''}`}
                                                                            title={slot.isBooked ? `Đã đặt: ${slot.booking?.patient?.full_name || 'Khách'}` : slot.isLocked ? 'Đã khóa' : 'Còn trống'}
                                                                        >
                                                                            <span className={styles.slotTime}>{slot.start}</span>
                                                                            {!isPast && !slot.isBooked && (
                                                                                <button
                                                                                    className={styles.slotLockBtn}
                                                                                    onClick={() => handleLockSlot(dateStr, slot)}
                                                                                    title={slot.isLocked ? 'Mở khóa' : 'Khóa'}
                                                                                >
                                                                                    {slot.isLocked ? '🔓' : '🔒'}
                                                                                </button>
                                                                            )}
                                                                            {slot.isBooked && <span className={styles.bookedIcon}>👤</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {!isPast && (
                                                                    <div className={styles.dayActions}>
                                                                        <button
                                                                            className={styles.btnDayAction}
                                                                            onClick={() => handleLockDay(dateStr, true)}
                                                                            title="Khóa cả ngày"
                                                                        >
                                                                            🔒 Khóa ngày
                                                                        </button>
                                                                        <button
                                                                            className={styles.btnDayAction}
                                                                            onClick={() => handleLockDay(dateStr, false)}
                                                                            title="Mở khóa cả ngày"
                                                                        >
                                                                            🔓 Mở
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className={styles.dayOffContent}>
                                                                <span>😴</span>
                                                                <span>Không làm việc</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Legend */}
                                    <div className={styles.legend}>
                                        <div className={styles.legendItem}>
                                            <span className={`${styles.legendColor} ${styles.legendAvailable}`}></span>
                                            <span>Còn trống</span>
                                        </div>
                                        <div className={styles.legendItem}>
                                            <span className={`${styles.legendColor} ${styles.legendBooked}`}></span>
                                            <span>Đã đặt lịch</span>
                                        </div>
                                        <div className={styles.legendItem}>
                                            <span className={`${styles.legendColor} ${styles.legendLocked}`}></span>
                                            <span>Đã khóa</span>
                                        </div>
                                        <div className={styles.legendItem}>
                                            <span className={`${styles.legendColor} ${styles.legendOff}`}></span>
                                            <span>Ngày nghỉ</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className={styles.placeholder}>
                            <div className={styles.placeholderIcon}>👈</div>
                            <p>Vui lòng chọn bác sĩ để xem và quản lý khung giờ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
