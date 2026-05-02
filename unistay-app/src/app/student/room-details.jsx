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
    Modal,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getItem } from '@/utils/storage';
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
    const [activeRequest, setActiveRequest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [duration, setDuration] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchRoomAndRequest();
    }, [id]);

    const fetchRoomAndRequest = async () => {
        try {
            const token = await getItem('userToken');
            
            const [roomRes, reqRes] = await Promise.all([
                fetch(`${API_URL}/api/rooms/${id}`),
                fetch(`${API_URL}/api/room-requests/my-request`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const roomData = await roomRes.json();
            const reqData = await reqRes.json();

            if (roomData.success) setRoom(roomData.room);
            if (reqData.success) setActiveRequest(reqData.request);
            
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestRoom = async () => {
        if (!duration || isNaN(parseInt(duration)) || parseInt(duration) < 1) {
            if (Platform.OS === 'web') window.alert('Please enter a valid duration in months.');
            else Alert.alert('Invalid Input', 'Please enter a valid duration in months.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getItem('userToken');
            const response = await fetch(`${API_URL}/api/room-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    roomId: id,
                    durationInMonths: parseInt(duration)
                })
            });

            const data = await response.json();
            if (data.success) {
                if (Platform.OS === 'web') window.alert('Room requested successfully!');
                else Alert.alert('Success', 'Room requested successfully!');
                setShowModal(false);
                fetchRoomAndRequest(); // Refresh to update active request state
            } else {
                if (Platform.OS === 'web') window.alert(data.message);
                else Alert.alert('Error', data.message);
            }
        } catch (error) {
            console.error('Request room error:', error);
            if (Platform.OS === 'web') window.alert('Failed to request room');
            else Alert.alert('Error', 'Failed to request room');
        } finally {
            setIsSubmitting(false);
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

                    {/* Request Button */}
                    <View style={styles.actionContainer}>
                        {activeRequest ? (
                            <View style={styles.activeRequestCard}>
                                <Text style={styles.activeRequestText}>
                                    You already have an active room request.
                                </Text>
                                <TouchableOpacity 
                                    style={styles.viewRequestBtn}
                                    onPress={() => router.push('/student/my-room')}
                                >
                                    <Text style={styles.viewRequestBtnText}>View My Request</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.requestButton, !isAvailable && styles.requestButtonDisabled]}
                                activeOpacity={0.8}
                                disabled={!isAvailable}
                                onPress={() => setShowModal(true)}
                            >
                                <LinearGradient
                                    colors={isAvailable ? [Colors.primaryContainer, Colors.primary] : [Colors.surfaceContainerHigh, Colors.surfaceContainerHigh]}
                                    style={styles.requestButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <MaterialIcons name="event-available" size={24} color={isAvailable ? '#fff' : Colors.outline} />
                                    <Text style={[styles.requestButtonText, !isAvailable && { color: Colors.outline }]}>
                                        {isAvailable ? 'Request This Room' : 'Room Not Available'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Request Modal */}
            <Modal visible={showModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Request Room {room.roomNumber}</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalClose}>
                                <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.modalBody}>
                            <Text style={styles.modalDesc}>
                                Your personal details will be automatically included in this request.
                                Please specify how long you plan to stay.
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>DURATION OF STAY (MONTHS)</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialIcons name="date-range" size={20} color={Colors.outline} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 6"
                                        placeholderTextColor={Colors.outline}
                                        keyboardType="numeric"
                                        value={duration}
                                        onChangeText={setDuration}
                                    />
                                </View>
                            </View>

                            <View style={styles.keyMoneyPreview}>
                                <MaterialIcons name="info-outline" size={18} color={Colors.tertiary} />
                                <Text style={styles.keyMoneyText}>
                                    Note: Key money will be calculated as 3x the monthly rent (Rs. {(room.pricePerMonth * 3).toLocaleString()}) if approved.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={() => setShowModal(false)}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.submitBtn} 
                                onPress={handleRequestRoom}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Submit Request</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
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
        padding: Spacing.three, marginTop: 4, marginBottom: Spacing.four,
    },
    noticeText: { fontFamily: Fonts.bodyMedium, fontSize: 14, lineHeight: 21, flex: 1 },
    actionContainer: { marginTop: Spacing.two },
    requestButton: { borderRadius: Radius.xl, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
    requestButtonDisabled: { shadowOpacity: 0, elevation: 0 },
    requestButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 10 },
    requestButtonText: { fontFamily: Fonts.headline, fontSize: 18, color: '#fff' },
    activeRequestCard: { backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, padding: Spacing.four, alignItems: 'center', gap: 12 },
    activeRequestText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurfaceVariant, textAlign: 'center' },
    viewRequestBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.four, paddingVertical: 10, borderRadius: Radius.full },
    viewRequestBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#fff' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.five },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.four },
    modalTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 22, color: Colors.onSurface },
    modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceContainerHighest, justifyContent: 'center', alignItems: 'center' },
    modalBody: { marginBottom: Spacing.four },
    modalDesc: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: Spacing.four, lineHeight: 22 },
    inputGroup: { marginBottom: Spacing.four },
    label: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two, marginLeft: Spacing.one },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
    inputIcon: { marginRight: Spacing.two },
    input: { flex: 1, paddingVertical: 14, fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurface },
    keyMoneyPreview: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.tertiaryContainer, padding: Spacing.three, borderRadius: Radius.lg },
    keyMoneyText: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onTertiaryContainer, lineHeight: 20 },
    modalFooter: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: Radius.xl, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center' },
    cancelBtnText: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onSurfaceVariant },
    submitBtn: { flex: 1, paddingVertical: 16, borderRadius: Radius.xl, backgroundColor: Colors.primary, alignItems: 'center' },
    submitBtnText: { fontFamily: Fonts.headline, fontSize: 16, color: '#fff' },
});
