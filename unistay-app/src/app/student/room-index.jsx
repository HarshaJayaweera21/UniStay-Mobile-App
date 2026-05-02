import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { deleteItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const FILTERS = ['All', 'Available', 'Full'];

export default function StudentRoomList() {
    const router = useRouter();
    const [rooms, setRooms] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [search, setSearch] = useState('');

    const fetchRooms = async () => {
        try {
            const response = await fetch(`${API_URL}/api/rooms`);
            const data = await response.json();
            if (data.success) {
                setRooms(data.rooms);
                applyFilters(data.rooms, 'All', '');
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setIsLoading(true);
            fetchRooms();
        }, [])
    );

    const applyFilters = (roomList, filter, query) => {
        let result = roomList;
        if (filter !== 'All') {
            result = result.filter(r => r.availabilityStatus === filter);
        }
        if (query.trim()) {
            const q = query.toLowerCase();
            result = result.filter(r =>
                r.roomNumber.toLowerCase().includes(q) ||
                r.roomType.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    };

    const handleFilterChange = (f) => {
        setActiveFilter(f);
        applyFilters(rooms, f, search);
    };

    const handleSearch = (q) => {
        setSearch(q);
        applyFilters(rooms, activeFilter, q);
    };

    const handleLogout = async () => {
        await deleteItem('userToken');
        await deleteItem('userRole');
        router.replace('/login');
    };

    const renderRoomCard = ({ item }) => {
        const isAvailable = item.availabilityStatus === 'Available';
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/student/room-details', params: { id: item._id } })}
            >
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" transition={300} />
                ) : (
                    <View style={styles.cardImagePlaceholder}>
                        <MaterialIcons name="meeting-room" size={48} color={Colors.outlineVariant} />
                    </View>
                )}

                {/* Gallery indicator */}
                {item.images && item.images.length > 0 && (
                    <View style={styles.galleryBadge}>
                        <MaterialIcons name="photo-library" size={11} color="#fff" />
                        <Text style={styles.galleryBadgeText}>+{item.images.length}</Text>
                    </View>
                )}

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2' }]}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#22c55e' : '#ef4444' }]} />
                            <Text style={[styles.statusText, { color: isAvailable ? '#15803d' : '#dc2626' }]}>
                                {item.availabilityStatus}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardDetails}>
                        <View style={styles.detailChip}>
                            <MaterialIcons name="king-bed" size={13} color={Colors.primary} />
                            <Text style={styles.detailText}>{item.roomType}</Text>
                        </View>
                        <View style={styles.detailChip}>
                            <MaterialIcons name="people" size={13} color={Colors.primary} />
                            <Text style={styles.detailText}>{item.currentOccupancy}/{item.capacity}</Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <Text style={styles.price}>
                            Rs. {item.pricePerMonth?.toLocaleString()}
                            <Text style={styles.priceUnit}>/mo</Text>
                        </Text>
                        <View style={styles.viewBtn}>
                            <Text style={styles.viewBtnText}>View</Text>
                            <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const availableCount = rooms.filter(r => r.availabilityStatus === 'Available').length;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.primaryFixed, Colors.background]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome</Text>
                    <Text style={styles.title}>Find Your Room</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => router.push('/student/my-room')} style={styles.iconButton}>
                        <MaterialIcons name="bookmark" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{rooms.length}</Text>
                    <Text style={styles.statLabel}>Total Rooms</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.statValue, { color: '#16a34a' }]}>{availableCount}</Text>
                    <Text style={[styles.statLabel, { color: '#15803d' }]}>Available</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.statValue, { color: '#dc2626' }]}>{rooms.length - availableCount}</Text>
                    <Text style={[styles.statLabel, { color: '#b91c1c' }]}>Full</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={Colors.outline} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by room number or type..."
                    placeholderTextColor={Colors.outline}
                    value={search}
                    onChangeText={handleSearch}
                />
                {!!search && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <MaterialIcons name="close" size={18} color={Colors.outline} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, activeFilter === f ? styles.filterTabActive : null]}
                        onPress={() => handleFilterChange(f)}
                    >
                        <Text style={[styles.filterTabText, activeFilter === f ? styles.filterTabTextActive : null]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Room List */}
            <FlatList
                data={filtered}
                renderItem={renderRoomCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchRooms(); }}
                        colors={[Colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="search-off" size={64} color={Colors.outlineVariant} />
                        <Text style={styles.emptyTitle}>No rooms found</Text>
                        <Text style={styles.emptySubtitle}>Try changing your search or filter</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: Spacing.four, paddingTop: 56, paddingBottom: Spacing.three,
    },
    greeting: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: 2 },
    title: { fontFamily: Fonts.headlineExtraBold, fontSize: 26, color: Colors.onSurface, letterSpacing: -0.5 },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceContainerLowest,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.four, gap: 10, marginBottom: Spacing.three },
    statCard: {
        flex: 1, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
        paddingVertical: 12, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    statValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.primary },
    statLabel: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: Spacing.four, marginBottom: Spacing.two,
        backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
        paddingHorizontal: Spacing.three, paddingVertical: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    searchInput: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurface },
    filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.four, gap: 8, marginBottom: Spacing.three },
    filterTab: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
        backgroundColor: Colors.surfaceContainerHighest,
    },
    filterTabActive: { backgroundColor: Colors.primary },
    filterTabText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSurfaceVariant },
    filterTabTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: Spacing.four, paddingBottom: 40 },
    card: {
        backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
        marginBottom: Spacing.three, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
    },
    cardImage: { width: '100%', height: 170 },
    cardImagePlaceholder: {
        width: '100%', height: 170, backgroundColor: Colors.surfaceContainerHigh,
        justifyContent: 'center', alignItems: 'center',
    },
    galleryBadge: {
        position: 'absolute', top: 10, right: 10,
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: Radius.full,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    galleryBadgeText: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: '#fff' },
    cardContent: { padding: Spacing.three },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
    roomNumber: { fontFamily: Fonts.headline, fontSize: 17, color: Colors.onSurface },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full, gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontFamily: Fonts.bodySemiBold, fontSize: 11 },
    cardDetails: { flexDirection: 'row', gap: 8, marginBottom: Spacing.two },
    detailChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: Colors.primaryFixed, paddingHorizontal: 9, paddingVertical: 3, borderRadius: Radius.full,
    },
    detailText: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.onPrimaryFixed },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    price: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.tertiary },
    priceUnit: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
    emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurfaceVariant },
    emptySubtitle: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.outline },
});