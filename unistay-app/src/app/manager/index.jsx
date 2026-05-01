import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ManagerDashboard() {
    const router = useRouter();

    const handleLogout = async () => {
        await deleteItem('userToken');
        await deleteItem('userRole');
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Manager Dashboard</Text>
                <Text style={styles.subtitle}>Hostel Management</Text>

                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => router.push('/manager/payments')}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="receipt-long" size={24} color={Colors.onPrimary} />
                    <Text style={styles.navButtonText}>Manage Payments</Text>
                    <MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogout} style={styles.button}>
                    <Text style={styles.buttonText}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.four,
    },
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        alignItems: 'center',
        width: '100%',
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 6,
    },
    title: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 24,
        color: Colors.tertiary,
        marginBottom: Spacing.two,
    },
    subtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        marginBottom: Spacing.five,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.five,
        paddingVertical: Spacing.three,
        borderRadius: Radius.lg,
        width: '100%',
        marginBottom: Spacing.four,
        gap: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    navButtonText: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onPrimary,
        flex: 1,
    },
    button: {
        backgroundColor: Colors.secondaryContainer,
        paddingHorizontal: Spacing.five,
        paddingVertical: Spacing.three,
        borderRadius: Radius.lg,
    },
    buttonText: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onSecondaryContainer,
    }
});