import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleRegister = async () => {
        // Validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setError('');
        setLoading(true);

        const result = await register({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password,
        });

        setLoading(false);

        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <LinearGradient
            colors={[COLORS.primary, COLORS.primaryDark]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Register Box */}
                    <View style={styles.loginBox}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>

                        {/* Title */}
                        <Text style={styles.title}>Đăng ký tài khoản</Text>
                        <Text style={styles.subtitle}>Phòng Khám TClinic - Tạo tài khoản mới</Text>

                        {/* Error Box */}
                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorIcon}>⚠️</Text>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Form */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Họ và tên *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nguyễn Văn A"
                                placeholderTextColor="#9ca3af"
                                value={formData.name}
                                onChangeText={(text) => handleChange('name', text)}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Email *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="example@email.com"
                                placeholderTextColor="#9ca3af"
                                value={formData.email}
                                onChangeText={(text) => handleChange('email', text)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Số điện thoại *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0123456789"
                                placeholderTextColor="#9ca3af"
                                value={formData.phone}
                                onChangeText={(text) => handleChange('phone', text)}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mật khẩu *</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Tối thiểu 6 ký tự"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.password}
                                    onChangeText={(text) => handleChange('password', text)}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.togglePassword}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Text style={styles.eyeIcon}>
                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Xác nhận mật khẩu *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập lại mật khẩu"
                                placeholderTextColor="#9ca3af"
                                value={formData.confirmPassword}
                                onChangeText={(text) => handleChange('confirmPassword', text)}
                                secureTextEntry={true}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.primaryDark]}
                                style={styles.buttonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.submitButtonText}>Đăng ký</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Đã có tài khoản? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingVertical: 40,
    },
    loginBox: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 60,
        elevation: 10,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        alignSelf: 'center',
        marginBottom: 20,
        padding: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    errorBox: {
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorIcon: {
        marginRight: 8,
    },
    errorText: {
        color: '#dc2626',
        fontSize: 14,
        flex: 1,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 6,
    },
    input: {
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111827',
        backgroundColor: COLORS.white,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        backgroundColor: COLORS.white,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111827',
    },
    togglePassword: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    eyeIcon: {
        fontSize: 18,
    },
    submitButton: {
        marginTop: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 14,
    },
    loginLink: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
