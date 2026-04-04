import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import storage from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';

export default function LoginScreen() {
  const router = useRouter();

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
      console.log('Attempting login to:', `${API_URL}/api/auth/login`);
      
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
        // Validation Passed -> Store token securely
        if (data.token) {
          await storage.setItem('userToken', data.token);
          await storage.setItem('userRole', data.user.role || 'student');
        }

        const userRole = data.user.role || 'student';
        
        // Push to role-based dashboard
        if (userRole === 'admin') router.replace('/admin');
        else if (userRole === 'manager') router.replace('/manager');
        else if (userRole === 'guard') router.replace('/guard');
        else router.replace('/student');
      }
    } catch (error) {
      console.error('Login Error details:', error);
      setErrorMessage(`Network error: ${error.message || 'Please check your connection and ensure the server is reachable at ' + API_URL}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Mesh Background */}
        <LinearGradient
          colors={['#dbe1ff', '#faf8ff']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.brandText}>UniStay</Text>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Welcome back! Please enter your details.</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            {/* Email Input */}
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

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>PASSWORD</Text>
                <Pressable onPress={() => { /* Link to forgot password */ }}>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </Pressable>
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
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.visibilityIcon}>
                  <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color={Colors.outline} />
                </Pressable>
              </View>
            </View>

            {/* Error Message Display */}
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Sign In Button */}
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
              ]}
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
            </Pressable>
          </View>

          {/* Footer Registration Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={styles.createAccountText}>Create an account</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  brandText: {
    fontFamily: Fonts.headlineExtraBold,
    fontSize: 32,
    color: Colors.primary,
    marginBottom: Spacing.three,
    letterSpacing: -1,
  },
  title: {
    fontFamily: Fonts.headlineExtraBold,
    fontSize: 36,
    color: Colors.onSurface,
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.onSurfaceVariant,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    boxShadow: '0px 16px 32px rgba(25, 27, 35, 0.08)',
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.two,
    marginLeft: Spacing.one,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.three,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.onSurface,
  },
  visibilityIcon: {
    padding: Spacing.two,
  },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.error,
    fontSize: 14,
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
    borderRadius: Radius.xl,
    paddingVertical: 18,
    marginTop: Spacing.two,
    boxShadow: `0px 8px 16px ${Colors.primaryContainer}40`,
  },
  primaryButtonText: {
    fontFamily: Fonts.headline,
    fontSize: 18,
    color: Colors.onPrimary,
    marginRight: Spacing.one,
  },
  footer: {
    flexDirection: 'row',
    marginTop: Spacing.six,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
  },
  createAccountText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.primary,
  },
});
