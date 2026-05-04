import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { getMyComplaints } from '@/services/complaintService';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

const StatusBadge = ({ status }) => {
    const getBadgeStyle = () => {
        switch (status) {
            case 'pending': return styles.pendingBadge;
            case 'in-progress': return styles.inProgressBadge;
            case 'resolved': return styles.resolvedBadge;
            default: return {};
        }
    };

    const getTextStyle = () => {
        switch (status) {
            case 'pending': return styles.pendingText;
            case 'in-progress': return styles.inProgressText;
            case 'resolved': return styles.resolvedText;
            default: return {};
        }
    };

    return (
        <View style={[styles.badge, getBadgeStyle()]}>
            <Text style={[styles.badgeText, getTextStyle()]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
        </View>
    );
};

export default function ComplaintsList() {
    const router = useRouter();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchComplaints = async () => {
        try {
            setError(null);
            const data = await getMyComplaints();
            setComplaints(data.complaints);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchComplaints();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchComplaints();
    };

    const renderComplaint = ({ item }) => (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
            ]}
            onPress={() => router.push({ pathname: '/student/complaints/[id]', params: { id: item._id } })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.complaintTitle} numberOfLines={1}>{item.title}</Text>
                <StatusBadge status={item.status} />
            </View>
            <Text style={styles.complaintDescription} numberOfLines={2}>
                {item.description}
            </Text>
            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </Text>
                {item.image && (
                    <Ionicons name="image-outline" size={16} color={Colors.onSurfaceVariant} />
                )}
            </View>
        </Pressable>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#dbe1ff', '#faf8ff']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <Header />
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <Text style={styles.headerTitle}>MY COMPLAINTS</Text>
                <Text style={[styles.headerSubtitle, { paddingHorizontal: 0, marginTop: 4 }]}>Track and manage your hostel issues</Text>
            </View>

            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                        style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.8 }]}
                        onPress={fetchComplaints}
                    >
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                </View>
            ) : complaints.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="documents-outline" size={64} color={Colors.surfaceContainer} />
                    <Text style={styles.emptyText}>No complaints yet.</Text>
                    <Text style={styles.emptySubtext}>Tap the button below to submit your first complaint.</Text>
                </View>
            ) : (
                <FlatList
                    data={complaints}
                    renderItem={renderComplaint}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
                    }
                />
            )}

            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] }
                ]}
                onPress={() => router.push('/student/complaints/create')}
            >
                <Ionicons name="add" size={32} color={Colors.onPrimary} />
            </Pressable>

            <BottomNav activeTab="messages" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLow,
    },
    headerTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 25,
        color: Colors.onSurface,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        paddingHorizontal: Spacing.four,
        marginTop: Spacing.three,
        marginBottom: Spacing.three,
    },
    listContent: {
        padding: Spacing.four,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        marginBottom: Spacing.three,
        // Using layered surfaces for depth instead of shadows
        borderWidth: 0,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.one,
    },
    complaintTitle: {
        fontFamily: Fonts.headline,
        fontSize: 18,
        color: Colors.onSurface,
        flex: 1,
        marginRight: Spacing.two,
    },
    complaintDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        lineHeight: 20,
        marginBottom: Spacing.two,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        color: Colors.outline,
    },
    badge: {
        paddingHorizontal: Spacing.two,
        paddingVertical: Spacing.half,
        borderRadius: Radius.sm,
    },
    badgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        textTransform: 'uppercase',
    },
    pendingBadge: { backgroundColor: Colors.surfaceContainerHigh },
    pendingText: { color: Colors.onSurfaceVariant },
    inProgressBadge: { backgroundColor: Colors.primaryContainer },
    inProgressText: { color: Colors.onPrimary },
    resolvedBadge: { backgroundColor: '#e6f4ea' }, // Soft green
    resolvedText: { color: '#1e8e3e' },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    fab: {
        position: 'absolute',
        right: Spacing.four,
        bottom: 100,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: `0px 8px 16px ${Colors.primary}40`,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.six,
    },
    emptyText: {
        fontFamily: Fonts.headline,
        fontSize: 20,
        color: Colors.onSurface,
        marginTop: Spacing.three,
    },
    emptySubtext: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        textAlign: 'center',
        marginTop: Spacing.one,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.four,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: Spacing.three,
    },
    retryButton: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
        backgroundColor: Colors.surfaceContainerHigh,
        borderRadius: Radius.md,
    },
    retryText: {
        fontFamily: Fonts.headline,
        fontSize: 14,
        color: Colors.primary,
    },
});
