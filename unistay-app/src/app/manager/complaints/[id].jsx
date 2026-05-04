import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator,
    Alert,
    Platform,
    Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { getComplaintById, updateComplaintStatus, deleteComplaint } from '@/services/complaintService';
import BottomNav from '@/components/BottomNav';

export default function ManagerComplaintDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [feedback, setFeedback] = useState(null); // { message, type: 'success' | 'error' }

    useEffect(() => {
        fetchComplaintDetails();
    }, [id]);

    const fetchComplaintDetails = async () => {
        try {
            const data = await getComplaintById(id);
            setComplaint(data.complaint);
        } catch (error) {
            if (Platform.OS === 'web') {
                alert('Failed to fetch complaint details.');
            } else {
                Alert.alert('Error', 'Failed to fetch complaint details.');
            }
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        setFeedback(null);
        try {
            await updateComplaintStatus(id, newStatus);
            setComplaint({ ...complaint, status: newStatus });
            setFeedback({ message: `Status updated to ${newStatus}`, type: 'success' });
            // Hide feedback after 4 seconds
            setTimeout(() => setFeedback(null), 4000);
        } catch (error) {
            setFeedback({ message: error.message || 'Failed to update status.', type: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm('Are you sure you want to permanently delete this complaint?');
            if (confirmed) {
                performDelete();
            }
        } else {
            Alert.alert(
                'Confirm Delete',
                'Are you sure you want to permanently delete this complaint?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: performDelete }
                ]
            );
        }
    };

    const performDelete = async () => {
        setFeedback(null);
        try {
            await deleteComplaint(id);
            setFeedback({ message: 'Complaint deleted.', type: 'success' });
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error) {
            setFeedback({ message: 'Failed to delete complaint.', type: 'error' });
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return { color: Colors.error, bg: Colors.error + '15' };
            case 'in-progress': return { color: Colors.primary, bg: Colors.primary + '15' };
            case 'resolved': return { color: Colors.success, bg: Colors.success + '15' };
            default: return { color: Colors.outline, bg: Colors.surfaceVariant };
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const currentStatusStyle = getStatusStyle(complaint.status);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Complaint Review</Text>
                <Pressable onPress={handleDelete} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={22} color={Colors.error} />
                </Pressable>
            </View>

            {feedback && (
                <View style={[
                    styles.feedbackBanner, 
                    { backgroundColor: feedback.type === 'success' ? '#e6f4ea' : Colors.errorContainer }
                ]}>
                    <Ionicons 
                        name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                        size={20} 
                        color={feedback.type === 'success' ? '#1e8e3e' : Colors.error} 
                    />
                    <Text style={[
                        styles.feedbackText, 
                        { color: feedback.type === 'success' ? '#1e8e3e' : Colors.error }
                    ]}>
                        {feedback.message}
                    </Text>
                    <Pressable onPress={() => setFeedback(null)}>
                        <Ionicons name="close" size={18} color={feedback.type === 'success' ? '#1e8e3e' : Colors.error} />
                    </Pressable>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Header */}
                <View style={[styles.statusBanner, { backgroundColor: currentStatusStyle.bg }]}>
                    <Text style={[styles.statusLabel, { color: currentStatusStyle.color }]}>
                        CURRENT STATUS: {complaint.status.toUpperCase()}
                    </Text>
                </View>

                {/* Student Info */}
                <View style={styles.section}>
                    <View style={styles.studentCard}>
                        <Ionicons name="person-circle" size={50} color={Colors.primary} />
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>
                                {complaint.userId?.firstName} {complaint.userId?.lastName}
                            </Text>
                            <Text style={styles.studentEmail}>{complaint.userId?.email}</Text>
                        </View>
                        <Text style={styles.dateInfo}>
                           {new Date(complaint.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.contentCard}>
                    <Text style={styles.complaintTitle}>{complaint.title}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.complaintDescription}>{complaint.description}</Text>
                    
                    {complaint.image && (
                        <View style={styles.imageSection}>
                            <Text style={styles.imageAttachmentLabel}>Attachment Evidence</Text>
                            <Pressable 
                                style={styles.imageContainer}
                                onPress={() => setShowImageModal(true)}
                            >
                                <Image source={{ uri: complaint.image }} style={styles.attachment} resizeMode="cover" />
                                <View style={styles.imageOverlay}>
                                    <Ionicons name="expand-outline" size={20} color="#fff" />
                                    <Text style={styles.imageText}>Tap to enlarge</Text>
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

                {/* Management Actions */}
                <View style={styles.actionsSection}>
                    <Text style={styles.sectionTitle}>Update Status</Text>
                    <View style={styles.buttonGroup}>
                        <Pressable 
                            style={[
                                styles.statusBtn, 
                                complaint.status === 'pending' && { backgroundColor: Colors.error }
                            ]}
                            onPress={() => handleStatusUpdate('pending')}
                            disabled={updating}
                        >
                            <Text style={[styles.statusBtnText, complaint.status === 'pending' && { color: '#fff' }]}>Pending</Text>
                        </Pressable>
                        <Pressable 
                            style={[
                                styles.statusBtn, 
                                complaint.status === 'in-progress' && { backgroundColor: Colors.primary }
                            ]}
                            onPress={() => handleStatusUpdate('in-progress')}
                            disabled={updating}
                        >
                            <Text style={[styles.statusBtnText, complaint.status === 'in-progress' && { color: '#fff' }]}>In Progress</Text>
                        </Pressable>
                        <Pressable 
                            style={[
                                styles.statusBtn, 
                                complaint.status === 'resolved' && { backgroundColor: Colors.success }
                            ]}
                            onPress={() => handleStatusUpdate('resolved')}
                            disabled={updating}
                        >
                            <Text style={[styles.statusBtnText, complaint.status === 'resolved' && { color: '#fff' }]}>Resolved</Text>
                        </Pressable>
                    </View>
                    {updating && <ActivityIndicator color={Colors.primary} style={{ marginTop: 10 }} />}
                </View>
            </ScrollView>

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
    deleteButton: {
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
    feedbackBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.four,
        marginTop: Spacing.two,
        padding: Spacing.three,
        borderRadius: Radius.md,
        gap: Spacing.two,
    },
    feedbackText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    statusBanner: {
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: Spacing.four,
    },
    statusLabel: {
        fontFamily: Fonts.headline,
        fontSize: 12,
        letterSpacing: 2,
    },
    section: {
        paddingHorizontal: Spacing.four,
        marginBottom: Spacing.four,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        padding: Spacing.three,
        borderRadius: Radius.lg,
        boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
    },
    studentInfo: {
        marginLeft: Spacing.three,
        flex: 1,
    },
    studentName: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onSurface,
    },
    studentEmail: {
        fontFamily: Fonts.body,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
    },
    dateInfo: {
        fontFamily: Fonts.body,
        fontSize: 11,
        color: Colors.outline,
    },
    contentCard: {
        marginHorizontal: Spacing.four,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        boxShadow: '0px 4px 16px rgba(0,0,0,0.05)',
        marginBottom: Spacing.five,
    },
    complaintTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 22,
        color: Colors.onSurface,
        marginBottom: Spacing.two,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surfaceVariant,
        marginBottom: Spacing.three,
    },
    complaintDescription: {
        fontFamily: Fonts.body,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        lineHeight: 26,
        marginBottom: Spacing.four,
    },
    imageContainer: {
        borderRadius: Radius.lg,
        overflow: 'hidden',
        marginTop: Spacing.two,
    },
    attachment: {
        width: '100%',
        height: 250,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    imageText: {
        color: '#fff',
        fontFamily: Fonts.bodySemiBold,
        fontSize: 12,
    },
    actionsSection: {
        paddingHorizontal: Spacing.four,
    },
    sectionTitle: {
        fontFamily: Fonts.headline,
        fontSize: 18,
        color: Colors.onSurface,
        marginBottom: Spacing.three,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: Spacing.two,
        justifyContent: 'space-between',
    },
    statusBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceContainerLow,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.surfaceVariant,
    },
    statusBtnText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
    },
    imageSection: {
        marginTop: Spacing.two,
    },
    imageAttachmentLabel: {
        fontFamily: Fonts.headline,
        fontSize: 14,
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.two,
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
