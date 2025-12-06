import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { COLORS, SIZES } from '../../constants/theme';

export default function DoctorHomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        todayAppointments: 0,
        pendingAppointments: 0,
        completedToday: 0,
    });
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Lấy lịch hẹn hôm nay của bác sĩ
            const today = new Date().toISOString().split('T')[0];
            const response = await api.get(`/api/doctor/appointments?date=${today}`);

            if (response.data) {
                const appointments = response.data.data || response.data || [];
                setTodayAppointments(appointments);

                // Tính stats
                const pending = appointments.filter(a => a.status === 'confirmed').length;
                const completed = appointments.filter(a => a.status === 'completed').length;

                setStats({
                    todayAppointments: appointments.length,
                    pendingAppointments: pending,
                    completedToday: completed,
                });
            }
        } catch (error) {
            console.log('Error fetching doctor data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return COLORS.success;
            case 'pending': return COLORS.warning;
            case 'completed': return COLORS.primary;
            case 'cancelled': return COLORS.error;
            default: return COLORS.gray;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'confirmed': return 'Chờ khám';
            case 'pending': return 'Chờ xác nhận';
            case 'completed': return 'Đã khám';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Xin chào, Bác sĩ</Text>
                        <Text style={styles.userName}>{user?.full_name || user?.name || 'Doctor'}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>👨‍⚕️</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
                    <Text style={styles.statLabel}>Hôm nay</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: COLORS.warning }]}>
                    <Text style={styles.statNumber}>{stats.pendingAppointments}</Text>
                    <Text style={styles.statLabel}>Chờ khám</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
                    <Text style={styles.statNumber}>{stats.completedToday}</Text>
                    <Text style={styles.statLabel}>Đã khám</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('DoctorAppointments')}
                    >
                        <Text style={styles.actionIcon}>📋</Text>
                        <Text style={styles.actionText}>Lịch khám</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('DoctorSchedule')}
                    >
                        <Text style={styles.actionIcon}>📅</Text>
                        <Text style={styles.actionText}>Lịch làm việc</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('DoctorPatients')}
                    >
                        <Text style={styles.actionIcon}>👥</Text>
                        <Text style={styles.actionText}>Bệnh nhân</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('DoctorProfile')}
                    >
                        <Text style={styles.actionIcon}>👤</Text>
                        <Text style={styles.actionText}>Hồ sơ</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Today's Appointments */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Lịch khám hôm nay</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('DoctorAppointments')}>
                        <Text style={styles.seeAll}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>

                {todayAppointments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>Không có lịch khám hôm nay</Text>
                    </View>
                ) : (
                    todayAppointments.map((appointment) => (
                        <TouchableOpacity
                            key={appointment.id}
                            style={styles.appointmentCard}
                            onPress={() => navigation.navigate('ExaminationScreen', {
                                appointmentId: appointment.id
                            })}
                        >
                            <View style={styles.appointmentHeader}>
                                <Text style={styles.appointmentPatient}>
                                    {appointment.patient_name || appointment.Patient?.full_name || 'Bệnh nhân'}
                                </Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                                    <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
                                </View>
                            </View>
                            <View style={styles.appointmentInfo}>
                                <Text style={styles.appointmentTime}>
                                    🕐 {appointment.appointment_time || 'Chưa xếp giờ'}
                                </Text>
                                <Text style={styles.appointmentService}>
                                    💊 {appointment.service_name || appointment.Service?.name || 'Khám tổng quát'}
                                </Text>
                            </View>
                            {appointment.symptoms && (
                                <Text style={styles.symptoms} numberOfLines={2}>
                                    📝 {appointment.symptoms}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>🚪 Đăng xuất</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.primaryDark,
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: SIZES.padding,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: SIZES.body,
        color: COLORS.white,
        opacity: 0.9,
    },
    userName: {
        fontSize: SIZES.h2,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 28,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginTop: -20,
        gap: 8,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    statLabel: {
        fontSize: SIZES.small,
        color: COLORS.white,
        marginTop: 4,
    },
    section: {
        padding: SIZES.padding,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: SIZES.h3,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 16,
    },
    seeAll: {
        color: COLORS.primary,
        fontSize: SIZES.body,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '47%',
        backgroundColor: COLORS.white,
        padding: 20,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    actionText: {
        fontSize: SIZES.body,
        color: COLORS.black,
        fontWeight: '500',
        textAlign: 'center',
    },
    appointmentCard: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: SIZES.radius,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    appointmentPatient: {
        fontSize: SIZES.body,
        fontWeight: 'bold',
        color: COLORS.black,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: COLORS.white,
        fontSize: SIZES.small,
        fontWeight: '600',
    },
    appointmentInfo: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 4,
    },
    appointmentTime: {
        fontSize: SIZES.small,
        color: COLORS.primary,
        fontWeight: '600',
    },
    appointmentService: {
        fontSize: SIZES.small,
        color: COLORS.gray,
    },
    symptoms: {
        fontSize: SIZES.small,
        color: COLORS.gray,
        marginTop: 8,
        fontStyle: 'italic',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: SIZES.body,
        color: COLORS.gray,
    },
    logoutButton: {
        margin: SIZES.padding,
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    logoutText: {
        color: COLORS.error,
        fontSize: SIZES.body,
        fontWeight: '600',
    },
});
