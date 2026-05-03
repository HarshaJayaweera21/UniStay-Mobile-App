import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, SafeAreaView, StatusBar, Platform, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import BottomNav from '@/components/BottomNav';

export default function ManagerRequests() {
    const router = useRouter();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');

    const tabs = ['All', 'Cancellations', 'Pending', 'AgreementSent', 'ReceiptUploaded', 'Approved', 'Rejected'];

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const token = await getItem('userToken');
            let url = `${API_URL}/api/room-requests`;
            if (activeTab === 'Cancellations') {
                url = `${API_URL}/api/room-requests?cancellations=true`;
            } else if (activeTab !== 'All') {
                url = `${API_URL}/api/room-requests?status=${activeTab}`;
            }
                
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setRequests(data.requests);
            }
        } catch (err) {
            console.error('Error fetching requests:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRequest = async (id) => {
        Alert.alert(
            "Delete Request",
            "Are you sure you want to delete this request permanently? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const token = await getItem('userToken');
                            const res = await fetch(`${API_URL}/api/room-requests/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await res.json();
                            if (data.success) {
                                Alert.alert("Success", "Request deleted successfully.");
                                fetchRequests(); // Refresh list
                            } else {
                                Alert.alert("Error", data.message);
                            }
                        } catch (err) {
                            console.error('Error deleting request:', err);
                            Alert.alert("Error", "Failed to delete request.");
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return '#eab308';
            case 'AgreementSent': return Colors.primary;
            case 'ReceiptUploaded': return '#3b82f6';
            case 'Approved': return '#22c55e';
            case 'Rejected': return '#ef4444';
            default: return Colors.outline;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(`/manager/request-details?id=${item._id}`)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.roomInfo}>
                    <MaterialIcons name="meeting-room" size={20} color={Colors.primary} />
                    <Text style={styles.roomText}>Room {item.roomId?.roomNumber || 'N/A'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.statusBadge, { backgroundColor: item.cancellationRequested ? '#fee2e2' : `${getStatusColor(item.status)}15` }]}>
                        <View style={[styles.statusDot, { backgroundColor: item.cancellationRequested ? '#ef4444' : getStatusColor(item.status) }]} />
                        <Text style={[styles.statusText, { color: item.cancellationRequested ? '#ef4444' : getStatusColor(item.status) }]}>
                            {item.cancellationRequested ? 'Cancellation Req.' : item.status}
                        </Text>
                    </View>
                    {(item.status === 'Cancelled' || item.status === 'Rejected') && (
                        <TouchableOpacity 
                            onPress={() => handleDeleteRequest(item._id)}
                            style={styles.deleteBtn}
                        >
                            <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            
            <View style={styles.cardBody}>
                <View style={styles.studentInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {item.studentId?.firstName?.charAt(0)}{item.studentId?.lastName?.charAt(0)}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.studentName}>{item.studentId?.firstName} {item.studentId?.lastName}</Text>
                        <Text style={styles.studentEmail}>{item.studentId?.email}</Text>
                    </View>
                </View>
                
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Duration</Text>
                        <Text style={styles.detailValue}>{item.durationInMonths} months</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Key Money</Text>
                        <Text style={styles.detailValue}>Rs. {item.keyMoneyAmount?.toLocaleString()}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            

            <View style={styles.tabsContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={tabs}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.tabsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.tab, activeTab === item && styles.activeTab]}
                            onPress={() => setActiveTab(item)}
                        >
                            <Text style={[styles.tabText, activeTab === item && styles.activeTabText]}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : requests.length === 0 ? (
                <View style={styles.center}>
                    <MaterialIcons name="inbox" size={64} color={Colors.surfaceContainerHigh} />
                    <Text style={styles.emptyText}>No requests found for this status.</Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
            <BottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.surface, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    topAppBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, height: 60, backgroundColor: Colors.surface },
    appBarBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    topAppTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.onSurface },
    
    tabsContainer: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainer, paddingVertical: Spacing.two },
    tabsList: { paddingHorizontal: Spacing.four, gap: Spacing.two },
    tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.surfaceContainerHighest },
    activeTab: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    tabText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },
    activeTabText: { color: '#fff', fontFamily: Fonts.bodySemiBold },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.outline, marginTop: 12 },
    listContent: { padding: Spacing.four, gap: Spacing.three, paddingBottom: 100 },

    card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.four, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three, paddingBottom: Spacing.three, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainer },
    roomInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    roomText: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onSurface },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
    deleteBtn: { padding: 6, borderRadius: 8, backgroundColor: `${Colors.error}10` },

    cardBody: { gap: Spacing.three },
    studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontFamily: Fonts.headline, fontSize: 14, color: Colors.primary },
    studentName: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
    studentEmail: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },

    detailsRow: { flexDirection: 'row', backgroundColor: Colors.surfaceContainerHighest, padding: Spacing.three, borderRadius: Radius.lg, marginTop: Spacing.two },
    detailItem: { flex: 1 },
    detailLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 2 },
    detailValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
});
