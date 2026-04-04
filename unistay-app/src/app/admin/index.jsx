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

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Admin Dashboard</Text>
                <Text style={styles.subtitle}>Module under development</Text>
                
                <Pressable 
                    onPress={handleLogout} 
                    style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
                >
                    <Text style={styles.buttonText}>Log Out</Text>
                </Pressable>
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
        boxShadow: '0px 8px 16px rgba(25, 27, 35, 0.1)',
    },
    title: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 24,
        color: Colors.error, // Red accent for admin
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
    },
    buttonText: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onSecondaryContainer,
    }
});
