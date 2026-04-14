import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, SafeAreaView
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { PAYMENTS_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const STATUS_COLORS = {
    Pending: { bg: '#FEF3C7', text: '#B45309' }, // Amber/Yellow
    Approved: { bg: '#DCFCE7', text: '#15803D' }, // Green
    Rejected: { bg: '#FEE2E2', text: '#B91C1C' }, // Red
};

export default function StudentPayments() {
    const router = useRouter();
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchPayments = async (showSpinner = true) => {
        try {
            if (showSpinner) setIsLoading(true);
            setError('');
            const token = await getItem('userToken');
            const response = await fetch(PAYMENTS_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) { setError(data.message || 'Failed to fetch payments.'); return; }
            setPayments(data.payments || []);
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
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
        </View>
    );

    const renderItem = ({ item }) => {
        const sc = STATUS_COLORS[item.status] || STATUS_COLORS.Pending;
        return (
            <TouchableOpacity style={styles.transactionCard} activeOpacity={0.9}>
                <View style={styles.transactionLeft}>
                    <View style={styles.iconBox}>
                        <MaterialIcons name={getIconForType(item.paymentType?.name)} size={26} color={Colors.primary} />
                    </View>
                    <View style={styles.transactionTexts}>
                        <Text style={styles.transactionTitle}>{item.paymentType?.name || 'Unknown'}</Text>
                        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
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
                    <TouchableOpacity onPress={() => router.back()} style={styles.appBarBtn}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.primaryContainer} />
                    </TouchableOpacity>
                    <Text style={styles.topAppTitle}>Payments</Text>
                    <TouchableOpacity style={styles.appBarBtn}>
                        <MaterialIcons name="account-balance-wallet" size={24} color={Colors.primaryContainer} />
                    </TouchableOpacity>
                </View>

                {error ? (
                    <View style={styles.center}>
                        <MaterialIcons name="error-outline" size={32} color={Colors.error} />
                        <Text style={styles.errText}>{error}</Text>
                        <TouchableOpacity onPress={() => fetchPayments()}><Text style={styles.retry}>Tap to retry</Text></TouchableOpacity>
                    </View>
                ) : (
                    <FlatList data={payments} renderItem={renderItem} keyExtractor={(i) => i._id}
                        contentContainerStyle={styles.list}
                        ListHeaderComponent={renderHeader}
                        ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="receipt-long" size={64} color={Colors.outlineVariant} /><Text style={styles.emptyTitle}>No Payments Yet</Text><Text style={styles.emptySub}>Tap the + button below to submit your first payment.</Text></View>}
                        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchPayments(false); }} colors={[Colors.primary]} tintColor={Colors.primary} />}
                        showsVerticalScrollIndicator={false}
                    />
                )}
                
                <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push('/student/upload-payment')}>
                    <MaterialIcons name="add" size={28} color={Colors.onPrimary} />
                </TouchableOpacity>
            </View>
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

    list: { padding: Spacing.four, paddingBottom: 100, flexGrow: 1 },
    
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
    fab: { position: 'absolute', right: Spacing.four, bottom: Spacing.six, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primaryContainer, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primaryContainer, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
});

