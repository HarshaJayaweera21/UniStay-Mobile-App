import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

import { useRouter } from 'expo-router';
import { getItem } from '@/utils/storage';

export default function BottomNav({ activeTab = 'home', onTabPress }) {
    const router = useRouter();
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const fetchRole = async () => {
            const role = await getItem('userRole');
            setUserRole(role);
        };
        fetchRole();
    }, []);

    let tabs = [
        { id: 'home', icon: 'home' },
        { id: 'scanner', icon: 'qr-code-scanner' },
        { id: 'messages', icon: 'chat-bubble' },
        { id: 'notifications', icon: 'notifications' },
        { id: 'events', icon: 'event-note' }
    ];

    if (userRole === 'guard') {
        tabs = [
            { id: 'home', icon: 'home' },
            { id: 'scanner', icon: 'qr-code-scanner' },
            { id: 'notifications', icon: 'notifications' }
        ];
    } else if (userRole === 'manager') {
        tabs = tabs.filter(tab => tab.id !== 'scanner');
    }

    const handlePress = async (id) => {
        if (onTabPress) onTabPress(id);

        const currentRole = userRole || await getItem('userRole');

        if (id === 'scanner') {
            if (currentRole === 'guard') {
                router.push('/guard/qrscan');
            } else {
                router.push('/student/qr');
            }
        } else if (id === 'events') {
            if (currentRole === 'manager') {
                router.push('/manager/leave-requests');
            } else {
                router.push('/student/leave-passes');
            }
        } else if (id === 'messages') {
            if (currentRole === 'student') {
                router.push('/student/complaints');
            } else if (currentRole === 'manager') {
                router.push('/manager/complaints');
            }
        } else if (id === 'notifications') {
            if (currentRole === 'manager') {
                router.push('/announcements/manage');
            } else {
                router.push('/announcements/view');
            }
        } else if (id === 'home') {
            if (currentRole) {
                router.push(`/${currentRole}`);
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
        height: Platform.OS === 'ios' ? 86 : 85,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 24 : 18,
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 16,
        zIndex: 20,
    },
    navItem: {
        padding: 8,
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navItemActive: {
        backgroundColor: 'rgba(0, 74, 198, 0.15)', // primary/15
    }
});
