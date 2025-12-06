import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { COLORS, SIZES } from '../../constants/theme';

export default function PatientHomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        upcomingAppointments: 0,
        completedAppointments: 0,
    });
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Lấy danh sách lịch hẹn của bệnh nhân
            const response = await api.get('/api/patient/appointments');
            if (response.data) {
                const allAppointments = response.data.data || response.data || [];
                setAppointments(allAppointments.slice(0, 5)); // 5 lịch hẹn gần nhất

                // Tính stats
                const upcoming = allAppointments.filter(a =>
                    a.status === 'confirmed' || a.status === 'pending'
                ).length;
                const completed = allAppointments.filter(a =>
                    a.status === 'completed'
                ).length;

                setStats({ upcomingAppointments: upcoming, completedAppointments: completed });
            }
        } catch (error) {
            console.log('Error fetching data:', error);
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
            case 'confirmed': return 'Đã xác nhận';
            case 'pending': return 'Chờ xác nhận';
            case 'completed': return 'Hoàn thành';
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
                        <Text style={styles.greeting}>Xin chào,</Text>
                        <Text style={styles.userName}>{user?.full_name || user?.name || 'Bệnh nhân'}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {(user?.full_name || user?.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.statNumber}>{stats.upcomingAppointments}</Text>
                    <Text style={styles.statLabel}>Lịch hẹn sắp tới</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
                    <Text style={styles.statNumber}>{stats.completedAppointments}</Text>
                    <Text style={styles.statLabel}>Đã hoàn thành</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('BookAppointment')}
                    >
                        <Text style={styles.actionIcon}>📅</Text>
                        <Text style={styles.actionText}>Đặt lịch khám</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('MyAppointments')}
                    >
                        <Text style={styles.actionIcon}>📋</Text>
                        <Text style={styles.actionText}>Lịch hẹn của tôi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('MedicalHistory')}
                    >
                        <Text style={styles.actionIcon}>🏥</Text>
                        <Text style={styles.actionText}>Lịch sử khám</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Text style={styles.actionIcon}>👤</Text>
                        <Text style={styles.actionText}>Hồ sơ</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Appointments */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Lịch hẹn gần đây</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('MyAppointments')}>
                        <Text style={styles.seeAll}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>

                {appointments.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>Chưa có lịch hẹn nào</Text>
                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => navigation.navigate('BookAppointment')}
                        >
                            <Text style={styles.bookButtonText}>Đặt lịch ngay</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    appointments.map((appointment) => (
                        <TouchableOpacity
                            key={appointment.id}
                            style={styles.appointmentCard}
                            onPress={() => navigation.navigate('AppointmentDetail', { id: appointment.id })}
                        >
                            <View style={styles.appointmentHeader}>
                                <Text style={styles.appointmentDoctor}>
                                    BS. {appointment.doctor_name || appointment.Doctor?.full_name || 'Chưa xác định'}
                                </Text>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
                                    <Text style={styles.statusText}>{getStatusText(appointment.status)}</Text>
                                </View>
                            </View>
                            <Text style={styles.appointmentSpecialty}>
                                {appointment.specialty_name || appointment.Specialty?.name || 'Khám tổng quát'}
                            </Text>
                            <View style={styles.appointmentInfo}>
                                <Text style={styles.appointmentDate}>
                                    📅 {appointment.appointment_date}
                                </Text>
                                <Text style={styles.appointmentTime}>
                                    🕐 {appointment.appointment_time || 'Chờ xếp lịch'}
                                </Text>
                            </View>
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
        backgroundColor: COLORS.primary,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginTop: -20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 20,
        borderRadius: SIZES.radius,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    statNumber: {
        fontSize: 32,
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
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    appointmentDoctor: {
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
    appointmentSpecialty: {
        fontSize: SIZES.small,
        color: COLORS.primary,
        marginBottom: 8,
    },
    appointmentInfo: {
        flexDirection: 'row',
        gap: 16,
    },
    appointmentDate: {
        fontSize: SIZES.small,
        color: COLORS.gray,
    },
    appointmentTime: {
        fontSize: SIZES.small,
        color: COLORS.gray,
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
        marginBottom: 16,
    },
    bookButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: SIZES.radius,
    },
    bookButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
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
