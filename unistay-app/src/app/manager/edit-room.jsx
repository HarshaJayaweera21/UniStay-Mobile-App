import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const ROOM_TYPES = ['Single', 'Double', 'Triple'];
const GENDER_OPTIONS = ['male', 'female'];

export default function EditRoomScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [existingImage, setExistingImage] = useState('');
    const [formData, setFormData] = useState({
        roomNumber: '',
        roomType: 'Single',
        pricePerMonth: '',
        capacity: '',
        description: '',
        gender: 'male',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchRoom();
    }, [id]);

    const fetchRoom = async () => {
        try {
            const response = await fetch(`${API_URL}/api/rooms/${id}`);
            const data = await response.json();
            if (data.success) {
                const room = data.room;
                setFormData({
                    roomNumber: room.roomNumber,
                    roomType: room.roomType,
                    pricePerMonth: String(room.pricePerMonth),
                    capacity: String(room.capacity),
                    description: room.description || '',
                    gender: room.gender || 'male',
                });
                setExistingImage(room.image || '');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load room details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.roomNumber.trim()) newErrors.roomNumber = 'Room number is required';
        if (!formData.pricePerMonth || Number(formData.pricePerMonth) <= 0) newErrors.pricePerMonth = 'Enter a valid price';
        if (!formData.capacity || Number(formData.capacity) <= 0) newErrors.capacity = 'Enter a valid capacity';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSaving(true);
        try {
            const token = await getItem('userToken');
            let response;

            if (imageUri) {
                // Use FormData when a new image is selected
                const body = new FormData();
                body.append('roomNumber', formData.roomNumber.trim());
                body.append('roomType', formData.roomType);
                body.append('pricePerMonth', formData.pricePerMonth);
                body.append('capacity', formData.capacity);
                body.append('description', formData.description.trim());
                body.append('gender', formData.gender);

                if (Platform.OS === 'web') {
                    const imgResponse = await fetch(imageUri);
                    const blob = await imgResponse.blob();
                    body.append('image', blob, `room-${Date.now()}.jpg`);
                } else {
                    const filename = imageUri.split('/').pop();
                    const ext = filename.split('.').pop();
                    body.append('image', {
                        uri: imageUri,
                        name: filename,
                        type: `image/${ext}`,
                    });
                }

                response = await fetch(`${API_URL}/api/rooms/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body,
                });
            } else {
                // No new image — send JSON
                response = await fetch(`${API_URL}/api/rooms/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        roomNumber: formData.roomNumber.trim(),
                        roomType: formData.roomType,
                        pricePerMonth: formData.pricePerMonth,
                        capacity: formData.capacity,
                        description: formData.description.trim(),
                        gender: formData.gender,
                    }),
                });
            }

            const data = await response.json();

            if (data.success) {
                Alert.alert('Success', 'Room updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', data.message);
            }
        } catch (error) {
            console.error('Update room error:', error);
            Alert.alert('Error', 'Failed to update room. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const displayImage = imageUri || existingImage || null;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.primaryFixed, Colors.background]}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />

                {/* Header */}
                <View style={styles.header}>
                    
                    <Text style={styles.headerTitle}>Edit Room</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Image Picker */}
                    <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                        {displayImage ? (
                            <Image source={{ uri: displayImage }} style={styles.imagePreview} contentFit="cover" transition={300} />
                        ) : (
                            <View style={styles.imagePlaceholder}>
                                <MaterialIcons name="add-a-photo" size={36} color={Colors.primary} />
                                <Text style={styles.imagePickerText}>Tap to add room photo</Text>
                            </View>
                        )}
                        {!!displayImage && (
                            <View style={styles.imageOverlay}>
                                <MaterialIcons name="camera-alt" size={20} color="#fff" />
                                <Text style={styles.imageOverlayText}>Change Photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Form */}
                    <View style={styles.formCard}>
                        {/* Room Number */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>ROOM NUMBER</Text>
                            <View style={[styles.inputContainer, !!errors.roomNumber && styles.inputError]}>
                                <MaterialIcons name="meeting-room" size={20} color={Colors.outline} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. A101"
                                    placeholderTextColor={Colors.outline}
                                    value={formData.roomNumber}
                                    onChangeText={(v) => handleChange('roomNumber', v)}
                                />
                            </View>
                            {!!errors.roomNumber && <Text style={styles.errorText}>{errors.roomNumber}</Text>}
                        </View>

                        {/* Room Type */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>ROOM TYPE</Text>
                            <View style={styles.typeSelector}>
                                {ROOM_TYPES.map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.typeOption,
                                            formData.roomType === type ? styles.typeOptionActive : null,
                                        ]}
                                        onPress={() => handleChange('roomType', type)}
                                    >
                                        <Text style={[
                                            styles.typeOptionText,
                                            formData.roomType === type ? styles.typeOptionTextActive : null,
                                        ]}>
                                            {type}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Room Gender */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>ASSIGNED GENDER</Text>
                            <View style={styles.typeSelector}>
                                {GENDER_OPTIONS.map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[
                                            styles.typeOption,
                                            formData.gender === g ? styles.typeOptionActive : null,
                                            { flexDirection: 'row', gap: 6 }
                                        ]}
                                        onPress={() => handleChange('gender', g)}
                                    >
                                        <MaterialIcons 
                                            name={g === 'male' ? 'man' : 'woman'} 
                                            size={18} 
                                            color={formData.gender === g ? Colors.primary : Colors.onSurfaceVariant} 
                                        />
                                        <Text style={[
                                            styles.typeOptionText,
                                            formData.gender === g ? styles.typeOptionTextActive : null,
                                            { textTransform: 'capitalize' }
                                        ]}>
                                            {g}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Price & Capacity Row */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>PRICE / MONTH (Rs)</Text>
                                <View style={[styles.inputContainer, !!errors.pricePerMonth && styles.inputError]}>
                                    <MaterialIcons name="payments" size={20} color={Colors.outline} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="5000"
                                        placeholderTextColor={Colors.outline}
                                        keyboardType="numeric"
                                        value={formData.pricePerMonth}
                                        onChangeText={(v) => handleChange('pricePerMonth', v)}
                                    />
                                </View>
                                {!!errors.pricePerMonth && <Text style={styles.errorText}>{errors.pricePerMonth}</Text>}
                            </View>

                            <View style={{ width: 12 }} />

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>CAPACITY</Text>
                                <View style={[styles.inputContainer, !!errors.capacity && styles.inputError]}>
                                    <MaterialIcons name="people" size={20} color={Colors.outline} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="2"
                                        placeholderTextColor={Colors.outline}
                                        keyboardType="numeric"
                                        value={formData.capacity}
                                        onChangeText={(v) => handleChange('capacity', v)}
                                    />
                                </View>
                                {!!errors.capacity && <Text style={styles.errorText}>{errors.capacity}</Text>}
                            </View>
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>DESCRIPTION</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Room description, amenities, etc."
                                    placeholderTextColor={Colors.outline}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                    value={formData.description}
                                    onChangeText={(v) => handleChange('description', v)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        activeOpacity={0.85}
                        onPress={handleSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialIcons name="save" size={22} color="#fff" />
                                <Text style={styles.submitButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
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
        height: 160,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingTop: 56,
        paddingBottom: Spacing.three,
    },
    backButton: {
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
    headerTitle: {
        fontFamily: Fonts.headline,
        fontSize: 20,
        color: Colors.onSurface,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.four,
        paddingBottom: 40,
    },
    imagePicker: {
        width: '100%',
        height: 200,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        marginBottom: Spacing.four,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.outlineVariant,
        borderStyle: 'dashed',
        borderRadius: Radius.xl,
        gap: 8,
    },
    imagePickerText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.primary,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 10,
    },
    imageOverlayText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 13,
        color: '#fff',
    },
    formCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.four,
        marginBottom: Spacing.four,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    inputGroup: {
        marginBottom: Spacing.three,
    },
    label: {
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        color: Colors.onSurfaceVariant,
        letterSpacing: 0.8,
        marginBottom: Spacing.two,
        marginLeft: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerHighest,
        borderRadius: Radius.lg,
        paddingHorizontal: Spacing.three,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: Colors.error,
    },
    inputIcon: {
        marginRight: Spacing.two,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        color: Colors.onSurface,
    },
    textArea: {
        minHeight: 100,
        paddingTop: 14,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        color: Colors.error,
        marginTop: 4,
        marginLeft: 2,
    },
    row: {
        flexDirection: 'row',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: Radius.lg,
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerHighest,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    typeOptionActive: {
        backgroundColor: Colors.primaryFixed,
        borderColor: Colors.primary,
    },
    typeOptionText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
    },
    typeOptionTextActive: {
        color: Colors.primary,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.primaryContainer,
        borderRadius: Radius.xl,
        paddingVertical: 18,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 6,
    },
    submitButtonText: {
        fontFamily: Fonts.headline,
        fontSize: 17,
        color: '#fff',
    },
});
