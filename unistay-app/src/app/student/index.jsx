import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';

export default function StudentDashboard() {
    const router = useRouter();

    const handleLogout = async () => {
        await deleteItem('userToken');
        await deleteItem('userRole');
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Student Dashboard</Text>
                <Text style={styles.subtitle}>Module under development</Text>

                <TouchableOpacity onPress={() => router.push('/announcements/view')} style={[styles.button, styles.viewButton]}>
                    <Text style={styles.buttonText}>View Announcements</Text>
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
        color: Colors.primary,
        marginBottom: Spacing.two,
    },
    subtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        marginBottom: Spacing.six,
    },
    button: {
        backgroundColor: Colors.secondaryContainer,
        paddingHorizontal: Spacing.five,
        paddingVertical: Spacing.three,
        borderRadius: Radius.lg,
        marginBottom: Spacing.three,
        width: '100%',
        alignItems: 'center',
    },
    viewButton: {
        backgroundColor: Colors.primaryContainer,
    },
    manageButton: {
        backgroundColor: Colors.errorContainer,
    },
    buttonText: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onSecondaryContainer,
    }
});