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
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';

export default function RegisterScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '', // male, female, other
    username: '',
    email: '', // Note: we'll append @my.sliit.lk on submission or render
    password: '',
    confirmPassword: ''
  });

  const nextStep = () => {
    setGlobalError('');
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
        setGlobalError('Please fill in all personal details.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.username || !formData.email) {
        setGlobalError('Username and SLIIT Email prefix are required.');
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    setGlobalError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleDOBChange = (text) => {
    // Keep only numbers
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    let formatted = cleaned;

    if (cleaned.length >= 5) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}`;
      if (cleaned.length >= 7) {
        formatted += `-${cleaned.slice(6, 8)}`;
      }
    } else if (cleaned.length >= 5) {
      formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }

    setFormData({ ...formData, dateOfBirth: formatted });
  };

  const submitRegistration = async () => {
    setGlobalError('');
    if (!formData.password || !formData.confirmPassword) {
      setGlobalError('Please fill in and confirm your password.');
      return;
    }

    // Ensure it meets criteria
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial || !isLongEnough) {
      setGlobalError('Please meet all the password security requirements.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setGlobalError("Passwords don't match.");
      return;
    }

    setIsLoading(true);

    try {
      const fullEmail = `${formData.email}@my.sliit.lk`;

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth, // backend expects valid date string/format
          gender: formData.gender,
          username: formData.username,
          email: fullEmail,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalError(data.message || 'Registration failed');
      } else {
        // Registration success. Route securely to login page with success notification.
        Alert.alert("Success", "Your student account has been created successfully. You can now log in.");
        router.replace('/login');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      setGlobalError('Network error. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time validations
  const p = formData.password;
  const hasUpperCase = /[A-Z]/.test(p);
  const hasLowerCase = /[a-z]/.test(p);
  const hasNumber = /\d/.test(p);
  const hasSpecial = /[@$!%*?&_.-]/.test(p);
  const isLongEnough = p.length >= 8;

  const ValidationCheck = ({ title, isValid }) => (
    <View style={styles.validationRow}>
      <MaterialIcons
        name={isValid ? "check-circle" : "radio-button-unchecked"}
        size={16}
        color={isValid ? Colors.primary : Colors.outlineVariant}
      />
      <Text style={[styles.validationText, isValid && styles.validationTextActive]}>
        {title}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#dbe1ff', '#faf8ff']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Simplified Transactional Header */}
      <View style={styles.headerNav}>
        <Text style={styles.navBrand}>UniStay</Text>
        <View style={styles.progressBars}>
          <View style={[styles.progressBar, step >= 1 && styles.progressBarActive]} />
          <View style={[styles.progressBar, step >= 2 && styles.progressBarActive]} />
          <View style={[styles.progressBar, step >= 3 && styles.progressBarActive]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent}>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.stepIndicator}>
                  {step === 1 ? 'Step 01 — Personal info' : step === 2 ? 'Step 02 — Identity' : 'Step 03 — Security'}
                </Text>
                <Text style={styles.title}>
                  {step === 1 ? 'Tell us about yourself' : step === 2 ? 'Create your account info' : 'Secure your account'}
                </Text>
                <Text style={styles.subtitle}>
                  {step === 1 ? "We need this to personalize your stay experience." : step === 2 ? "Let's set up your university credentials to verify your student status." : "Create a strong password to protect your data."}
                </Text>
              </View>

              {globalError ? <Text style={styles.errorText}>{globalError}</Text> : null}

              {/* STEP 1: PERSONAL INFO */}
              {step === 1 && (
                <View style={styles.formSpace}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>FIRST NAME</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. John"
                        placeholderTextColor={Colors.outline}
                        value={formData.firstName}
                        onChangeText={(t) => { setFormData({ ...formData, firstName: t }); setGlobalError(''); }}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>LAST NAME</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Doe"
                        placeholderTextColor={Colors.outline}
                        value={formData.lastName}
                        onChangeText={(t) => { setFormData({ ...formData, lastName: t }); setGlobalError(''); }}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>DATE OF BIRTH</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.outline}
                        keyboardType="numeric"
                        maxLength={10}
                        value={formData.dateOfBirth}
                        onChangeText={(t) => { handleDOBChange(t); setGlobalError(''); }}
                      />
                      <MaterialIcons name="calendar-today" size={20} color={Colors.outline} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>GENDER</Text>
                    <TouchableOpacity
                      style={[styles.inputContainer, styles.dropdownContainer]}
                      onPress={() => setShowGenderModal(true)}
                    >
                      <Text style={[styles.input, { color: formData.gender ? Colors.onSurface : Colors.outline }]}>
                        {formData.gender ? formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1) : "Select Gender"}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={24} color={Colors.outline} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}


              {/* STEP 2: IDENTITY INFO */}
              {step === 2 && (
                <View style={styles.formSpace}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>SLIIT EMAIL</Text>
                    <View style={[styles.inputContainer, { paddingRight: 8 }]}>
                      <TextInput
                        style={styles.input}
                        placeholder="it21004560"
                        placeholderTextColor={Colors.outline}
                        keyboardType="default"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(t) => { setFormData({ ...formData, email: t }); setGlobalError(''); }}
                      />
                      <View style={styles.staticDomainBadge}>
                        <Text style={styles.staticDomainText}>@my.sliit.lk</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>USERNAME</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. john_doe"
                        placeholderTextColor={Colors.outline}
                        autoCapitalize="none"
                        value={formData.username}
                        onChangeText={(t) => { setFormData({ ...formData, username: t }); setGlobalError(''); }}
                      />
                      <MaterialIcons name="person-outline" size={20} color={Colors.outline} />
                    </View>
                  </View>
                </View>
              )}


              {/* STEP 3: SECURITY INFO */}
              {step === 3 && (
                <View style={styles.formSpace}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="lock-outline" size={20} color={Colors.outline} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={Colors.outline}
                        secureTextEntry={!showPassword}
                        value={formData.password}
                        onChangeText={(t) => { setFormData({ ...formData, password: t }); setGlobalError(''); }}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.visibilityIcon}>
                        <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color={Colors.outline} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* REALTIME PASSWORD REQUIREMENTS UI */}
                  {formData.password.length > 0 && (
                    <View style={styles.validationBox}>
                      <ValidationCheck title="Minimum 8 characters" isValid={isLongEnough} />
                      <ValidationCheck title="1 Uppercase letter (A-Z)" isValid={hasUpperCase} />
                      <ValidationCheck title="1 Lowercase letter (a-z)" isValid={hasLowerCase} />
                      <ValidationCheck title="1 Number (0-9)" isValid={hasNumber} />
                      <ValidationCheck title="1 Special character (@$!%*?&...)" isValid={hasSpecial} />
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CONFIRM PASSWORD</Text>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="lock-outline" size={20} color={Colors.outline} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={Colors.outline}
                        secureTextEntry={!showConfirmPassword}
                        value={formData.confirmPassword}
                        onChangeText={(t) => { setFormData({ ...formData, confirmPassword: t }); setGlobalError(''); }}
                      />
                      <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.visibilityIcon}>
                        <MaterialIcons name={showConfirmPassword ? "visibility-off" : "visibility"} size={20} color={Colors.outline} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                {step < 3 ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                    onPress={nextStep}
                  >
                    <Text style={styles.primaryButtonText}>Next Step</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.8}
                    onPress={submitRegistration}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={Colors.onPrimary} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Complete Registration</Text>

                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Back Button (Only on Steps 2 and 3) */}
                {step > 1 && (
                  <TouchableOpacity activeOpacity={0.7} onPress={prevStep} style={styles.backButtonRow}>
                    <MaterialIcons name="chevron-left" size={24} color={Colors.primary} />
                    <Text style={styles.backButtonText}>Back to {step === 2 ? "Personal Details" : "Identity"}</Text>
                  </TouchableOpacity>
                )}
                {step === 1 && (
                  <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={[styles.backButtonRow, { marginTop: Spacing.four }]}>
                    <Text style={[styles.backButtonText, { color: Colors.outline }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <MaterialIcons name="security" size={16} color={Colors.outline} />
                <Text style={styles.trustText}>SECURE DATA</Text>
              </View>
              <View style={styles.trustItem}>
                <MaterialIcons name="verified-user" size={16} color={Colors.outline} />
                <Text style={styles.trustText}>SLIIT VERIFIED</Text>
              </View>
            </View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Gender Dropdown Modal */}
      <Modal visible={showGenderModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {['male', 'female', 'other'].map(g => (
              <TouchableOpacity
                key={g}
                style={styles.modalOption}
                onPress={() => {
                  setFormData({ ...formData, gender: g });
                  setShowGenderModal(false);
                  setGlobalError('');
                }}
              >
                <Text style={[styles.modalOptionText, formData.gender === g && styles.modalOptionTextActive]}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
                {formData.gender === g && <MaterialIcons name="check" size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowGenderModal(false)}>
              <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.error }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.two,
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 50
  },
  navBrand: { fontFamily: Fonts.headlineExtraBold, fontSize: 24, color: Colors.primaryContainer, letterSpacing: -0.5 },
  progressBars: { flexDirection: 'row', gap: 6 },
  progressBar: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.surfaceVariant },
  progressBarActive: { backgroundColor: Colors.primaryContainer },
  contentWrap: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.six, justifyContent: 'center', flexGrow: 1, alignItems: 'center' },
  card: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    shadowColor: '#191b23',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  cardHeader: { marginBottom: Spacing.five },
  stepIndicator: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.one },
  title: { fontFamily: Fonts.headlineExtraBold, fontSize: 30, color: Colors.onSurface, lineHeight: 36, tracking: -0.5 },
  subtitle: { marginTop: Spacing.one, fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurfaceVariant, lineHeight: 24 },
  formSpace: { marginBottom: Spacing.two },
  inputGroup: { marginBottom: Spacing.four },
  label: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two, marginLeft: Spacing.one },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
  dropdownContainer: { justifyContent: 'space-between' },
  input: { flex: 1, paddingVertical: 16, fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurface },
  inputIcon: { marginRight: Spacing.two },
  visibilityIcon: { padding: Spacing.two },
  staticDomainBadge: { backgroundColor: Colors.surfaceContainerLow, paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(195, 198, 215, 0.2)' },
  staticDomainText: { fontFamily: Fonts.headline, fontSize: 13, color: Colors.primary },
  errorText: { fontFamily: Fonts.bodyMedium, color: Colors.error, fontSize: 14, marginBottom: Spacing.three, textAlign: 'center' },
  validationBox: { backgroundColor: '#f0f0fb', padding: Spacing.three, borderRadius: Radius.lg, marginBottom: Spacing.five },
  validationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  validationText: { marginLeft: 8, fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.outlineVariant },
  validationTextActive: { color: Colors.primary, fontFamily: Fonts.bodyBold },
  actionContainer: { marginTop: Spacing.two, alignItems: 'center' },
  primaryButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryContainer, borderRadius: Radius.xl, paddingVertical: 18, shadowColor: Colors.primaryContainer, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
  primaryButtonText: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onPrimary, marginRight: Spacing.one },
  backButtonRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.four },
  backButtonText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.primary },
  trustRow: { flexDirection: 'row', marginTop: Spacing.six, gap: Spacing.five, opacity: 0.5, justifyContent: 'center' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.outline, letterSpacing: 0.5 },

  // Modal Elements
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  modalContent: { width: '100%', backgroundColor: Colors.surfaceBright, borderRadius: Radius.xl, padding: Spacing.four },
  modalTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: Spacing.four },
  modalOption: {
    flexDirection: 'row', // inline alignment
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant
  },
  modalOptionText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurfaceVariant },
  modalOptionTextActive: { fontFamily: Fonts.bodyBold, color: Colors.primary },
  modalCancel: { marginTop: Spacing.four, alignItems: 'center', padding: Spacing.two }
});
