import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { deleteItem, getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';

export default function ManagerRoomList() {
    const router = useRouter();
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRooms = async () => {
        try {
            const response = await fetch(`${API_URL}/api/rooms`);
            const data = await response.json();
            if (data.success) {
                setRooms(data.rooms);
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

    const handleDelete = async (id, roomNumber) => {
        const doDelete = async () => {
            try {
                const token = await getItem('userToken');
                const response = await fetch(`${API_URL}/api/rooms/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await response.json();
                if (data.success) {
                    setRooms(prev => prev.filter(room => room._id !== id));
                } else {
                    if (Platform.OS === 'web') {
                        window.alert('Error: ' + data.message);
                    } else {
                        Alert.alert('Error', data.message);
                    }
                }
            } catch (error) {
                if (Platform.OS === 'web') {
                    window.alert('Failed to delete room');
                } else {
                    Alert.alert('Error', 'Failed to delete room');
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to delete Room ${roomNumber}?`)) {
                await doDelete();
            }
        } else {
            Alert.alert(
                'Delete Room',
                `Are you sure you want to delete Room ${roomNumber}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: doDelete },
                ]
            );
        }
    };

    const handleLogout = async () => {
        await deleteItem('userToken');
        await deleteItem('userRole');
        router.replace('/login');
    };

    const renderRoomCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/manager/room-details', params: { id: item._id } })}
        >
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.cardImage} contentFit="cover" transition={300} />
            ) : (
                <View style={styles.cardImagePlaceholder}>
                    <MaterialIcons name="meeting-room" size={48} color={Colors.outlineVariant} />
                </View>
            )}

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: item.availabilityStatus === 'Available' ? '#dcfce7' : '#fee2e2' }
                    ]}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: item.availabilityStatus === 'Available' ? '#22c55e' : '#ef4444' }
                        ]} />
                        <Text style={[
                            styles.statusText,
                            { color: item.availabilityStatus === 'Available' ? '#15803d' : '#dc2626' }
                        ]}>
                            {item.availabilityStatus}
                        </Text>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: Colors.surfaceContainerHigh, marginLeft: 8 }
                    ]}>
                        <MaterialIcons 
                            name={item.gender === 'male' ? 'man' : 'woman'} 
                            size={14} 
                            color={Colors.onSurfaceVariant} 
                        />
                        <Text style={[styles.statusText, { color: Colors.onSurfaceVariant, textTransform: 'capitalize' }]}>
                            {item.gender}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardDetails}>
                    <View style={styles.detailChip}>
                        <MaterialIcons name="king-bed" size={14} color={Colors.primary} />
                        <Text style={styles.detailText}>{item.roomType}</Text>
                    </View>
                    <View style={styles.detailChip}>
                        <MaterialIcons name="people" size={14} color={Colors.primary} />
                        <Text style={styles.detailText}>{item.currentOccupancy}/{item.capacity}</Text>
                    </View>
                </View>

                <Text style={styles.price}>Rs. {item.pricePerMonth?.toLocaleString()}<Text style={styles.priceUnit}>/month</Text></Text>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => router.push({ pathname: '/manager/edit-room', params: { id: item._id } })}
                    >
                        <MaterialIcons name="edit" size={16} color={Colors.primary} />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item._id, item.roomNumber)}
                    >
                        <MaterialIcons name="delete-outline" size={16} color={Colors.error} />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

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
                    <Text style={styles.greeting}>Manager Panel</Text>
                    <Text style={styles.title}>Room Management</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={() => router.push('/manager/requests')} style={styles.iconButton}>
                        <MaterialIcons name="assignment" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push('/manager/payments')} style={styles.iconButton}>
                        <MaterialIcons name="receipt-long" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                        <MaterialIcons name="logout" size={22} color={Colors.onSurfaceVariant} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{rooms.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#22c55e' }]}>
                        {rooms.filter(r => r.availabilityStatus === 'Available').length}
                    </Text>
                    <Text style={styles.statLabel}>Available</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#ef4444' }]}>
                        {rooms.filter(r => r.availabilityStatus === 'Full').length}
                    </Text>
                    <Text style={styles.statLabel}>Full</Text>
                </View>
            </View>

            {/* Room List */}
            <FlatList
                data={rooms}
                renderItem={renderRoomCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRooms(); }} colors={[Colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="meeting-room" size={64} color={Colors.outlineVariant} />
                        <Text style={styles.emptyTitle}>No Rooms Yet</Text>
                        <Text style={styles.emptySubtitle}>Tap the + button to add your first room</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => router.push('/manager/add-room')}
            >
                <LinearGradient
                    colors={[Colors.primaryContainer, Colors.primary]}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <MaterialIcons name="add" size={28} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingTop: 56,
        paddingBottom: Spacing.three,
    },
    greeting: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        marginBottom: 2,
    },
    title: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 26,
        color: Colors.onSurface,
        letterSpacing: -0.5,
    },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surfaceContainerLowest,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    statsBar: {
        flexDirection: 'row',
        marginHorizontal: Spacing.four,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.three,
        marginBottom: Spacing.three,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 22,
        color: Colors.primary,
    },
    statLabel: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        color: Colors.onSurfaceVariant,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.outlineVariant,
        marginVertical: 4,
    },
    listContent: {
        paddingHorizontal: Spacing.four,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        marginBottom: Spacing.three,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: 180,
    },
    cardImagePlaceholder: {
        width: '100%',
        height: 180,
        backgroundColor: Colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: Spacing.three,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.two,
    },
    roomNumber: {
        fontFamily: Fonts.headline,
        fontSize: 18,
        color: Colors.onSurface,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.full,
        gap: 5,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statusText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 12,
    },
    cardDetails: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: Spacing.two,
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryFixed,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    detailText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        color: Colors.onPrimaryFixed,
    },
    price: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 20,
        color: Colors.tertiary,
        marginBottom: Spacing.two,
    },
    priceUnit: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.outlineVariant,
        paddingTop: Spacing.two,
    },
    editButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        backgroundColor: Colors.primaryFixed,
        borderRadius: Radius.lg,
    },
    editButtonText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.primary,
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        backgroundColor: Colors.errorContainer,
        borderRadius: Radius.lg,
    },
    deleteButtonText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.error,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        gap: 12,
    },
    emptyTitle: {
        fontFamily: Fonts.headline,
        fontSize: 20,
        color: Colors.onSurfaceVariant,
    },
    emptySubtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.outline,
    },
    fab: {
        position: 'absolute',
        right: Spacing.four,
        bottom: 32,
        borderRadius: 30,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});