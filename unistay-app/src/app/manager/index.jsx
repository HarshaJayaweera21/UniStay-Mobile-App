import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteItem, getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_URL } from '@/constants/api';

export default function ManagerDashboard() {
    const router = useRouter();
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = await getItem('userToken');
                if (token) {
                    const response = await fetch(`${API_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                        setUserName(data.user.firstName);
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = async () => {
        await deleteItem('userToken');
        await deleteItem('userRole');
        router.replace('/login');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                <Text style={styles.overlineHeader}>MANAGER PORTAL</Text>
                <Text style={styles.headerTitle}>Welcome back{userName ? `, ${userName}` : ''}.</Text>
                <Text style={styles.headerSubtitle}>
                    Manage hostel bookings, approve student payments, and oversee daily operations from your dashboard.
                </Text>
            </View>

            <View style={styles.viewContainer}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.badgePrimary}>
                            <Text style={styles.badgePrimaryText}>OVERVIEW</Text>
                        </View>
                        <View style={styles.roomIconContainerAssigned}>
                            <MaterialIcons name="analytics" size={36} color={Colors.primary} />
                        </View>
                    </View>

                    <View style={styles.assignedRoomMain}>
                        <Text style={styles.cardDescription}>
                            Pending tasks and recent activities will appear here once the backend analytics are fully integrated.
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.quickActionsContainer}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/manager/room-index')}
                    activeOpacity={0.8}
                >
                    <View style={styles.actionIconContainer}>
                        <MaterialIcons name="meeting-room" size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.actionButtonText}>Approve Bookings</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/manager/payments')}
                    activeOpacity={0.8}
                >
                    <View style={styles.actionIconContainer}>
                        <MaterialIcons name="receipt-long" size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.actionButtonText}>Review Payments</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
                    <View style={[styles.actionIconContainer, { backgroundColor: `${Colors.error}15` }]}>
                        <MaterialIcons name="logout" size={24} color={Colors.error} />
                    </View>
                    <Text style={[styles.actionButtonText, { color: Colors.error }]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLow,
    },
    contentContainer: {
        padding: Spacing.four,
        paddingTop: Platform.OS === 'ios' ? Spacing.six : Spacing.four,
        paddingBottom: Spacing.six,
    },
    header: {
        marginTop: Spacing.four,
        marginBottom: Spacing.five,
        paddingHorizontal: Spacing.two,
    },
    overlineHeader: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: Spacing.two,
    },
    headerTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 36,
        color: Colors.onSurface,
        letterSpacing: -1,
        marginBottom: Spacing.two,
    },
    headerSubtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        lineHeight: 24,
    },
    viewContainer: {
        marginBottom: Spacing.five,
    },
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: 32,
        padding: Spacing.five,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.five,
    },
    badgePrimary: {
        backgroundColor: `${Colors.primary}15`,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 20,
    },
    badgePrimaryText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    roomIconContainerAssigned: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: Colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ rotate: '-6deg' }],
    },
    assignedRoomMain: {
        marginBottom: Spacing.five,
    },
    cardDescription: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        lineHeight: 24,
    },
    quickActionsContainer: {
        marginTop: Spacing.two,
        paddingHorizontal: Spacing.two,
    },
    sectionTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 20,
        color: Colors.onSurface,
        marginBottom: Spacing.four,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        padding: Spacing.four,
        borderRadius: 24,
        marginBottom: Spacing.four,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: `${Colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.four,
    },
    actionButtonText: {
        flex: 1,
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onSurface,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        padding: Spacing.four,
        borderRadius: 24,
        marginBottom: Spacing.four,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
    }
});