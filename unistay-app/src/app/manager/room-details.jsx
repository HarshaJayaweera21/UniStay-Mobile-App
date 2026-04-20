import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';

export default function RoomDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [room, setRoom] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchRoom();
    }, [id]);

    const fetchRoom = async () => {
        try {
            const response = await fetch(`${API_URL}/api/rooms/${id}`);
            const data = await response.json();
            if (data.success) {
                setRoom(data.room);
            } else {
                if (Platform.OS === 'web') window.alert('Room not found');
                else Alert.alert('Error', 'Room not found');
                router.back();
            }
        } catch (error) {
            if (Platform.OS === 'web') window.alert('Failed to load room details');
            else Alert.alert('Error', 'Failed to load room details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        const doDelete = async () => {
            try {
                const token = await getItem('userToken');
                const response = await fetch(`${API_URL}/api/rooms/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await response.json();
                if (data.success) {
                    if (Platform.OS === 'web') {
                        window.alert('Room deleted successfully');
                        router.back();
                    } else {
                        Alert.alert('Deleted', 'Room deleted successfully', [
                            { text: 'OK', onPress: () => router.back() }
                        ]);
                    }
                } else {
                    if (Platform.OS === 'web') window.alert('Error: ' + data.message);
                    else Alert.alert('Error', data.message);
                }
            } catch (error) {
                if (Platform.OS === 'web') window.alert('Failed to delete room');
                else Alert.alert('Error', 'Failed to delete room');
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) doDelete();
        } else {
            Alert.alert(
                'Delete Room',
                `Are you sure you want to delete Room ${room.roomNumber}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: doDelete },
                ]
            );
        }
    };

    // ── Web: triggered when user picks files from hidden <input> ──
    const handleWebFileChange = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        // Reset input so same files can be re-selected later
        event.target.value = '';

        setIsUploadingGallery(true);
        try {
            const token = await getItem('userToken');
            const body = new FormData();
            for (const file of files) {
                body.append('images', file, file.name);
            }
            const response = await fetch(`${API_URL}/api/rooms/${id}/images`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body,
            });
            const data = await response.json();
            if (data.success) {
                setRoom(prev => ({ ...prev, images: data.images }));
            } else {
                window.alert('Upload failed: ' + data.message);
            }
        } catch (error) {
            console.error('Gallery upload error:', error);
            window.alert('Failed to upload images');
        } finally {
            setIsUploadingGallery(false);
        }
    };

    const handleAddGalleryImages = async () => {
        if (Platform.OS === 'web') {
            // Trigger the hidden file input directly — supports multiple
            fileInputRef.current?.click();
            return;
        }

        // Native: use expo-image-picker with multi-select
        const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (result.canceled || !result.assets?.length) return;

        setIsUploadingGallery(true);
        try {
            const token = await getItem('userToken');
            const body = new FormData();
            for (const asset of result.assets) {
                const filename = asset.uri.split('/').pop();
                const ext = filename.split('.').pop();
                body.append('images', { uri: asset.uri, name: filename, type: `image/${ext}` });
            }
            const response = await fetch(`${API_URL}/api/rooms/${id}/images`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body,
            });
            const data = await response.json();
            if (data.success) {
                setRoom(prev => ({ ...prev, images: data.images }));
                Alert.alert('Success', data.message);
            } else {
                Alert.alert('Error', data.message);
            }
        } catch (error) {
            console.error('Gallery upload error:', error);
            Alert.alert('Error', 'Failed to upload images');
        } finally {
            setIsUploadingGallery(false);
        }
    };

    const handleDeleteGalleryImage = async (imageUrl) => {
        const doDelete = async () => {
            try {
                const token = await getItem('userToken');
                const response = await fetch(`${API_URL}/api/rooms/${id}/images`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ imageUrl }),
                });
                const data = await response.json();
                if (data.success) {
                    setRoom(prev => ({ ...prev, images: data.images }));
                } else {
                    if (Platform.OS === 'web') window.alert('Error: ' + data.message);
                    else Alert.alert('Error', data.message);
                }
            } catch (error) {
                if (Platform.OS === 'web') window.alert('Failed to delete image');
                else Alert.alert('Error', 'Failed to delete image');
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Remove this image from the gallery?')) doDelete();
        } else {
            Alert.alert('Remove Image', 'Remove this image from the gallery?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: doDelete },
            ]);
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
    const galleryImages = room.images || [];

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.imageSection}>
                    {room.image ? (
                        <Image source={{ uri: room.image }} style={styles.heroImage} contentFit="cover" transition={400} />
                    ) : (
                        <View style={styles.heroImagePlaceholder}>
                            <MaterialIcons name="meeting-room" size={72} color={Colors.outlineVariant} />
                        </View>
                    )}
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageGradient} />
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.imageOverlayContent}>
                        <Text style={styles.roomNumberOverlay}>Room {room.roomNumber}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: isAvailable ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#22c55e' : '#ef4444' }]} />
                            <Text style={[styles.statusText, { color: isAvailable ? '#86efac' : '#fca5a5' }]}>
                                {room.availabilityStatus}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>Rs. {room.pricePerMonth?.toLocaleString()}</Text>
                        <Text style={styles.priceUnit}>/ month</Text>
                    </View>

                    {/* Info Grid */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconContainer, { backgroundColor: Colors.primaryFixed }]}>
                                <MaterialIcons name="king-bed" size={22} color={Colors.primary} />
                            </View>
                            <Text style={styles.infoLabel}>Type</Text>
                            <Text style={styles.infoValue}>{room.roomType}</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconContainer, { backgroundColor: Colors.tertiaryFixed }]}>
                                <MaterialIcons name="people" size={22} color={Colors.tertiary} />
                            </View>
                            <Text style={styles.infoLabel}>Capacity</Text>
                            <Text style={styles.infoValue}>{room.capacity} person{room.capacity > 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconContainer, { backgroundColor: isAvailable ? '#dcfce7' : '#fee2e2' }]}>
                                <MaterialIcons name="person" size={22} color={isAvailable ? '#22c55e' : '#ef4444'} />
                            </View>
                            <Text style={styles.infoLabel}>Occupancy</Text>
                            <Text style={styles.infoValue}>{room.currentOccupancy} / {room.capacity}</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <View style={[styles.infoIconContainer, { backgroundColor: Colors.secondaryFixed }]}>
                                <MaterialIcons name="calendar-today" size={22} color={Colors.secondary} />
                            </View>
                            <Text style={styles.infoLabel}>Created</Text>
                            <Text style={styles.infoValue}>{new Date(room.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    {/* Description */}
                    {room.description ? (
                        <View style={styles.descriptionCard}>
                            <Text style={styles.sectionTitle}>Description</Text>
                            <Text style={styles.descriptionText}>{room.description}</Text>
                        </View>
                    ) : null}

                    {/* Hidden file input for web multi-select */}
                    {Platform.OS === 'web' && (
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleWebFileChange}
                        />
                    )}

                    {/* Gallery Section */}
                    <View style={styles.gallerySection}>
                        <View style={styles.galleryHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>Photo Gallery</Text>
                                <Text style={styles.galleryCount}>{galleryImages.length} additional photo{galleryImages.length !== 1 ? 's' : ''}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addGalleryBtn}
                                onPress={handleAddGalleryImages}
                                disabled={isUploadingGallery}
                            >
                                {isUploadingGallery ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <>
                                        <MaterialIcons name="add-photo-alternate" size={18} color={Colors.primary} />
                                        <Text style={styles.addGalleryBtnText}>Add Photos</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {galleryImages.length > 0 ? (
                            <View style={styles.galleryGrid}>
                                {galleryImages.map((imgUrl, index) => (
                                    <View key={index} style={styles.galleryItem}>
                                        <Image
                                            source={{ uri: imgUrl }}
                                            style={styles.galleryImage}
                                            contentFit="cover"
                                            transition={200}
                                        />
                                        <TouchableOpacity
                                            style={styles.galleryDeleteBtn}
                                            onPress={() => handleDeleteGalleryImage(imgUrl)}
                                        >
                                            <MaterialIcons name="close" size={14} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.galleryEmpty}>
                                <MaterialIcons name="photo-library" size={36} color={Colors.outlineVariant} />
                                <Text style={styles.galleryEmptyText}>No gallery photos yet</Text>
                                <Text style={styles.galleryEmptySubtext}>Tap "Add Photos" to upload images for students to view</Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.editButton}
                            activeOpacity={0.85}
                            onPress={() => router.push({ pathname: '/manager/edit-room', params: { id: room._id } })}
                        >
                            <MaterialIcons name="edit" size={20} color="#fff" />
                            <Text style={styles.editButtonText}>Edit Room</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteButton}
                            activeOpacity={0.85}
                            onPress={handleDelete}
                        >
                            <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    imageSection: { height: 300, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroImagePlaceholder: { width: '100%', height: '100%', backgroundColor: Colors.surfaceContainerHigh, justifyContent: 'center', alignItems: 'center' },
    imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 160 },
    backButton: {
        position: 'absolute', top: 50, left: Spacing.four,
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
    },
    imageOverlayContent: {
        position: 'absolute', bottom: Spacing.four, left: Spacing.four, right: Spacing.four,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    roomNumberOverlay: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: '#fff', letterSpacing: -0.5 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
    content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: 40 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.four, gap: 4 },
    price: { fontFamily: Fonts.headlineExtraBold, fontSize: 30, color: Colors.tertiary, letterSpacing: -1 },
    priceUnit: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, marginLeft: 4 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.four },
    infoCard: {
        width: '47%', backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.three,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    infoIconContainer: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.two },
    infoLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant, marginBottom: 2 },
    infoValue: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onSurface },
    descriptionCard: {
        backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
        padding: Spacing.four, marginBottom: Spacing.four,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    sectionTitle: { fontFamily: Fonts.headline, fontSize: 17, color: Colors.onSurface, marginBottom: 2 },
    descriptionText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, lineHeight: 24 },
    // Gallery
    gallerySection: {
        backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl,
        padding: Spacing.three, marginBottom: Spacing.four,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    galleryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
    galleryCount: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
    addGalleryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: Colors.primaryFixed, borderRadius: Radius.lg,
        paddingHorizontal: 12, paddingVertical: 8,
    },
    addGalleryBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
    galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    galleryItem: { width: '31%', aspectRatio: 1, borderRadius: Radius.lg, overflow: 'hidden', position: 'relative' },
    galleryImage: { width: '100%', height: '100%' },
    galleryDeleteBtn: {
        position: 'absolute', top: 4, right: 4,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center',
    },
    galleryEmpty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
    galleryEmptyText: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onSurfaceVariant },
    galleryEmptySubtext: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.outline, textAlign: 'center' },
    // Actions
    actions: { flexDirection: 'row', gap: 12 },
    editButton: {
        flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: Colors.primaryContainer, borderRadius: Radius.xl, paddingVertical: 16,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
    },
    editButtonText: { fontFamily: Fonts.headline, fontSize: 16, color: '#fff' },
    deleteButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: Colors.errorContainer, borderRadius: Radius.xl, paddingVertical: 16,
    },
    deleteButtonText: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.error },
});
