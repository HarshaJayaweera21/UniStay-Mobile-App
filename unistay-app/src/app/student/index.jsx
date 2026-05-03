import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    Platform,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { deleteItem, getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_URL } from '@/constants/api';
import useAuth from '@/hooks/useAuth';
import BottomNav from '@/components/BottomNav';

const DASHBOARD_STATES = {
    LOADING: 'LOADING',
    NO_ROOM: 'NO_ROOM',
    PENDING_REQUEST: 'PENDING_REQUEST',
    HAS_ROOM: 'HAS_ROOM'
};

export default function StudentDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [dashboardState, setDashboardState] = useState(DASHBOARD_STATES.LOADING);
    const [requestData, setRequestData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const token = await getItem('userToken');
            
            // In a real app we might fetch user profile here as well
            // const userRes = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
            // const userData = await userRes.json();
            // if (userData.success) setUserName(userData.user.firstName);

            const response = await fetch(`${API_URL}/api/room-requests/my-request`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const request = data.request;
                if (!request || request.status === 'Rejected' || request.status === 'Cancelled') {
                    setDashboardState(DASHBOARD_STATES.NO_ROOM);
                    setRequestData(null);
                } else if (request.status === 'Approved') {
                    setDashboardState(DASHBOARD_STATES.HAS_ROOM);
                    setRequestData(request);
                } else {
                    setDashboardState(DASHBOARD_STATES.PENDING_REQUEST);
                    setRequestData(request);
                }
            } else {
                setDashboardState(DASHBOARD_STATES.NO_ROOM);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setDashboardState(DASHBOARD_STATES.NO_ROOM);
        }
    };

    const handleCancelRequest = async () => {
        Alert.alert(
            "Request Cancellation",
            "Are you sure you want to request cancellation for this room? This requires manager approval.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await getItem('userToken');
                            const response = await fetch(`${API_URL}/api/room-requests/my-request/cancel`, {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            const data = await response.json();
                            if (response.ok && data.success) {
                                Alert.alert("Success", "Cancellation requested successfully.");
                                fetchDashboardData();
                            } else {
                                Alert.alert("Error", data.message || "Failed to request cancellation.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Network error occurred.");
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        await deleteItem('userToken');
        await deleteItem('userRole');
        router.replace('/login');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const NoRoomView = () => (
        <View style={styles.viewContainer}>
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name="domain" size={48} color={Colors.primary} />
                </View>
                <Text style={styles.cardTitle}>Find your perfect room</Text>
                <Text style={styles.cardDescription}>
                    You haven't booked a stay yet. Explore our curated list of modern student residences designed for comfort, community, and productivity.
                </Text>
                
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/student/room-index')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>View Rooms</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const PendingRequestView = ({ request }) => (
        <View style={styles.viewContainer}>
            <TouchableOpacity 
                style={styles.card} 
                activeOpacity={request?.status === 'AgreementSent' ? 0.9 : 1}
                onPress={() => {
                    if (request?.status === 'AgreementSent') {
                        router.push('/student/my-room');
                    }
                }}
            >
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.overline}>STATUS OVERVIEW</Text>
                        <Text style={styles.cardTitleOverline}>ROOM REQUEST</Text>
                    </View>
                    <View style={request?.status === 'AgreementSent' ? styles.badgeAgreement : styles.badgePending}>
                        {request?.status !== 'AgreementSent' && <View style={styles.pingDot} />}
                        <Text style={request?.status === 'AgreementSent' ? styles.badgeAgreementText : styles.badgePendingText}>
                            {request?.status === 'AgreementSent' ? 'Action Required' : request?.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.roomDetailsContainer}>
                    <View style={styles.roomIconContainer}>
                        <MaterialIcons name="meeting-room" size={32} color={Colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.roomNumberText}>{request?.roomId?.roomNumber || 'Unknown Room'}</Text>
                        <Text style={styles.roomSubText}>{request?.roomId?.roomType} Room</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>SUBMITTED ON</Text>
                        <Text style={styles.infoValue}>{formatDate(request?.createdAt)}</Text>
                    </View>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>PROCESSING TIME</Text>
                        <Text style={styles.infoValue}>3-5 Business Days</Text>
                    </View>
                </View>

                {/* Cancel Request Button */}
                <TouchableOpacity 
                    style={[styles.cancelButton, request?.cancellationRequested && styles.cancelButtonDisabled]} 
                    onPress={handleCancelRequest}
                    disabled={request?.cancellationRequested}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="cancel" size={20} color={request?.cancellationRequested ? Colors.outline : Colors.error} />
                    <Text style={[styles.cancelButtonText, request?.cancellationRequested && styles.cancelButtonTextDisabled]}>
                        {request?.cancellationRequested ? "Cancellation Pending Approval" : "Request Cancellation"}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );

    const AssignedRoomView = ({ request }) => (
        <View style={styles.viewContainer}>
            <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => router.push('/student/my-room')}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.badgePrimary}>
                        <Text style={styles.badgePrimaryText}>YOUR ROOM</Text>
                    </View>
                    <View style={styles.roomIconContainerAssigned}>
                        <MaterialIcons name="meeting-room" size={36} color={Colors.primary} />
                    </View>
                </View>

                <View style={styles.assignedRoomMain}>
                    <Text style={styles.assignedRoomNumber}>{request?.roomId?.roomNumber || 'Unknown'}</Text>
                    <View style={styles.locationRow}>
                        <MaterialIcons name="location-on" size={16} color={Colors.onSurfaceVariant} />
                        <Text style={styles.locationText}>UniStay Residence</Text>
                    </View>
                </View>

                <View style={styles.pillsContainer}>
                    <View style={styles.pill}>
                        <MaterialIcons name="person" size={16} color={Colors.onSurfaceVariant} />
                        <Text style={styles.pillText}>{request?.roomId?.roomType} Room</Text>
                    </View>
                    <View style={styles.pill}>
                        <MaterialIcons name="payments" size={16} color={Colors.onSurfaceVariant} />
                        <Text style={styles.pillText}>LKR {request?.roomId?.pricePerMonth?.toLocaleString() || 0} / month</Text>
                    </View>
                    <View style={styles.badgeSuccess}>
                        <View style={styles.successDot} />
                        <Text style={styles.badgeSuccessText}>Occupied</Text>
                    </View>
                </View>

                {/* Cancel Request Button */}
                <TouchableOpacity 
                    style={[styles.cancelButton, request?.cancellationRequested && styles.cancelButtonDisabled]} 
                    onPress={handleCancelRequest}
                    disabled={request?.cancellationRequested}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="cancel" size={20} color={request?.cancellationRequested ? Colors.outline : Colors.error} />
                    <Text style={[styles.cancelButtonText, request?.cancellationRequested && styles.cancelButtonTextDisabled]}>
                        {request?.cancellationRequested ? "Cancellation Pending Approval" : "Request Cancellation"}
                    </Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        switch (dashboardState) {
            case DASHBOARD_STATES.LOADING:
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                );
            case DASHBOARD_STATES.NO_ROOM:
                return <NoRoomView />;
            case DASHBOARD_STATES.PENDING_REQUEST:
                return <PendingRequestView request={requestData} />;
            case DASHBOARD_STATES.HAS_ROOM:
                return <AssignedRoomView request={requestData} />;
            default:
                return <NoRoomView />;
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surfaceContainerLow }}>
            <ScrollView 
                style={styles.container} 
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
            <View style={styles.header}>
                {dashboardState !== DASHBOARD_STATES.LOADING && (
                    <>
                        {dashboardState === DASHBOARD_STATES.HAS_ROOM && (
                            <Text style={styles.overlineHeader}>STUDENT PORTAL</Text>
                        )}
                        <Text style={styles.headerTitle}>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}.</Text>
                        <Text style={styles.headerSubtitle}>
                            {dashboardState === DASHBOARD_STATES.HAS_ROOM 
                                ? "Your accommodation status has been updated. Explore your assigned room details below."
                                : dashboardState === DASHBOARD_STATES.PENDING_REQUEST
                                ? "Track your accommodation status and manage your student living experience all in one place."
                                : "Welcome to your new home journey. Let's find the space that defines your student life."
                            }
                        </Text>
                    </>
                )}
            </View>

            {renderContent()}

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/student/payments')}
                    activeOpacity={0.8}
                >
                    <View style={styles.actionIconContainer}>
                        <MaterialIcons name="receipt-long" size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.actionButtonText}>My Payments</Text>
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
        <BottomNav activeTab="home" />
    </View>
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
        paddingBottom: 100,
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
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
    // No Room specific
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.five,
    },
    cardTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 28,
        color: Colors.onSurface,
        marginBottom: Spacing.three,
        letterSpacing: -0.5,
    },
    cardTitleOverline: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 28,
        color: Colors.onSurface,
        letterSpacing: -0.5,
    },
    cardDescription: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        lineHeight: 24,
        marginBottom: Spacing.five,
    },
    primaryButton: {
        backgroundColor: Colors.primaryContainer,
        paddingVertical: 18,
        paddingHorizontal: Spacing.six,
        borderRadius: Radius.xl,
        alignItems: 'center',
        shadowColor: Colors.primaryContainer,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    primaryButtonText: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onPrimary,
    },
    
    // Pending specific
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.five,
    },
    overline: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: Spacing.one,
        opacity: 0.8,
    },
    badgePending: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.tertiaryFixed || '#ffdbcd',
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 20,
    },
    pingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.tertiary || '#943700',
        marginRight: Spacing.two,
    },
    badgePendingText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.onTertiaryFixedVariant || '#7d2d00',
    },
    badgeAgreement: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryContainer,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 20,
    },
    badgeAgreementText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        color: Colors.onPrimaryContainer,
        textTransform: 'uppercase',
    },
    roomDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.five,
    },
    roomIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.four,
    },
    roomNumberText: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 22,
        color: Colors.onSurface,
    },
    roomSubText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.three,
    },
    infoBox: {
        backgroundColor: Colors.surfaceContainer,
        padding: Spacing.four,
        borderRadius: 16,
        flex: 1,
        minWidth: 120,
    },
    infoLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        color: Colors.onSurfaceVariant,
        textTransform: 'uppercase',
        opacity: 0.7,
        marginBottom: Spacing.one,
    },
    infoValue: {
        fontFamily: Fonts.headline,
        fontSize: 15,
        color: Colors.onSurface,
    },

    // Assigned specific
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
    assignedRoomNumber: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 48,
        color: Colors.onSurface,
        letterSpacing: -2,
        marginBottom: Spacing.one,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        color: Colors.onSurfaceVariant,
        marginLeft: Spacing.one,
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.three,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        borderRadius: 12,
    },
    pillText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
        marginLeft: Spacing.two,
    },
    badgeSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1fae5',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.three,
        borderRadius: 12,
    },
    successDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: Spacing.two,
    },
    badgeSuccessText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 13,
        color: '#047857',
    },

    // Quick Actions
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
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        paddingVertical: 14,
        borderRadius: Radius.xl,
        marginTop: Spacing.five,
        gap: 8,
    },
    cancelButtonText: {
        fontFamily: Fonts.headline,
        fontSize: 15,
        color: Colors.error,
    },
    cancelButtonDisabled: {
        backgroundColor: Colors.surfaceContainerHighest,
        opacity: 0.7,
    },
    cancelButtonTextDisabled: {
        color: Colors.outline,
    }
});