import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    ActivityIndicator,
    Pressable,
    Alert,
    Platform,
    Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { getComplaintById, deleteComplaint } from '@/services/complaintService';

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

export default function ComplaintDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showImageModal, setShowImageModal] = useState(false);
    const [error, setError] = useState(null);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const data = await getComplaintById(id);
            setComplaint(data.complaint);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.');
            if (confirmed) {
                performDelete();
            }
        } else {
            Alert.alert(
                'Delete Complaint',
                'Are you sure you want to delete this complaint? This action cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: performDelete }
                ]
            );
        }
    };

    const performDelete = async () => {
        try {
            await deleteComplaint(id);
            if (Platform.OS === 'web') {
                alert('Complaint deleted successfully.');
            } else {
                Alert.alert('Success', 'Complaint deleted successfully.');
            }
            router.back();
        } catch (err) {
            if (Platform.OS === 'web') {
                alert(err.message || 'Failed to delete complaint.');
            } else {
                Alert.alert('Error', err.message || 'Failed to delete complaint.');
            }
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error || !complaint) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || 'Complaint not found'}</Text>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable 
                    onPress={() => router.back()} 
                    style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.onSurface} />
                </Pressable>

                <Pressable 
                    onPress={handleDelete} 
                    style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
                >
                    <Ionicons name="trash-outline" size={24} color={Colors.error} />
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.infoCard}>
                    <View style={styles.headerRow}>
                        <StatusBadge status={complaint.status} />
                        <Text style={styles.dateText}>
                            {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </Text>
                    </View>

                    <Text style={styles.title}>{complaint.title}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.sectionLabel}>Description</Text>
                    <Text style={styles.description}>{complaint.description}</Text>

                    {complaint.image && (
                        <View style={styles.imageContainer}>
                            <Text style={styles.sectionLabel}>Attached Image Evidence</Text>
                            <Pressable onPress={() => setShowImageModal(true)}>
                                <Image 
                                    source={{ uri: complaint.image }} 
                                    style={styles.image} 
                                    resizeMode="cover"
                                />
                                <View style={styles.imageOverlay}>
                                    <Ionicons name="expand-outline" size={18} color="#fff" />
                                    <Text style={styles.imageOverlayText}>View Details</Text>
                                </View>
                            </Pressable>

                            <Modal
                                visible={showImageModal}
                                transparent={true}
                                animationType="fade"
                                onRequestClose={() => setShowImageModal(false)}
                            >
                                <View style={styles.modalOverlay}>
                                    <View style={styles.modalContent}>
                                        <Image 
                                            source={{ uri: complaint.image }} 
                                            style={styles.fullImage} 
                                            resizeMode="contain" 
                                        />
                                        <Pressable 
                                            style={styles.closeModalButton}
                                            onPress={() => setShowImageModal(false)}
                                        >
                                            <Ionicons name="close" size={30} color="#fff" />
                                        </Pressable>
                                    </View>
                                </View>
                            </Modal>
                        </View>
                    )}
                </View>

                {complaint.status === 'resolved' && (
                    <View style={styles.resolvedInfo}>
                        <Ionicons name="checkmark-circle" size={24} color="#1e8e3e" />
                        <Text style={styles.resolvedText}>
                            This issue has been marked as resolved by the management.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.six,
        paddingBottom: Spacing.two,
        zIndex: 10,
    },
    backButton: {
        padding: Spacing.one,
    },
    deleteButton: {
        padding: Spacing.one,
    },
    scrollContent: {
        padding: Spacing.four,
    },
    infoCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        // Depth without hard borders
        boxShadow: '0px 16px 32px rgba(0,0,0,0.05)',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.three,
    },
    dateText: {
        fontFamily: Fonts.body,
        fontSize: 14,
        color: Colors.outline,
    },
    title: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 24,
        color: Colors.onSurface,
        marginBottom: Spacing.two,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surfaceContainerHigh,
        marginVertical: Spacing.three,
    },
    sectionLabel: {
        fontFamily: Fonts.headline,
        fontSize: 14,
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.one,
    },
    description: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.onSurface,
        lineHeight: 24,
        marginBottom: Spacing.four,
    },
    imageContainer: {
        marginTop: Spacing.two,
    },
    image: {
        width: '100%',
        height: 250,
        borderRadius: Radius.lg,
        marginTop: Spacing.one,
    },
    badge: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.one,
        borderRadius: Radius.full,
    },
    badgeText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        textTransform: 'uppercase',
    },
    pendingBadge: { backgroundColor: Colors.surfaceContainerHigh },
    pendingText: { color: Colors.onSurfaceVariant },
    inProgressBadge: { backgroundColor: Colors.primaryContainer },
    inProgressText: { color: Colors.onPrimary },
    resolvedBadge: { backgroundColor: '#e6f4ea' },
    resolvedText: { color: '#1e8e3e' },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.error,
        marginBottom: Spacing.two,
    },
    backLink: {
        fontFamily: Fonts.headline,
        fontSize: 14,
        color: Colors.primary,
    },
    resolvedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6f4ea',
        padding: Spacing.three,
        borderRadius: Radius.lg,
        marginTop: Spacing.four,
    },
    resolvedText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: '#1e8e3e',
        marginLeft: Spacing.two,
        flex: 1,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderBottomLeftRadius: Radius.lg,
        borderBottomRightRadius: Radius.lg,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    imageOverlayText: {
        color: '#fff',
        fontFamily: Fonts.bodySemiBold,
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    closeModalButton: {
        position: 'absolute',
        top: 60,
        right: 25,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
