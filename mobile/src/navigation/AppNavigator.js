import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';

// Doctor Screens
import DoctorHomeScreen from '../screens/doctor/DoctorHomeScreen';

const Stack = createNativeStackNavigator();

// Auth Navigator (chưa đăng nhập)
function AuthNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

// Patient Navigator (bệnh nhân đã đăng nhập)
function PatientNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: COLORS.primary },
                headerTintColor: COLORS.white,
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="PatientHome"
                component={PatientHomeScreen}
                options={{ headerShown: false }}
            />
            {/* Thêm các màn hình khác của bệnh nhân ở đây */}
        </Stack.Navigator>
    );
}

// Doctor Navigator (bác sĩ đã đăng nhập)
function DoctorNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: COLORS.primaryDark },
                headerTintColor: COLORS.white,
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="DoctorHome"
                component={DoctorHomeScreen}
                options={{ headerShown: false }}
            />
            {/* Thêm các màn hình khác của bác sĩ ở đây */}
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { isLoggedIn, user, loading } = useAuth();

    if (loading) {
        // Có thể thêm splash screen ở đây
        return null;
    }

    return (
        <NavigationContainer>
            {!isLoggedIn ? (
                <AuthNavigator />
            ) : user?.role === 'doctor' ? (
                <DoctorNavigator />
            ) : (
                <PatientNavigator />
            )}
        </NavigationContainer>
    );
}
