import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { Fonts, Radius, Spacing } from '../../constants/theme';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) return null;

    const handleEditProfile = () => {
        router.push('/student/edit-profile');
    };

    const handleLogout = () => {
        logout();
        router.replace('/login');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                    <Ionicons name="pencil" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.avatarContainer}>
                    {user.profilePicture ? (
                        <Image source={{ uri: user.profilePicture }} style={styles.largeAvatar} />
                    ) : (
                        <View style={[styles.largeAvatar, styles.placeholderAvatar]}>
                            <Text style={styles.largeAvatarText}>{user.firstName?.charAt(0).toUpperCase()}</Text>
                        </View>
                    )}
                    <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
                    <Text style={styles.role}>{user.role}</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{user.email}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="person-outline" size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Username</Text>
                                <Text style={styles.infoValue}>{user.username}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="male-female-outline" size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Gender</Text>
                                <Text style={[styles.infoValue, {textTransform: 'capitalize'}]}>{user.gender}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcon}>
                                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Date of Birth</Text>
                                <Text style={styles.infoValue}>
                                    {new Date(user.dateOfBirth).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
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
    headerTitle: {
        fontFamily: Fonts.headline,
        fontSize: 24,
        color: Colors.onSurface,
    },
    editButton: {
        padding: Spacing.two,
        backgroundColor: Colors.primaryContainer,
        borderRadius: Radius.full,
    },
    container: {
        padding: Spacing.four,
        paddingBottom: Spacing.six,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: Spacing.five,
    },
    largeAvatar: {
        width: 100,
        height: 100,
        borderRadius: Radius.full,
        backgroundColor: Colors.surfaceVariant,
        marginBottom: Spacing.three,
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primaryContainer,
    },
    largeAvatarText: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 40,
        color: Colors.onPrimaryContainer,
    },
    name: {
        fontFamily: Fonts.headline,
        fontSize: 22,
        color: Colors.onSurface,
        marginBottom: Spacing.one,
    },
    role: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        textTransform: 'capitalize',
        backgroundColor: Colors.surfaceContainerHigh,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
        borderRadius: Radius.full,
        overflow: 'hidden',
    },
    infoSection: {
        marginBottom: Spacing.five,
    },
    sectionTitle: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 18,
        color: Colors.onSurface,
        marginBottom: Spacing.three,
    },
    infoCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.lg,
        padding: Spacing.three,
        shadowColor: Colors.onSurface,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.two,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        backgroundColor: Colors.primaryFixed,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.three,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        color: Colors.outline,
        marginBottom: Spacing.half,
    },
    infoValue: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 16,
        color: Colors.onSurface,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surfaceVariant,
        marginVertical: Spacing.two,
        marginLeft: 56, // Icon width (40) + margin (16)
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.three,
        backgroundColor: Colors.errorContainer,
        borderRadius: Radius.lg,
        marginTop: Spacing.two,
    },
    logoutText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 16,
        color: Colors.onErrorContainer,
        marginLeft: Spacing.two,
    },
});

export default ProfileScreen;
