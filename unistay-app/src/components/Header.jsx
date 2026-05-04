import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Modal,
    Animated,
    TouchableWithoutFeedback,
    Dimensions
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter, usePathname } from 'expo-router';
import { deleteItem, getItem } from '@/utils/storage';
import { API_URL } from '@/constants/api';
import useAuth from '@/hooks/useAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = 320;

export default function Header({ showBackButton: forceShowBackButton }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const [hasActiveRequest, setHasActiveRequest] = useState(false);

    // Check if student has an active room request
    useEffect(() => {
        const checkRoomRequest = async () => {
            if (user?.role !== 'student') return;
            try {
                const token = await getItem('userToken');
                if (!token) return;
                const res = await fetch(`${API_URL}/api/room-requests/my-request`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.request) {
                    const activeStatuses = ['Pending', 'AgreementSent', 'ReceiptUploaded', 'Approved'];
                    setHasActiveRequest(activeStatuses.includes(data.request.status));
                } else {
                    setHasActiveRequest(false);
                }
            } catch (err) {
                console.error('Error checking room request:', err);
            }
        };
        checkRoomRequest();
    }, [user?.role]);

    const getInitials = () => {
        if (!user) return 'U';
        const first = user.firstName ? user.firstName.charAt(0) : '';
        const last = user.lastName ? user.lastName.charAt(0) : '';
        return (first + last).toUpperCase() || 'U';
    };

    const getFullName = () => {
        if (!user) return 'User';
        return `${user.firstName} ${user.lastName}`;
    };

    const openDrawer = () => {
        setDrawerOpen(true);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    };

    const closeDrawer = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -DRAWER_WIDTH,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setDrawerOpen(false);
        });
    };

    const handleLogout = async () => {
        closeDrawer();
        if (logout) {
            await logout();
        } else {
            await deleteItem('userToken');
            await deleteItem('userRole');
        }
        router.replace('/login');
    };

    const navigateTo = (path) => {
        closeDrawer();
        // Allow time for drawer to close before navigating to prevent stutter
        setTimeout(() => {
            if (pathname !== path) {
                router.push(path);
            }
        }, 150);
    };

    const DrawerItem = ({ icon, label, path, badge }) => {
        const isActive = pathname === path;
        return (
            <TouchableOpacity
                style={[styles.navItem, isActive && styles.navItemActive]}
                activeOpacity={0.7}
                onPress={() => navigateTo(path)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons
                        name={icon}
                        size={24}
                        color={isActive ? Colors.onPrimary : Colors.onSecondaryContainer}
                    />
                    <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                        {label}
                    </Text>
                </View>
                {badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };
    // Navigation Items
    const getNavItems = () => {
        switch (user?.role) {
            case 'manager':
                return [
                    { label: 'Dashboard', icon: 'dashboard', path: '/manager' },
                    { label: 'Room Management', icon: 'meeting-room', path: '/manager/room-index' },
                    { label: 'Room Requests', icon: 'list-alt', path: '/manager/requests', badge: hasActiveRequest ? '1' : null },
                    { label: 'Payments', icon: 'payment', path: '/manager/payments' }
                    
                ];
            case 'admin':
                return [
                    { label: 'Dashboard', icon: 'dashboard', path: '/admin' },
                ];
            case 'guard':
                return [
                    { label: 'Dashboard', icon: 'dashboard', path: '/guard' },
                    { label: 'Scan QR pass', icon: 'qr-code-scanner', path: '/guard/qrscan' },
                    { label: 'Announcements', icon: 'notifications', path: '/announcements/view' },
                ];
            case 'student':
            default: {
                const items = [
                    { label: 'Dashboard', icon: 'dashboard', path: '/student' },
                    { label: 'Payments', icon: 'receipt-long', path: '/student/payments' },
                ];
                if (!hasActiveRequest) {
                    items.splice(1, 0, { label: 'View Rooms', icon: 'bed', path: '/student/room-index' });
                }
                return items;
            }
        }
    };

    const navItems = getNavItems();

    const isRootScreen = [
        '/student',
        '/manager',
        '/announcements/manage', '/announcements/view',
        '/admin', '/guard'
    ].includes(pathname);

    const showBackButton = forceShowBackButton !== undefined ? forceShowBackButton : (router.canGoBack() && !isRootScreen);

    return (
        <>
            <View style={styles.container}>
                <View style={styles.leftSection}>
                    {showBackButton ? (
                        <TouchableOpacity
                            style={styles.menuButton}
                            activeOpacity={0.7}
                            onPress={() => router.back()}
                        >
                            <MaterialIcons name="arrow-back" size={28} color={Colors.primary} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.menuButton}
                            activeOpacity={0.7}
                            onPress={openDrawer}
                        >
                            <MaterialIcons name="menu" size={28} color={Colors.primary} />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.brandText}>UniStay</Text>
                </View>

                <View style={styles.rightSection}>
                    <TouchableOpacity 
                        activeOpacity={0.8}
                        style={styles.avatarContainer}
                        onPress={openDrawer}
                    >
                        {user?.profilePicture && user.profilePicture !== 'removed' ? (
                            <Image 
                                source={{ uri: user.profilePicture }} 
                                style={{ width: '100%', height: '100%', borderRadius: 20 }} 
                                contentFit="cover"
                            />
                        ) : (
                            <Text style={styles.avatarText}>{getInitials()}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                visible={isDrawerOpen}
                transparent={true}
                animationType="none"
                onRequestClose={closeDrawer}
            >
                <View style={styles.modalOverlayContainer}>
                    <TouchableWithoutFeedback onPress={closeDrawer}>
                        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                    </TouchableWithoutFeedback>

                    <Animated.View style={[
                        styles.drawerPanel,
                        { transform: [{ translateX: slideAnim }] }
                    ]}>

                        <View style={styles.drawerProfileSection}>
                            <View style={styles.drawerAvatar}>
                                {user?.profilePicture && user.profilePicture !== 'removed' ? (
                                    <Image 
                                        source={{ uri: user.profilePicture }} 
                                        style={{ width: '100%', height: '100%', borderRadius: 16 }} 
                                        contentFit="cover"
                                    />
                                ) : (
                                    <Text style={styles.drawerAvatarText}>{getInitials()}</Text>
                                )}
                            </View>
                            <View style={styles.drawerProfileRow}>
                                <View style={styles.drawerProfileInfo}>
                                    <Text style={styles.drawerNameText}>{getFullName()}</Text>
                                    <Text style={styles.drawerEmailText}>{user ? user.email : 'Loading...'}</Text>
                                    <Text style={styles.drawerIdText}>USERNAME: {user ? user.username : '...'}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.profileDetailButton}
                                    activeOpacity={0.7}
                                    onPress={() => navigateTo(user?.role === 'manager' ? '/manager/profile' : '/student/profile')}
                                >
                                    <MaterialIcons name="chevron-right" size={24} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Navigation Links */}
                        <View style={styles.drawerNavSection}>
                            {navItems.map((item, index) => {
                                const isActive = pathname === item.path || (pathname === '/' && item.path === '/student');
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.navItem,
                                            isActive && styles.navItemActive
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => navigateTo(item.path)}
                                    >
                                        <MaterialIcons
                                            name={item.icon}
                                            size={24}
                                            color={isActive ? Colors.onPrimary : Colors.onSecondaryContainer}
                                        />
                                        <Text style={[
                                            styles.navItemText,
                                            isActive && styles.navItemTextActive
                                        ]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Logout Section */}
                        <View style={styles.drawerFooterSection}>
                            <TouchableOpacity
                                style={styles.logoutButton}
                                activeOpacity={0.8}
                                onPress={handleLogout}
                            >
                                <MaterialIcons name="logout" size={24} color={Colors.onError} />
                                <Text style={styles.logoutButtonText}>LOG OUT</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // Header Styles
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: Spacing.four,
        backgroundColor: Colors.background,
        borderBottomWidth: 0,
        zIndex: 1000,
        elevation: 10,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuButton: {
        padding: Spacing.one,
        borderRadius: 24,
        marginRight: Spacing.three,
    },
    brandText: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 22,
        color: Colors.primary,
        letterSpacing: -0.5,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#dbe1ff', // Matching the image's light blue
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#004ac620',
    },
    avatarText: {
        fontFamily: Fonts.headlineBold,
        fontSize: 15,
        color: '#004ac6', // Matching the image's dark blue
    },

    // Modal & Backdrop Styles
    modalOverlayContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        zIndex: 9999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(25, 27, 35, 0.4)', // Dark Glassmorphism overlay
    },

    // Drawer Styles
    drawerPanel: {
        width: DRAWER_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: Colors.surfaceContainerLowest,
        flexDirection: 'col',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 24,
    },
    drawerProfileSection: {
        paddingHorizontal: Spacing.six,
        paddingTop: Platform.OS === 'ios' ? 80 : 60,
        paddingBottom: Spacing.five,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: Spacing.four,
    },
    drawerAvatar: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: Colors.primaryContainer,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primaryContainer,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    drawerAvatarText: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 24,
        color: Colors.onPrimary,
    },
    drawerProfileInfo: {
        flex: 1,
    },
    drawerProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    profileDetailButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: -25,
    },
    drawerNameText: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 22,
        color: Colors.onSurface,
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    drawerEmailText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        marginBottom: Spacing.one,
    },
    drawerIdText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: Spacing.one,
    },
    drawerNavSection: {
        flex: 1,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four,
        gap: Spacing.two,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        borderRadius: Radius.xl,
        gap: Spacing.three,
        marginBottom: Spacing.one,
    },
    navItemActive: {
        backgroundColor: Colors.primaryContainer,
    },
    navItemText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 15,
        color: Colors.onSecondaryContainer,
    },
    navItemTextActive: {
        color: Colors.onPrimary,
        fontFamily: Fonts.bodyBold,
    },
    drawerFooterSection: {
        padding: Spacing.six,
        paddingBottom: Platform.OS === 'ios' ? 80 : 60,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.error,
        paddingVertical: 18,
        borderRadius: Radius.xl,
        gap: Spacing.three,
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    logoutButtonText: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 15,
        color: Colors.onError,
        letterSpacing: 1.2,
    }
});
