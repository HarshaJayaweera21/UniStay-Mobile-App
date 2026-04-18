import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import storage from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';

export default function AdminDashboard() {
    const router = useRouter();

    const handleLogout = async () => {
        await storage.deleteItem('userToken');
        await storage.deleteItem('userRole');
        router.replace('/login');
    };

    const modules = [
        {
            title: 'Complaints Management',
            subtitle: 'Admin override for all student issues',
            icon: 'shield-checkmark-outline',
            route: '/manager/complaints/',
            color: Colors.error,
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>System Administrator</Text>
                    <Text style={styles.title}>Admin Panel</Text>
                </View>
                <Pressable 
                    onPress={handleLogout} 
                    style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
                >
                    <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                </Pressable>
            </View>

            <View style={styles.moduleGrid}>
                {modules.map((module, index) => (
                    <Pressable
                        key={index}
                        style={({ pressed }) => [
                            styles.moduleCard,
                            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
                        ]}
                        onPress={() => router.push(module.route)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: module.color + '15' }]}>
                            <Ionicons name={module.icon} size={32} color={module.color} />
                        </View>
                        <View style={styles.moduleInfo}>
                            <Text style={styles.moduleTitle}>{module.title}</Text>
                            <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.outline} />
                    </Pressable>
                ))}
            </View>
        </ScrollView>
    );
}

import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    scrollContent: {
        padding: Spacing.four,
        paddingTop: Spacing.six,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.five,
    },
    welcomeText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
    },
    title: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 32,
        color: Colors.onSurface,
        letterSpacing: -1,
    },
    logoutButton: {
        width: 48,
        height: 48,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceContainerLowest,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moduleGrid: {
        gap: Spacing.three,
    },
    moduleCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.four,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: Radius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.three,
    },
    moduleInfo: {
        flex: 1,
    },
    moduleTitle: {
        fontFamily: Fonts.headline,
        fontSize: 18,
        color: Colors.onSurface,
    },
    moduleSubtitle: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
    },
});
