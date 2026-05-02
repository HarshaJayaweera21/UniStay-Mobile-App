import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

import { useRouter } from 'expo-router';
import { getItem } from '@/utils/storage';

export default function BottomNav({ activeTab = 'home', onTabPress }) {
    const router = useRouter();
    const tabs = [
        { id: 'home', icon: 'home' },
        { id: 'scanner', icon: 'qr-code-scanner' },
        { id: 'messages', icon: 'chat-bubble' },
        { id: 'notifications', icon: 'notifications' },
        { id: 'events', icon: 'event-note' }
    ];

    const handlePress = async (id) => {
        if(onTabPress) onTabPress(id);
        
        if (id === 'scanner') {
            router.push('/student/qr');
        } else if (id === 'events') {
            const role = await getItem('userRole');
            if (role === 'manager') {
                router.push('/manager/leave-requests');
            } else {
                router.push('/student/leave-passes');
            }
        } else if (id === 'messages') {
            const role = await getItem('userRole');
            if (role === 'student') {
                router.push('/student/complaints');
            } else if (role === 'manager') {
                router.push('/manager/complaints');
            }
        } else if (id === 'home') {
            const role = await getItem('userRole');
            if (role) {
                router.push(`/${role}`);
            }
        }
    };

    return (
        <View style={styles.navContainer}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <TouchableOpacity 
                        key={tab.id}
                        style={[styles.navItem, isActive && styles.navItemActive]}
                        onPress={() => handlePress(tab.id)}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons 
                            name={tab.icon} 
                            size={28} 
                            color={isActive ? Colors.primary : 'rgba(25, 27, 35, 0.4)'} 
                        />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    navContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: Colors.surfaceContainerLowest, // Solid to prevent android shadow bleed
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 16, // So it sits above other content on Android
    },
    navItem: {
        padding: 12,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navItemActive: {
        backgroundColor: 'rgba(0, 74, 198, 0.15)', // primary/15
    }
});
