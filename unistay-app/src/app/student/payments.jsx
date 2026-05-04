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
import BottomNav from '@/components/BottomNav';
import DateTimePicker from '@react-native-community/datetimepicker';
const STATUS_COLORS = {
    Pending: { bg: '#FEF3C7', text: '#B45309' }, // Amber/Yellow
    Approved: { bg: '#DCFCE7', text: '#15803D' }, // Green
    Rejected: { bg: '#FEE2E2', text: '#B91C1C' }, // Red
};

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function StudentPayments() {
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

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) { setError(data.message || 'Failed to fetch payments.'); return; }
            setPayments(data.payments || []);
            setPagination(data.pagination || null);
        } catch (err) {
            setError('Network error. Please check your connection.');
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

    useFocusEffect(useCallback(() => { fetchPayments(); }, []));

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const getIconForType = (typeName) => {
        const lower = (typeName || '').toLowerCase();
        if (lower.includes('tuition')) return 'school';
        if (lower.includes('accommodation') || lower.includes('hostel') || lower.includes('room')) return 'home-work';
        if (lower.includes('library')) return 'book-online';
        if (lower.includes('sport')) return 'sports-soccer';
        return 'receipt-long';
    };

    const totalPaid = payments.filter(p => p.status === 'Approved').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const totalRejected = payments.filter(p => p.status === 'Rejected').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    const renderHeader = () => (
        <View style={styles.headerSection}>
            <Text style={styles.pageTitle}>Payments</Text>
            <Text style={styles.pageSubtitle}>Track your transactions</Text>

            <View style={styles.summaryContainer}>
                {/* Total Paid Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Total Paid</Text>
                        <Text style={[styles.summaryAmount, { color: Colors.primary }]}>LKR {totalPaid.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRight}>
                        <MaterialIcons name="check-circle" size={16} color="#16A34A" />
                        <Text style={[styles.summaryStatusText, { color: '#15803D' }]}>Fully Settled</Text>
                    </View>
                </View>

                {/* Pending Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Pending</Text>
                        <Text style={[styles.summaryAmount, { color: Colors.onSurface }]}>LKR {totalPending.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRight}>
                        <MaterialIcons name="hourglass-empty" size={16} color="#D97706" />
                        <Text style={[styles.summaryStatusText, { color: '#B45309' }]}>Awaiting clearance</Text>
                    </View>
                </View>

                {/* Rejected Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryLabel}>Rejected</Text>
                        <Text style={[styles.summaryAmount, { color: Colors.error }]}>LKR {totalRejected.toLocaleString()}</Text>
                    </View>
                    <View style={styles.summaryRight}>
                        <MaterialIcons name="cancel" size={16} color={Colors.error} />
                        <Text style={[styles.summaryStatusText, { color: Colors.error }]}>Requires action</Text>
                    </View>
                </View>
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Recent Activity</Text>
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

                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                    <TouchableOpacity 
                        style={[styles.dropdownButton, { flex: 1, opacity: payments.length === 0 ? 0.5 : 1 }]} 
                        onPress={() => setTypeModalVisible(true)} 
                        activeOpacity={0.7}
                        disabled={payments.length === 0}
                    >
                        <Text style={styles.dropdownButtonText}>{activeTypeFilter}</Text>
                        <MaterialIcons name="expand-more" size={24} color={Colors.outline} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.dropdownButton, { flex: 1 }]} onPress={() => { setTempFromDate(fromDate); setTempToDate(toDate); setDateModalVisible(true); }} activeOpacity={0.7}>
                        <MaterialIcons name="date-range" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.dropdownButtonText} numberOfLines={1}>
                            {fromDate || toDate ? `${fromDate?.slice(5) || '..'} to ${toDate?.slice(5) || '..'}` : 'All Dates'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const filteredPayments = payments.filter(p => {
        const matchStatus = activeFilter === 'All' || p.status === activeFilter;
        const pType = p.paymentType?.name || 'Standard';
        const matchType = activeTypeFilter === 'All Types' || pType === activeTypeFilter;
        return matchStatus && matchType;
    });

    const renderItem = ({ item }) => {
        const sc = STATUS_COLORS[item.status] || STATUS_COLORS.Pending;
        return (
            <TouchableOpacity style={styles.transactionCard} activeOpacity={0.9} onPress={() => router.push(`/student/payment-view?id=${item._id}`)}>
                <View style={styles.transactionLeft}>
                    <View style={styles.iconBox}>
                        <MaterialIcons name={getIconForType(item.paymentType?.name)} size={26} color={Colors.primary} />
                    </View>
                    <View style={styles.transactionTexts}>
                        <Text style={styles.transactionTitle}>{item.paymentType?.name || 'Unknown'}</Text>
                        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}{item.roomId ? ` • Room ${item.roomId.roomNumber}` : ''}</Text>
                    </View>
                </View>

                <View style={styles.transactionRight}>
                    <View style={styles.amountContainer}>
                        <Text style={styles.transactionAmount}>LKR {parseFloat(item.amount).toLocaleString()}</Text>
                        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                            <Text style={[styles.statusText, { color: sc.text }]}>{item.status}</Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.outlineVariant} style={{ opacity: 0.5 }} />
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading && payments.length === 0) return (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadText}>Loading payments...</Text></View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Top App Bar */}
                <View style={styles.topAppBar}>
                    <TouchableOpacity style={styles.appBarBtn} onPress={() => router.back()} activeOpacity={0.7}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.appBarBtn} />
                </View>

                {error ? (
                    <View style={styles.center}>
                        <MaterialIcons name="error-outline" size={32} color={Colors.error} />
                        <Text style={styles.errText}>{error}</Text>
                        <TouchableOpacity onPress={() => fetchPayments()}><Text style={styles.retry}>Tap to retry</Text></TouchableOpacity>
                    </View>
                ) : (
                    <FlatList data={filteredPayments} renderItem={renderItem} keyExtractor={(i) => i._id}
                        contentContainerStyle={styles.list}
                        ListHeaderComponent={renderHeader}
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
                        ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="receipt-long" size={64} color={Colors.outlineVariant} /><Text style={styles.emptyTitle}>No Payments Found</Text><Text style={styles.emptySub}>Tap the + button below to submit your first payment.</Text></View>}
                        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchPayments(false); }} colors={[Colors.primary]} tintColor={Colors.primary} />}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push('/student/upload-payment')}>
                    <MaterialIcons name="add" size={28} color={Colors.onPrimary} />
                </TouchableOpacity>
            </View>
            <BottomNav activeTab="payments" />

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
    container: { flex: 1, backgroundColor: Colors.surface },
    center: { flex: 1, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
    loadText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurfaceVariant, marginTop: Spacing.three },

    topAppBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        height: 60,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    appBarBtn: {
        width: 40, height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topAppTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 18,
        color: Colors.primary,
    },

    list: { padding: Spacing.four, paddingBottom: 160, flexGrow: 1 },

    headerSection: {
        marginBottom: Spacing.four,
    },
    pageTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 34,
        color: Colors.onSurface,
        letterSpacing: -0.5,
    },
    pageSubtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.half,
        marginBottom: Spacing.four,
    },

    summaryContainer: {
        flexDirection: 'column',
        gap: Spacing.three,
        marginBottom: Spacing.five,
    },
    summaryCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.three,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
        elevation: 4,
    },
    summaryContent: {
        flex: 1,
    },
    summaryLabel: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
        marginBottom: 2,
    },
    summaryAmount: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 20,
    },
    summaryRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.surfaceContainerLow,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Radius.full,
    },
    summaryStatusText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
    },

    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.three,
    },
    listTitle: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 20,
        color: Colors.onSurface,
    },

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

    transactionCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.four,
        marginBottom: Spacing.three,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: Spacing.three,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: Radius.xl,
        backgroundColor: Colors.primaryFixed,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionTexts: {
        flex: 1,
    },
    transactionTitle: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 16,
        color: Colors.onSurface,
        marginBottom: 2,
    },
    transactionDate: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
    },
    transactionRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 16,
        color: Colors.primaryContainer,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.full,
        marginTop: 4,
    },
    statusText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
    },

    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    emptyTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 18, color: Colors.onSurface, marginTop: Spacing.three },
    emptySub: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: Spacing.one, textAlign: 'center', paddingHorizontal: Spacing.four },
    errText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.error, textAlign: 'center', marginTop: Spacing.two },
    retry: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.primary, marginTop: Spacing.three },
    fab: { position: 'absolute', right: Spacing.four, bottom: 90, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primaryContainer, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.four, marginVertical: Spacing.two, gap: 4, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.primaryContainer, borderStyle: 'dashed' },
    viewAllText: { fontFamily: Fonts.headlineSemiBold, fontSize: 14, color: Colors.primary }
});

