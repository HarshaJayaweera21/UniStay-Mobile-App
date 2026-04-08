import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { PAYMENTS_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

const STATUS_COLORS = {
    Pending: { bg: '#FFF3E0', text: '#E65100' },
    Approved: { bg: '#E8F5E9', text: '#1B5E20' },
    Rejected: { bg: '#FFEBEE', text: '#B71C1C' },
};

export default function ManagerPayments() {
    const router = useRouter();
    const [payments, setPayments] = useState([]);
    const [activeFilter, setActiveFilter] = useState('Pending');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchPayments = async (showSpinner = true) => {
        try {
            if (showSpinner) setIsLoading(true);
            setError('');

            const token = await getItem('userToken');
            const response = await fetch(PAYMENTS_URL, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to fetch payments.');
                return;
            }

            setPayments(data.payments || []);
        } catch (err) {
            console.error('fetchPayments error:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchPayments();
        }, [])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchPayments(false);
    };

    const filteredPayments =
        activeFilter === 'All'
            ? payments
            : payments.filter((p) => p.status === activeFilter);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const renderPaymentItem = ({ item }) => {
        const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.Pending;
        const studentName = item.studentId
            ? `${item.studentId.firstName} ${item.studentId.lastName}`
            : 'Unknown Student';
        const typeName = item.paymentType?.name || 'Unknown Type';

        return (
            <TouchableOpacity
                style={styles.paymentCard}
                activeOpacity={0.7}
                onPress={() =>
                    router.push({
                        pathname: '/manager/payment-detail',
                        params: { id: item._id },
                    })
                }
            >
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.studentName}>{studentName}</Text>
                        <Text style={styles.paymentType}>{typeName}</Text>
                    </View>
                    <View
                        style={[
                            styles.statusPill,
                            { backgroundColor: statusColor.bg },
                        ]}
                    >
                        <Text
                            style={[styles.statusText, { color: statusColor.text }]}
                        >
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.amount}>
                        LKR {parseFloat(item.amount).toLocaleString()}
                    </Text>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons
                name="receipt-long"
                size={64}
                color={Colors.outlineVariant}
            />
            <Text style={styles.emptyTitle}>No Payments Found</Text>
            <Text style={styles.emptySubtitle}>
                {activeFilter === 'All'
                    ? 'No payment submissions yet.'
                    : `No ${activeFilter.toLowerCase()} payments.`}
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading payments...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <MaterialIcons
                        name="arrow-back"
                        size={24}
                        color={Colors.onSurface}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Management</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {FILTERS.map((filter) => {
                    const isActive = activeFilter === filter;
                    const count =
                        filter === 'All'
                            ? payments.length
                            : payments.filter((p) => p.status === filter).length;

                    return (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterTab,
                                isActive && styles.filterTabActive,
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    isActive && styles.filterTextActive,
                                ]}
                            >
                                {filter} ({count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Error State */}
            {error ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={24} color={Colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => fetchPayments()}>
                        <Text style={styles.retryText}>Tap to retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredPayments}
                    renderItem={renderPaymentItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.three,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingTop: 56,
        paddingBottom: Spacing.three,
        backgroundColor: Colors.surfaceContainerLowest,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: Fonts.headline,
        fontSize: 20,
        color: Colors.onSurface,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
        backgroundColor: Colors.surfaceContainerLowest,
        gap: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: Spacing.two,
        borderRadius: Radius.full,
        backgroundColor: Colors.surfaceContainerHigh,
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: Colors.primary,
    },
    filterText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 12,
        color: Colors.onSurfaceVariant,
    },
    filterTextActive: {
        color: Colors.onPrimary,
    },
    listContent: {
        padding: Spacing.four,
        paddingBottom: 100,
        flexGrow: 1,
    },
    paymentCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.md,
        padding: Spacing.four,
        marginBottom: Spacing.three,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.three,
    },
    cardHeaderLeft: {
        flex: 1,
        marginRight: Spacing.two,
    },
    studentName: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onSurface,
        marginBottom: 2,
    },
    paymentType: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
    },
    statusPill: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
        borderRadius: Radius.full,
    },
    statusText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amount: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 18,
        color: Colors.onSurface,
    },
    date: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.outline,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontFamily: Fonts.headline,
        fontSize: 18,
        color: Colors.onSurface,
        marginTop: Spacing.three,
    },
    emptySubtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.one,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.five,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.error,
        textAlign: 'center',
        marginTop: Spacing.two,
    },
    retryText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.primary,
        marginTop: Spacing.three,
    },
});
