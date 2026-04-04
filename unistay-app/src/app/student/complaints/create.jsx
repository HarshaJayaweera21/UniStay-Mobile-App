import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ScrollView,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { createComplaint } from '@/services/complaintService';

export default function CreateComplaint() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (description.length < 400) {
            Alert.alert('Incomplete Description', `Please provide more details. Description must be at least 400 characters (currently ${description.length}/400).`);
            return;
        }

        setLoading(true);
        try {
            await createComplaint(title, description, image);
            Alert.alert('Success', 'Complaint submitted successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', error.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Pressable 
                        onPress={() => router.back()} 
                        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
                    </Pressable>
                    <Text style={styles.headerTitle}>New Complaint</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Complaint Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Broken AC in Room 302"
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor={Colors.outline}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Provide details about your issue..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={6}
                        placeholderTextColor={Colors.outline}
                        textAlignVertical="top"
                    />
                    <View style={styles.charCounter}>
                        <View style={styles.charProgressBackground}>
                            <View 
                                style={[
                                    styles.charProgressBar, 
                                    { 
                                        width: `${Math.min((description.length / 400) * 100, 100)}%`,
                                        backgroundColor: description.length >= 400 ? Colors.success : Colors.primary 
                                    }
                                ]} 
                            />
                        </View>
                        <Text style={[styles.charCountText, description.length >= 400 && { color: Colors.success }]}>
                            {description.length} / 400 characters
                        </Text>
                    </View>

                    <Text style={styles.label}>Attachment (Optional)</Text>
                    <View style={styles.imageSection}>
                        {image ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: image }} style={styles.imagePreview} />
                                <Pressable 
                                    style={({ pressed }) => [styles.removeImage, pressed && { scale: 0.95 }]} 
                                    onPress={() => setImage(null)}
                                >
                                    <Ionicons name="close-circle" size={24} color={Colors.error} />
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.imageButtons}>
                                <Pressable 
                                    style={({ pressed }) => [styles.imageButton, pressed && { backgroundColor: Colors.surfaceContainer }]} 
                                    onPress={pickImage}
                                >
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="images" size={24} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.imageButtonText}>Gallery</Text>
                                </Pressable>
                                <Pressable 
                                    style={({ pressed }) => [styles.imageButton, pressed && { backgroundColor: Colors.surfaceContainer }]} 
                                    onPress={takePhoto}
                                >
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="camera" size={24} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.imageButtonText}>Camera</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.submitButton, 
                            loading && styles.disabledButton,
                            pressed && !loading && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.onPrimary} />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Complaint</Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    scrollContent: {
        paddingBottom: Spacing.six,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.six,
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
    form: {
        padding: Spacing.four,
    },
    label: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onSurface,
        marginBottom: Spacing.one,
        marginTop: Spacing.three,
    },
    input: {
        backgroundColor: Colors.surfaceVariant, // Layered surface per design rules
        borderRadius: Radius.md,
        padding: Spacing.three,
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.onSurface,
    },
    textArea: {
        minHeight: 160,
    },
    charCounter: {
        marginTop: Spacing.two,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    charProgressBackground: {
        flex: 1,
        height: 4,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 2,
        marginRight: Spacing.three,
        overflow: 'hidden',
    },
    charProgressBar: {
        height: '100%',
        borderRadius: 2,
    },
    charCountText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        color: Colors.onSurfaceVariant,
    },
    imageSection: {
        marginTop: Spacing.one,
        marginBottom: Spacing.four,
    },
    imageButtons: {
        flexDirection: 'row',
        gap: Spacing.three,
    },
    imageButton: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: Radius.md,
        padding: Spacing.three,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primaryContainer,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.one,
        opacity: 0.2, // Subtle interaction highlight
    },
    imageButtonText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.primary,
    },
    imagePreviewContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: Radius.lg,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImage: {
        position: 'absolute',
        top: Spacing.two,
        right: Spacing.two,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 12,
    },
    submitButton: {
        backgroundColor: Colors.primaryContainer,
        borderRadius: Radius.lg,
        padding: Spacing.four,
        alignItems: 'center',
        marginTop: Spacing.four,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontFamily: Fonts.headline,
        fontSize: 18,
        color: Colors.onPrimary,
    },
});
