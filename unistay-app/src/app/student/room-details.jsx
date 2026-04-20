import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StudentRoomDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [room, setRoom] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchRoom();
    }, [id]);

    const fetchRoom = async () => {
        try {
            const response = await fetch(`${API_URL}/api/rooms/${id}`);
            const data = await response.json();
            if (data.success) {
                setRoom(data.room);
            }
        } catch (error) {
            console.error('Error fetching room:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!room) return null;

    const isAvailable = room.availabilityStatus === 'Available';
    // Build full image list: main image + gallery
    const allImages = [
        ...(room.image ? [room.image] : []),
        ...(room.images || []),
    ];

    const renderImageItem = ({ item, index }) => (
        <Image
            source={{ uri: item }}
            style={{ width: SCREEN_WIDTH, height: 300 }}
            contentFit="cover"
            transition={200}
        />
    );

    const onImageScroll = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveImageIndex(index);
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Image Gallery */}
                <View style={styles.imageSection}>
                    {allImages.length > 0 ? (
                        <>
                            <FlatList
                                ref={flatListRef}
                                data={allImages}
                                renderItem={renderImageItem}
                                keyExtractor={(_, i) => String(i)}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onScroll={onImageScroll}
                                scrollEventThrottle={16}
                            />
                            {/* Dot indicators */}
                            {allImages.length > 1 && (
                                <View style={styles.dotsContainer}>
                                    {allImages.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[styles.dot, i === activeImageIndex ? styles.dotActive : null]}
                                        />
                                    ))}
                                </View>
                            )}
                            {/* Image counter */}
                            {allImages.length > 1 && (
                                <View style={styles.imageCounter}>
                                    <MaterialIcons name="photo-library" size={12} color="#fff" />
                                    <Text style={styles.imageCounterText}>
                                        {activeImageIndex + 1} / {allImages.length}
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.noImagePlaceholder}>
                            <MaterialIcons name="meeting-room" size={72} color={Colors.outlineVariant} />
                            <Text style={styles.noImageText}>No photos available</Text>
                        </View>
                    )}

                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.65)']}
                        style={styles.imageGradient}
                    />

                    {/* Back Button */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    {/* Room Number Overlay */}
                    <View style={styles.imageOverlayContent}>
                        <Text style={styles.roomNumberOverlay}>Room {room.roomNumber}</Text>
                        <View style={[styles.statusBadge, {
                            backgroundColor: isAvailable ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'
                        }]}>
                            <View style={[styles.statusDot, {
                                backgroundColor: isAvailable ? '#22c55e' : '#ef4444'
                            }]} />
                            <Text style={[styles.statusText, {
                                color: isAvailable ? '#86efac' : '#fca5a5'
                            }]}>
                                {room.availabilityStatus}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Details */}
                <View style={styles.content}>
                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>Rs. {room.pricePerMonth?.toLocaleString()}</Text>
                        <Text style={styles.priceUnit}>/ month</Text>
                    </View>

                    {/* Info Grid */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconBg, { backgroundColor: Colors.primaryFixed }]}>
                                <MaterialIcons name="king-bed" size={22} color={Colors.primary} />
                            </View>
                            <Text style={styles.infoLabel}>Type</Text>
                            <Text style={styles.infoValue}>{room.roomType}</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconBg, { backgroundColor: Colors.tertiaryFixed }]}>
                                <MaterialIcons name="people" size={22} color={Colors.tertiary} />
                            </View>
                            <Text style={styles.infoLabel}>Capacity</Text>
                            <Text style={styles.infoValue}>{room.capacity} person{room.capacity > 1 ? 's' : ''}</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconBg, { backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2' }]}>
                                <MaterialIcons name="person" size={22} color={isAvailable ? '#22c55e' : '#ef4444'} />
                            </View>
                            <Text style={styles.infoLabel}>Occupancy</Text>
                            <Text style={styles.infoValue}>{room.currentOccupancy} / {room.capacity}</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconBg, { backgroundColor: Colors.secondaryFixed }]}>
                                <MaterialIcons name="photo-library" size={22} color={Colors.secondary} />
                            </View>
                            <Text style={styles.infoLabel}>Photos</Text>
                            <Text style={styles.infoValue}>{allImages.length} image{allImages.length !== 1 ? 's' : ''}</Text>
                        </View>
                    </View>

                    {/* Availability Bar */}
                    <View style={styles.occupancyCard}>
                        <View style={styles.occupancyHeader}>
                            <Text style={styles.occupancyLabel}>Occupancy</Text>
                            <Text style={styles.occupancyFraction}>{room.currentOccupancy}/{room.capacity}</Text>
                        </View>
                        <View style={styles.occupancyBarBg}>
                            <View style={[
                                styles.occupancyBarFill,
                                {
                                    width: `${(room.currentOccupancy / room.capacity) * 100}%`,
                                    backgroundColor: isAvailable ? '#22c55e' : '#ef4444'
                                }
                            ]} />
                        </View>
                        <Text style={[styles.occupancyStatus, { color: isAvailable ? '#16a34a' : '#dc2626' }]}>
                            {isAvailable
                                ? `${room.capacity - room.currentOccupancy} spot${room.capacity - room.currentOccupancy !== 1 ? 's' : ''} available`
                                : 'Room is fully occupied'}
                        </Text>
                    </View>

                    {/* Description */}
                    {!!room.description && (
                        <View style={styles.descriptionCard}>
                            <Text style={styles.sectionTitle}>About this room</Text>
                            <Text style={styles.descriptionText}>{room.description}</Text>
                        </View>
                    )}

                    {/* Status Notice */}
                    <View style={[styles.noticeCard, {
                        backgroundColor: isAvailable ? '#f0fdf4' : '#fef2f2',
                        borderColor: isAvailable ? '#bbf7d0' : '#fecaca',
                    }]}>
                        <MaterialIcons
                            name={isAvailable ? 'check-circle' : 'cancel'}
                            size={20}
                            color={isAvailable ? '#16a34a' : '#dc2626'}
                        />
                        <Text style={[styles.noticeText, { color: isAvailable ? '#15803d' : '#b91c1c' }]}>
                            {isAvailable
                                ? 'This room is currently available. Contact the hostel manager to apply.'
                                : 'This room is currently full. Check back later or browse other rooms.'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    imageSection: { height: 300, position: 'relative', backgroundColor: Colors.surfaceContainerHigh },
    noImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: 8 },
    noImageText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.outline },
    imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, pointerEvents: 'none' },
    backButton: {
        position: 'absolute', top: 50, left: Spacing.four,
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center', alignItems: 'center',
    },
    dotsContainer: {
        position: 'absolute', bottom: 60, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
    dotActive: { backgroundColor: '#fff', width: 18 },
    imageCounter: {
        position: 'absolute', top: 50, right: Spacing.four,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: Radius.full,
        paddingHorizontal: 9, paddingVertical: 4,
    },
    imageCounterText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#fff' },
    imageOverlayContent: {
        position: 'absolute', bottom: Spacing.four, left: Spacing.four, right: Spacing.four,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    roomNumberOverlay: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: '#fff', letterSpacing: -0.5 },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: Radius.full, gap: 6,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
    content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: 40 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.four, gap: 4 },
    price: { fontFamily: Fonts.headlineExtraBold, fontSize: 30, color: Colors.tertiary, letterSpacing: -1 },
    priceUnit: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.four },
    infoCard: {
        width: '47%', backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl, padding: Spacing.three,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    infoIconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.two },
    infoLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 2 },
    infoValue: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onSurface },
    occupancyCard: {
        backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
        padding: Spacing.three, marginBottom: Spacing.three,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    occupancyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    occupancyLabel: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onSurface },
    occupancyFraction: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurfaceVariant },
    occupancyBarBg: { height: 8, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    occupancyBarFill: { height: '100%', borderRadius: 4 },
    occupancyStatus: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
    descriptionCard: {
        backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
        padding: Spacing.four, marginBottom: Spacing.three,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    sectionTitle: { fontFamily: Fonts.headline, fontSize: 17, color: Colors.onSurface, marginBottom: Spacing.two },
    descriptionText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, lineHeight: 24 },
    noticeCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        borderRadius: Radius.xl, borderWidth: 1,
        padding: Spacing.three, marginTop: 4,
    },
    noticeText: { fontFamily: Fonts.bodyMedium, fontSize: 14, lineHeight: 21, flex: 1 },
});
