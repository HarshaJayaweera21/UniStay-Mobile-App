import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuth from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { Fonts, Radius, Spacing } from '../../constants/theme';
import { API_URL } from '../../constants/api';
import { getItem } from '../../utils/storage';

const EditProfileScreen = () => {
    const { user, updateAuthUser } = useAuth();
    const router = useRouter();

    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [gender, setGender] = useState(user?.gender || '');
    const [imageUri, setImageUri] = useState(null);
    const [removePic, setRemovePic] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!user) return null;

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setRemovePic(false);
        }
    };

    const handleRemovePic = () => {
        setImageUri(null);
        setRemovePic(true);
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        setIsLoading(true);
        try {
            const token = await getItem('userToken');
            
            const formData = new FormData();
            formData.append('firstName', firstName);
            formData.append('lastName', lastName);
            formData.append('email', email);
            formData.append('gender', gender);

            if (imageUri) {
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('profilePicture', {
                    uri: imageUri,
                    name: filename,
                    type,
                });
            } else if (removePic) {
                formData.append('profilePicture', 'removed');
            }

            const response = await fetch(`${API_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Note: Don't set Content-Type for FormData in React Native. It will automatically be set with the boundary.
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                updateAuthUser(data.user);
                Alert.alert('Success', 'Profile updated successfully.', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', data.message || 'Failed to update profile.');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            Alert.alert('Error', 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarWrapper}>
                            {imageUri || (user.profilePicture && user.profilePicture !== 'removed' && !removePic) ? (
                                <Image source={{ uri: imageUri || user.profilePicture }} style={styles.largeAvatar} />
                            ) : (
                                <View style={[styles.largeAvatar, styles.placeholderAvatar]}>
                                    <Text style={styles.largeAvatarText}>{user.firstName?.charAt(0).toUpperCase()}{user.lastName?.charAt(0).toUpperCase()}</Text>
                                </View>
                            )}
                            <View style={styles.avatarActionContainer}>
                                {((user.profilePicture && user.profilePicture !== 'removed' && !removePic) || imageUri) ? (
                                    <TouchableOpacity style={styles.removeAvatarButton} onPress={handleRemovePic}>
                                        <Ionicons name="trash" size={20} color={Colors.onError} />
                                    </TouchableOpacity>
                                ) : null}
                                <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage}>
                                    <Ionicons name="camera" size={20} color={Colors.onPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>First Name</Text>
                            <TextInput
                                style={styles.input}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="Enter first name"
                                placeholderTextColor={Colors.outline}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Last Name</Text>
                            <TextInput
                                style={styles.input}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Enter last name"
                                placeholderTextColor={Colors.outline}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                style={[styles.input, styles.inputDisabled]}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Enter email address"
                                placeholderTextColor={Colors.outline}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Gender</Text>
                            <View style={styles.genderContainer}>
                                {['male', 'female', 'other'].map((g) => (
                                    <TouchableOpacity 
                                        key={g} 
                                        style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                                        onPress={() => setGender(g)}
                                    >
                                        <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                                            {g.charAt(0).toUpperCase() + g.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
                            onPress={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.onPrimary} />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        backgroundColor: Colors.surfaceContainerLowest,
    },
    backButton: {
        padding: Spacing.one,
    },
    headerTitle: {
        fontFamily: Fonts.headline,
        fontSize: 20,
        color: Colors.onSurface,
    },
    container: {
        padding: Spacing.four,
        paddingBottom: Spacing.six,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: Spacing.five,
    },
    avatarWrapper: {
        position: 'relative',
    },
    largeAvatar: {
        width: 120,
        height: 120,
        borderRadius: Radius.full,
        backgroundColor: Colors.surfaceVariant,
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primaryContainer,
    },
    largeAvatarText: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 48,
        color: Colors.onPrimaryContainer,
    },
    avatarActionContainer: {
        position: 'absolute',
        bottom: -5,
        right: -15,
        flexDirection: 'row',
        gap: 8,
    },
    removeAvatarButton: {
        backgroundColor: Colors.error,
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.surfaceContainerLowest,
    },
    editAvatarButton: {
        backgroundColor: Colors.primary,
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.surfaceContainerLowest,
    },
    formContainer: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        shadowColor: Colors.onSurface,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputGroup: {
        marginBottom: Spacing.four,
    },
    inputLabel: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        marginBottom: Spacing.two,
    },
    input: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.onSurface,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.outlineVariant,
        borderRadius: Radius.md,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    inputDisabled: {
        backgroundColor: Colors.surfaceVariant,
        color: Colors.onSurfaceVariant,
        opacity: 0.7,
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    genderButton: {
        flex: 1,
        paddingVertical: Spacing.three,
        marginHorizontal: Spacing.half,
        borderWidth: 1,
        borderColor: Colors.outlineVariant,
        borderRadius: Radius.md,
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    genderButtonActive: {
        backgroundColor: Colors.primaryContainer,
        borderColor: Colors.primary,
    },
    genderText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        color: Colors.onSurfaceVariant,
    },
    genderTextActive: {
        color: Colors.onPrimaryContainer,
        fontFamily: Fonts.bodySemiBold,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.lg,
        paddingVertical: Spacing.three,
        alignItems: 'center',
        marginTop: Spacing.two,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 16,
        color: Colors.onPrimary,
    },
});

export default EditProfileScreen;
