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
import { TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

const STATUS_UI = {
    Pending: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' }, // Amber
    Approved: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' }, // Emerald
    Rejected: { bg: Colors.errorContainer, text: '#991B1B', dot: Colors.error },
};

export default function ManagerPayments() {
    const router = useRouter();

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [payments, setPayments] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [isShowingAll, setIsShowingAll] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
    const [typeModalVisible, setTypeModalVisible] = useState(false);
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [fromDate, setFromDate] = useState(firstDay);
    const [toDate, setToDate] = useState(lastDay);
    const [tempFromDate, setTempFromDate] = useState(firstDay);
    const [tempToDate, setTempToDate] = useState(lastDay);
    const [showPickerFor, setShowPickerFor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchPayments = async (showSpinner = true, loadAll = isShowingAll, queryFrom = fromDate, queryTo = toDate) => {
        try {
            if (showSpinner) setIsLoading(true);
            setError('');
            const token = await getItem('userToken');
            
            let url = loadAll ? `${PAYMENTS_URL}?limit=5000` : `${PAYMENTS_URL}?limit=50`;
            if (queryFrom) url += `&fromDate=${queryFrom}`;
            if (queryTo) {
                const endOfDay = new Date(queryTo);
                if (!isNaN(endOfDay)) {
                    endOfDay.setHours(23, 59, 59, 999);
                    url += `&toDate=${endOfDay.toISOString()}`;
                }
            }

            const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await response.json();
            
            if (!response.ok) {
                setError(data.message || 'Failed to fetch payments.');
                return;
            }
            setPayments(data.payments || []);
            setPagination(data.pagination || null);
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        const currentPickerFor = showPickerFor;
        setShowPickerFor(null);
        if (selectedDate && event.type !== 'dismissed') {
            const dateStr = selectedDate.toISOString().split('T')[0];
            if (currentPickerFor === 'from') setTempFromDate(dateStr);
            if (currentPickerFor === 'to') setTempToDate(dateStr);
        }
    };

    const applyDateFilter = () => {
        setFromDate(tempFromDate);
        setToDate(tempToDate);
        setDateModalVisible(false);
        setIsShowingAll(false);
        fetchPayments(true, false, tempFromDate, tempToDate);
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    useFocusEffect(useCallback(() => { fetchPayments(); }, []));

    const handleRefresh = () => { setIsRefreshing(true); fetchPayments(false); };

    const filteredPayments = payments.filter(p => {
        const matchStatus = activeFilter === 'All' || p.status === activeFilter;
        const pType = p.paymentType?.name || 'Standard';
        const matchType = activeTypeFilter === 'All Types' || pType === activeTypeFilter;
        return matchStatus && matchType;
    });

    const periodApprovedTotal = payments.filter(p => p.status === 'Approved').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingCount = payments.filter(p => p.status === 'Pending').length;
    const approvedCount = payments.filter(p => p.status === 'Approved').length;
    const rejectedCount = payments.filter(p => p.status === 'Rejected').length;

    const currentPeriodText = fromDate || toDate ? `${fromDate ? formatDate(fromDate) : 'Start'} to ${toDate ? formatDate(toDate) : 'End'}` : 'All Time';
    const filteredTotalAmount = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const renderHeader = () => (
        <View style={styles.headerSection}>

            {/* Metrics Bento Grid */}
            <View style={styles.bentoGrid}>
                {/* Period Summary Card */}
                <View style={styles.bentoCardStandard}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.two}}>
                        <View style={[styles.bentoIconWrap, { backgroundColor: Colors.primaryFixed, marginBottom: 0 }]}>
                            <MaterialIcons name="account-balance-wallet" size={24} color={Colors.primary} />
                        </View>
                        <View style={{backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full}}>
                            <Text style={{fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.onSurfaceVariant}}>{currentPeriodText}</Text>
                        </View>
                    </View>
                    <Text style={styles.bentoLabel}>Total Approved in this Period</Text>
                    <Text style={styles.bentoHugeValue}>LKR {periodApprovedTotal.toLocaleString()}</Text>
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

            {/* Dynamic Filter Calculation */}
            {(activeFilter !== 'All' || activeTypeFilter !== 'All Types') && filteredPayments.length > 0 && (
                <View style={styles.filterAnalyticsBox}>
                    <View style={styles.filterAnalyticsIcon}>
                        <MaterialIcons name="calculate" size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.filterAnalyticsLabel}>Calculated from active filters</Text>
                        <Text style={styles.filterAnalyticsValue}>
                            LKR {filteredTotalAmount.toLocaleString()} <Text style={styles.filterAnalyticsSubtext}>({filteredPayments.length} items)</Text>
                        </Text>
                    </View>
                </View>
            )}

            {/* Filters */}
            <View style={{ gap: Spacing.four, paddingBottom: Spacing.three }}>
                <View style={[styles.fixedFilterRow, { marginBottom: Spacing.three }]}>
                    {FILTERS.map(f => {
                        const isActive = activeFilter === f;
                        return (
                            <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[styles.fixedFilterPill, isActive && styles.fixedFilterPillActive]}>
                                <Text style={[styles.fixedFilterPillText, isActive && styles.fixedFilterPillTextActive]}>{f}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TouchableOpacity style={[styles.dropdownButton, {flex: 1}]} onPress={() => setTypeModalVisible(true)} activeOpacity={0.7}>
                        <Text style={styles.dropdownButtonText}>{activeTypeFilter}</Text>
                        <MaterialIcons name="expand-more" size={24} color={Colors.outline} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.dropdownButton, {flex: 1}]} onPress={() => { setTempFromDate(fromDate); setTempToDate(toDate); setDateModalVisible(true); }} activeOpacity={0.7}>
                        <MaterialIcons name="date-range" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.dropdownButtonText} numberOfLines={1}>
                            {fromDate || toDate ? `${fromDate?.slice(5) || '..'} to ${toDate?.slice(5) || '..'}` : 'All Dates'}
                        </Text>
                    </TouchableOpacity>
                </View>
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
                    ListFooterComponent={() => {
                        if (!pagination) return <View style={{ height: 40 }} />;
                        if (pagination.total > payments.length && !isShowingAll) {
                            return (
                                <TouchableOpacity 
                                    style={styles.viewAllBtn} 
                                    activeOpacity={0.8}
                                    onPress={() => { setIsShowingAll(true); fetchPayments(true, true); }}
                                >
                                    <Text style={styles.viewAllText}>Load All {pagination.total} Payments</Text>
                                    <MaterialIcons name="expand-more" size={20} color={Colors.primary} />
                                </TouchableOpacity>
                            );
                        }
                        return <View style={{ height: 40 }} />;
                    }}
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
            <Modal visible={dateModalVisible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDateModalVisible(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        <View style={styles.modalDragIndicator} />
                        <Text style={styles.modalTitle}>Filter by Date</Text>
                        
                        <View style={{ gap: Spacing.two, marginBottom: Spacing.four }}>
                            <View>
                                <Text style={styles.dateInputLabel}>From Date</Text>
                                <TouchableOpacity style={styles.dateInput} onPress={() => setShowPickerFor('from')} activeOpacity={0.7}>
                                    <Text style={[styles.dateInputText, !tempFromDate && { color: Colors.outlineVariant }]}>
                                        {tempFromDate ? formatDate(tempFromDate) : 'Select Date'}
                                    </Text>
                                    <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>
                            <View>
                                <Text style={styles.dateInputLabel}>To Date</Text>
                                <TouchableOpacity style={styles.dateInput} onPress={() => setShowPickerFor('to')} activeOpacity={0.7}>
                                    <Text style={[styles.dateInputText, !tempToDate && { color: Colors.outlineVariant }]}>
                                        {tempToDate ? formatDate(tempToDate) : 'Select Date'}
                                    </Text>
                                    <MaterialIcons name="calendar-today" size={18} color={Colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        
                        {showPickerFor && (
                            <DateTimePicker
                                value={
                                    showPickerFor === 'from' && tempFromDate ? new Date(tempFromDate) : 
                                    showPickerFor === 'to' && tempToDate ? new Date(tempToDate) : 
                                    new Date()
                                }
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                            />
                        )}
                        
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.five }}>
                            <TouchableOpacity style={styles.presetChip} onPress={() => { setTempFromDate(firstDay); setTempToDate(lastDay); }}>
                                <Text style={styles.presetChipText}>Current Month</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.presetChip} onPress={() => { setTempFromDate(''); setTempToDate(''); }}>
                                <Text style={styles.presetChipText}>All Time</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setDateModalVisible(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmit} onPress={applyDateFilter}>
                                <Text style={styles.modalSubmitText}>Apply Filter</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.surface },
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

    dateInputLabel: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.outline, marginBottom: 4 },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.lg, padding: Spacing.three },
    dateInputText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurface },
    presetChip: { backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full },
    presetChipText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },
    modalCancel: { flex: 1, paddingVertical: 14, borderRadius: Radius.xl, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center' },
    modalCancelText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onSurfaceVariant },
    modalSubmit: { flex: 1.5, paddingVertical: 14, borderRadius: Radius.xl, backgroundColor: Colors.primary, alignItems: 'center' },
    modalSubmitText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onPrimary },

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
    emptyTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 18, color: Colors.onSurfaceVariant, marginTop: 8 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.four, marginVertical: Spacing.two, gap: 4, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.primaryContainer, borderStyle: 'dashed' },
    viewAllText: { fontFamily: Fonts.headlineSemiBold, fontSize: 14, color: Colors.primary },

    filterAnalyticsBox: { backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.three, borderRadius: Radius.xl, marginBottom: Spacing.four, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.outlineVariant },
    filterAnalyticsIcon: { width: 36, height: 36, borderRadius: Radius.lg, backgroundColor: Colors.surfaceContainer, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.three },
    filterAnalyticsLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 2 },
    filterAnalyticsValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, color: Colors.onSurface },
    filterAnalyticsSubtext: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.outline }
});
