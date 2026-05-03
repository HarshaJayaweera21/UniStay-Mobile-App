import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { setItem, getItem } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import { AuthContext } from '@/context/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async () => {
        setErrorMessage('');

        if (!email || !password) {
            setErrorMessage('Email and Password are required');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.message || 'Invalid email or password');
            } else {
                // Store token & role securely based on platform
                if (data.token) {
                    await setItem('userToken', data.token);
                    await setItem('userRole', data.user.role || 'student');
                }

                // Store user data in global AuthContext
                login(data.user, data.token);

                const userRole = data.user.role || 'student';

                // Redirect to role-based dashboard
                if (userRole === 'admin') router.replace('/admin');
                else if (userRole === 'manager') router.replace('/manager');
                else if (userRole === 'guard') router.replace('/guard');
                else router.replace('/student');
            }
        } catch (error) {
            console.error('Login Error:', error);
            setErrorMessage('Network error, please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    <LinearGradient
                        colors={['#dbe1ff', '#faf8ff']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />

                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Text style={styles.brandText}>UniStay</Text>
                            <Text style={styles.title}>Login</Text>
                            <Text style={styles.subtitle}>Welcome back! Please enter your details.</Text>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>EMAIL ADDRESS</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialIcons name="mail-outline" size={20} color={Colors.outline} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="name@university.edu"
                                        placeholderTextColor={Colors.outline}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.passwordHeader}>
                                    <Text style={styles.label}>PASSWORD</Text>
                                    <TouchableOpacity>
                                        <Text style={styles.forgotPassword}>Forgot password?</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.inputContainer}>
                                    <MaterialIcons name="lock-outline" size={20} color={Colors.outline} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor={Colors.outline}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityIcon}>
                                        <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color={Colors.outline} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {errorMessage ? (
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            ) : null}

                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.8}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={Colors.onPrimary} />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>Sign In</Text>
                                        <MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/register')}>
                                <Text style={styles.createAccountText}>Create an account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, paddingHorizontal: Spacing.four, justifyContent: 'center', alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: Spacing.six },
    brandText: { fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.primary, marginBottom: Spacing.three, letterSpacing: -1 },
    title: { fontFamily: Fonts.headlineExtraBold, fontSize: 36, color: Colors.onSurface, marginBottom: Spacing.one },
    subtitle: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurfaceVariant },
    card: { width: '100%', backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.five, shadowColor: '#191b23', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.08, shadowRadius: 32, elevation: 8 },
    inputGroup: { marginBottom: Spacing.four },
    label: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two, marginLeft: Spacing.one },
    passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    forgotPassword: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.primary },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
    inputIcon: { marginRight: Spacing.two },
    input: { flex: 1, paddingVertical: 18, fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurface },
    visibilityIcon: { padding: Spacing.two },
    errorText: { fontFamily: Fonts.bodyMedium, color: Colors.error, fontSize: 14, marginBottom: Spacing.three, textAlign: 'center' },
    primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryContainer, borderRadius: Radius.xl, paddingVertical: 18, marginTop: Spacing.two, shadowColor: Colors.primaryContainer, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
    primaryButtonText: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onPrimary, marginRight: Spacing.one },
    footer: { flexDirection: 'row', marginTop: Spacing.six, alignItems: 'center' },
    footerText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant },
    createAccountText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.primary },
});