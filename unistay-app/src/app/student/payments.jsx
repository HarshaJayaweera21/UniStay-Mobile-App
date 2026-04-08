import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { PAYMENTS_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const STATUS_COLORS = {
    Pending: { bg: '#FFF3E0', text: '#E65100' },
    Approved: { bg: '#E8F5E9', text: '#1B5E20' },
    Rejected: { bg: '#FFEBEE', text: '#B71C1C' },
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

    const renderItem = ({ item }) => {
        const sc = STATUS_COLORS[item.status] || STATUS_COLORS.Pending;
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.type}>{item.paymentType?.name || 'Unknown'}</Text>
                        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.pillText, { color: sc.text }]}>{item.status}</Text>
                    </View>
                </View>
                <Text style={styles.amount}>LKR {parseFloat(item.amount).toLocaleString()}</Text>
                {item.status === 'Rejected' && item.note && (
                    <View style={styles.noteBox}>
                        <MaterialIcons name="info-outline" size={16} color="#B71C1C" />
                        <Text style={styles.noteText}>{item.note}</Text>
                    </View>
                )}
            </View>
        );
    };

    if (isLoading) return (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadText}>Loading payments...</Text></View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Payments</Text>
                <View style={{ width: 40 }} />
            </View>
            {error ? (
                <View style={styles.center}>
                    <MaterialIcons name="error-outline" size={24} color={Colors.error} />
                    <Text style={styles.errText}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchPayments()}><Text style={styles.retry}>Tap to retry</Text></TouchableOpacity>
                </View>
            ) : (
                <FlatList data={payments} renderItem={renderItem} keyExtractor={(i) => i._id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="receipt-long" size={64} color={Colors.outlineVariant} /><Text style={styles.emptyTitle}>No Payments Yet</Text><Text style={styles.emptySub}>Tap the button below to submit your first payment.</Text></View>}
                    refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchPayments(false); }} colors={[Colors.primary]} tintColor={Colors.primary} />}
                />
            )}
            <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push('/student/upload-payment')}>
                <MaterialIcons name="add" size={28} color={Colors.onPrimary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
    loadText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurfaceVariant, marginTop: Spacing.three },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingTop: 56, paddingBottom: Spacing.three, backgroundColor: Colors.surfaceContainerLowest },
    backBtn: { width: 40, height: 40, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontFamily: Fonts.headline, fontSize: 20, color: Colors.onSurface },
    list: { padding: Spacing.four, paddingBottom: 100, flexGrow: 1 },
    card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.md, padding: Spacing.four, marginBottom: Spacing.three, shadowColor: '#191b23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.two },
    type: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onSurface, marginBottom: 2 },
    date: { fontFamily: Fonts.body, fontSize: 13, color: Colors.outline },
    pill: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Radius.full },
    pillText: { fontFamily: Fonts.bodySemiBold, fontSize: 12 },
    amount: { fontFamily: Fonts.headlineSemiBold, fontSize: 20, color: Colors.onSurface },
    noteBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFEBEE', borderRadius: Radius.sm, padding: Spacing.two, marginTop: Spacing.two, gap: 6 },
    noteText: { fontFamily: Fonts.body, fontSize: 13, color: '#B71C1C', flex: 1 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface, marginTop: Spacing.three },
    emptySub: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: Spacing.one, textAlign: 'center' },
    errText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.error, textAlign: 'center', marginTop: Spacing.two },
    retry: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary, marginTop: Spacing.three },
    fab: { position: 'absolute', right: 24, bottom: 32, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
});
