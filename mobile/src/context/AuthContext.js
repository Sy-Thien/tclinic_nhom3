import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Kiểm tra đăng nhập khi mở app
    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.log('Error loading auth:', error);
        } finally {
            setLoading(false);
        }
    };

    // Đăng nhập
    const login = async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', {
                username: email, // API backend nhận "username" field
                password
            });

            if (response.data.token) {
                const { token, user } = response.data;

                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(user));

                setToken(token);
                setUser(user);

                return { success: true, user };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Đăng nhập thất bại';
            return { success: false, message };
        }
    };

    // Đăng ký
    const register = async (userData) => {
        try {
            const response = await api.post('/api/auth/register', userData);

            if (response.data.token) {
                const { token, user } = response.data;

                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(user));

                setToken(token);
                setUser(user);

                return { success: true, user };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Đăng ký thất bại';
            return { success: false, message };
        }
    };

    // Đăng xuất
    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'user']);
            setToken(null);
            setUser(null);
        } catch (error) {
            console.log('Error logging out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isLoggedIn: !!token,
            login,
            register,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
