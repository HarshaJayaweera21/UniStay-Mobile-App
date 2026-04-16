import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, Modal,
    Platform, StatusBar
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { PAYMENTS_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

const STATUS_UI = {
    Pending: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' }, // Amber
    Approved: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' }, // Emerald
    Rejected: { bg: Colors.errorContainer, text: '#991B1B', dot: Colors.error },
};

export default function ManagerPayments() {
    const router = useRouter();
    const [payments, setPayments] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
    const [typeModalVisible, setTypeModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchPayments = async (showSpinner = true) => {
        try {
            if (showSpinner) setIsLoading(true);
            setError('');
            const token = await getItem('userToken');
            const response = await fetch(PAYMENTS_URL, { headers: { Authorization: `Bearer ${token}` } });
            const data = await response.json();
            
            if (!response.ok) {
                setError(data.message || 'Failed to fetch payments.');
                return;
            }
            setPayments(data.payments || []);
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { fetchPayments(); }, []));

    const handleRefresh = () => { setIsRefreshing(true); fetchPayments(false); };

    const filteredPayments = payments.filter(p => {
        const matchStatus = activeFilter === 'All' || p.status === activeFilter;
        const pType = p.paymentType?.name || 'Standard';
        const matchType = activeTypeFilter === 'All Types' || pType === activeTypeFilter;
        return matchStatus && matchType;
    });

    const totalReceived = payments.filter(p => p.status === 'Approved').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingCount = payments.filter(p => p.status === 'Pending').length;
    const approvedCount = payments.filter(p => p.status === 'Approved').length;
    const rejectedCount = payments.filter(p => p.status === 'Rejected').length;

    const renderHeader = () => (
        <View style={styles.headerSection}>
            <View style={styles.topAppBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1, paddingLeft: Spacing.three }}>
                    <Text style={styles.headerTitle}>Manage Payments</Text>
                    <Text style={styles.headerSubtitle}>Review and verify student payments</Text>
                </View>
                <View style={styles.adminAvatar}>
                    <MaterialIcons name="admin-panel-settings" size={20} color={Colors.primary} />
                </View>
            </View>

            {/* Metrics Bento Grid */}
            <View style={styles.bentoGrid}>
                {/* Total Received */}
                <View style={styles.bentoCardStandard}>
                    <View style={[styles.bentoIconWrap, { backgroundColor: Colors.primaryFixed }]}>
                        <MaterialIcons name="account-balance-wallet" size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.bentoLabel}>Total Received</Text>
                    <Text style={styles.bentoHugeValue}>Rs. {totalReceived.toLocaleString()}</Text>
                </View>

                {/* Pending */}
                <View style={styles.bentoCardPending}>
                    <View style={styles.pendingHeaderRow}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialIcons name="warning" size={24} color="#B45309" />
                        </View>
                        <View style={styles.actionBadge}><Text style={styles.actionBadgeText}>Action Required</Text></View>
                    </View>
                    <Text style={styles.bentoLabel}>Pending Review</Text>
                    <Text style={styles.bentoHugeValue}>{pendingCount} Payments</Text>
                </View>

                {/* Half Cards */}
                <View style={styles.bentoHalfRow}>
                    <View style={styles.bentoHalfCard}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: '#D1FAE5', marginBottom: Spacing.two }]}>
                            <MaterialIcons name="verified" size={20} color="#047857" />
                        </View>
                        <Text style={styles.bentoLabel}>Verified</Text>
                        <Text style={styles.bentoBigValue}>{approvedCount}</Text>
                    </View>
                    <View style={styles.bentoHalfCard}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: Colors.errorContainer, marginBottom: Spacing.two }]}>
                            <MaterialIcons name="cancel" size={20} color={Colors.error} />
                        </View>
                        <Text style={styles.bentoLabel}>Rejected</Text>
                        <Text style={styles.bentoBigValue}>{rejectedCount}</Text>
                    </View>
                </View>
            </View>

            {/* Filters */}
            <View style={{ gap: Spacing.four, paddingBottom: Spacing.three }}>
                <View style={styles.fixedFilterRow}>
                    {FILTERS.map(f => {
                        const isActive = activeFilter === f;
                        return (
                            <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[styles.fixedFilterPill, isActive && styles.fixedFilterPillActive]}>
                                <Text style={[styles.fixedFilterPillText, isActive && styles.fixedFilterPillTextActive]}>{f}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={styles.dropdownButton} onPress={() => setTypeModalVisible(true)} activeOpacity={0.7}>
                    <Text style={styles.dropdownButtonText}>{activeTypeFilter}</Text>
                    <MaterialIcons name="expand-more" size={24} color={Colors.outline} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderItem = ({ item }) => {
        const uiConfig = STATUS_UI[item.status] || STATUS_UI.Pending;
        const studentName = item.studentId ? `${item.studentId.firstName} ${item.studentId.lastName}` : 'Unknown Student';
        const studentUsername = item.studentId?.username || 'N/A';

        return (
            <TouchableOpacity style={styles.paymentCard} activeOpacity={0.88} onPress={() => router.push(`/manager/payment-detail?id=${item._id}`)}>
                <View style={styles.cardTop}>
                    <View style={styles.avatarBox}>
                        <MaterialIcons name="person" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.studentInfo}>
                        <Text style={styles.studentName} numberOfLines={1}>{studentName}</Text>
                        <Text style={styles.studentRoom}>@{studentUsername}</Text>
                    </View>
                    <View style={styles.chevronBox}>
                        <MaterialIcons name="chevron-right" size={24} color={Colors.onSurface} />
                    </View>
                </View>

                <View style={styles.cardDetails}>
                    <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>TYPE</Text>
                        <Text style={styles.detailText}>{item.paymentType?.name || 'Standard'}</Text>
                    </View>
                    <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>DATE</Text>
                        <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                </View>

                <View style={styles.cardBottom}>
                    <Text style={styles.amountText}>LKR {parseFloat(item.amount).toLocaleString()}</Text>
                    <View style={[styles.statusPill, { backgroundColor: uiConfig.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: uiConfig.dot }]} />
                        <Text style={[styles.statusText, { color: uiConfig.text }]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading && !isRefreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {error ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="error-outline" size={48} color={Colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchPayments()} style={{ marginTop: 12 }}>
                        <Text style={{ fontFamily: Fonts.bodySemiBold, color: Colors.primary }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredPayments}
                    keyExtractor={i => i._id}
                    renderItem={renderItem}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <MaterialIcons name="receipt-long" size={48} color={Colors.outlineVariant} />
                            <Text style={styles.emptyTitle}>No Payments Found</Text>
                        </View>
                    }
                />
            )}

            <Modal visible={typeModalVisible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTypeModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalDragIndicator} />
                        <Text style={styles.modalTitle}>Select Payment Type</Text>
                        {['All Types', ...new Set(payments.map(p => p.paymentType?.name || 'Standard'))].map(type => (
                            <TouchableOpacity 
                                key={type} 
                                style={[styles.modalOption, activeTypeFilter === type && styles.modalOptionActive]} 
                                onPress={() => { setActiveTypeFilter(type); setTypeModalVisible(false); }}
                            >
                                <Text style={[styles.modalOptionText, activeTypeFilter === type && styles.modalOptionTextActive]}>{type}</Text>
                                {activeTypeFilter === type && <MaterialIcons name="check" size={20} color={Colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.surface, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    centerContainer: { flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 100 },
    
    headerSection: {
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.four,
    },
    topAppBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.four,
        marginBottom: Spacing.two,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.full, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, elevation: 2 },
    headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 24, color: Colors.primary },
    headerSubtitle: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },
    adminAvatar: { width: 44, height: 44, backgroundColor: Colors.primaryFixed, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },

    bentoGrid: { gap: Spacing.three, marginBottom: Spacing.four },
    bentoCardStandard: { backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.four, borderRadius: Radius['2xl'], shadowColor: '#191b23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, elevation: 2 },
    bentoCardPending: { backgroundColor: '#F0F9FF', padding: Spacing.four, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: '#BAE6FD' },
    bentoHalfRow: { flexDirection: 'row', gap: Spacing.three },
    bentoHalfCard: { flex: 1, backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.three, borderRadius: Radius['2xl'], shadowColor: '#191b23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, elevation: 2 },

    bentoIconWrap: { width: 38, height: 38, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.two },
    bentoLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSurfaceVariant },
    bentoHugeValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 24, color: Colors.onSurface, marginTop: 4 },
    bentoBigValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginTop: 4 },
    
    pendingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    actionBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius:Radius.md },
    actionBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: '#92400E', textTransform: 'uppercase' },

    fixedFilterRow: { flexDirection: 'row', gap: Spacing.two },
    fixedFilterPill: { flex: 1, backgroundColor: Colors.surfaceContainerHigh, paddingVertical: 12, borderRadius: Radius.full, alignItems: 'center' },
    fixedFilterPillActive: { backgroundColor: Colors.primary },
    fixedFilterPillText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSurfaceVariant },
    fixedFilterPillTextActive: { color: Colors.onPrimary },

    dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceContainerLowest, paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.outlineVariant },
    dropdownButtonText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: Radius['3xl'], borderTopRightRadius: Radius['3xl'], padding: Spacing.five, paddingBottom: 40 },
    modalDragIndicator: { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.four },
    modalTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface, marginBottom: Spacing.four },
    modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.three, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh },
    modalOptionActive: { backgroundColor: Colors.primaryContainer, borderRadius: Radius.lg, paddingHorizontal: Spacing.three, borderBottomWidth: 0, marginVertical: 2 },
    modalOptionText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurface },
    modalOptionTextActive: { fontFamily: Fonts.bodyBold, color: Colors.onPrimaryContainer },

    paymentCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius['2xl'],
        padding: Spacing.five,
        marginHorizontal: Spacing.four,
        marginBottom: Spacing.three,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.four },
    avatarBox: { width: 48, height: 48, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radius.xl, justifyContent: 'center', alignItems: 'center' },
    studentInfo: { flex: 1, marginLeft: Spacing.three },
    studentName: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, color: Colors.onSurface, marginBottom: 2 },
    studentRoom: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant },
    chevronBox: { width: 40, height: 40, backgroundColor: Colors.surfaceContainer, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },

    cardDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.five },
    detailCol: { flex: 1 },
    detailLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', color: Colors.outline, marginBottom: 4, letterSpacing: 0.5 },
    detailText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },

    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountText: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.primary },
    statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontFamily: Fonts.bodyBold, fontSize: 11, letterSpacing: 0.5 },

    errorText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.error, marginTop: 12 },
    emptyTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 18, color: Colors.onSurfaceVariant, marginTop: 8 }
});
