import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { getAllComplaints } from '@/services/complaintService';
import BottomNav from '@/components/BottomNav';

export default function ManagerComplaintList() {
    const router = useRouter();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, in-progress, resolved

    const fetchComplaints = async () => {
        try {
            const data = await getAllComplaints();
            setComplaints(data.complaints);
        } catch (error) {
            console.error('Error fetching complaints:', error);
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

    const filteredComplaints = complaints.filter(c =>
        filter === 'all' ? true : c.status === filter
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return Colors.error;
            case 'in-progress': return Colors.primary;
            case 'resolved': return Colors.success;
            default: return Colors.outline;
        }
    };

    const renderItem = ({ item }) => (
        <Pressable
            style={({ pressed }) => [
                styles.complaintCard,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
            ]}
            onPress={() => router.push(`/manager/complaints/${item._id}`)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>

            <Text style={styles.complaintTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.complaintDescription} numberOfLines={2}>
                {item.description}
            </Text>

            <View style={styles.cardFooter}>
                <View style={styles.userInfo}>
                    <Ionicons name="person-circle-outline" size={20} color={Colors.onSurfaceVariant} />
                    <Text style={styles.userName}>
                        {item.userId?.firstName} {item.userId?.lastName}
                    </Text>
                </View>
                {item.image && (
                    <View style={styles.thumbnailContainer}>
                        <Image source={{ uri: item.image }} style={styles.thumbnail} />
                        <View style={styles.thumbnailBadge}>
                            <Ionicons name="image" size={10} color="#fff" />
                        </View>
                    </View>
                )}
            </View>
        </Pressable>
    );

    const FilterButton = ({ label, value }) => (
        <Pressable
            onPress={() => setFilter(value)}
            style={[
                styles.filterButton,
                filter === value && styles.filterButtonActive
            ]}
        >
            <Text style={[
                styles.filterButtonText,
                filter === value && styles.filterButtonTextActive
            ]}>
                {label}
            </Text>
        </Pressable>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                {/* Back button removed */}
                <Text style={styles.headerTitle}>All Complaints</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <FilterButton label="All" value="all" />
                    <FilterButton label="Pending" value="pending" />
                    <FilterButton label="In Progress" value="in-progress" />
                    <FilterButton label="Resolved" value="resolved" />
                </ScrollView>
            </View>

            <FlatList
                data={filteredComplaints}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="documents-outline" size={64} color={Colors.outline} />
                        <Text style={styles.emptyText}>No complaints found</Text>
                    </View>
                }
            />

            <BottomNav activeTab="messages" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingTop: 16,
        paddingBottom: Spacing.two,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceContainerLow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 20,
        color: Colors.onSurface,
    },
    placeholder: {
        width: 40,
    },
    filterContainer: {
        paddingVertical: Spacing.two,
    },
    filterScroll: {
        paddingHorizontal: Spacing.four,
        gap: Spacing.two,
    },
    filterButton: {
        paddingHorizontal: Spacing.four,
        paddingVertical: 8,
        borderRadius: Radius.full,
        backgroundColor: Colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: Colors.surfaceVariant,
    },
    filterButtonActive: {
        backgroundColor: Colors.primaryContainer,
        borderColor: Colors.primary,
    },
    filterButtonText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
    },
    filterButtonTextActive: {
        color: Colors.onPrimary,
    },
    listContent: {
        padding: Spacing.four,
        paddingBottom: 120,
    },
    complaintCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.four,
        marginBottom: Spacing.three,
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.two,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.two,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        letterSpacing: 0.5,
    },
    dateText: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.outline,
    },
    complaintTitle: {
        fontFamily: Fonts.headline,
        fontSize: 17,
        color: Colors.onSurface,
        marginBottom: 4,
    },
    complaintDescription: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        lineHeight: 20,
        marginBottom: Spacing.three,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.two,
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceVariant,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userName: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        opacity: 0.5,
    },
    emptyText: {
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.three,
    },
    thumbnailContainer: {
        width: 44,
        height: 44,
        borderRadius: Radius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.surfaceVariant,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    thumbnailBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        padding: 2,
        borderTopLeftRadius: 4,
    }
});
