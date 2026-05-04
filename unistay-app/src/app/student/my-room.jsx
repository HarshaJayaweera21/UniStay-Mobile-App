import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, ScrollView, Platform, SafeAreaView,
    StatusBar, Linking, Dimensions, Alert
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyRoomRequest() {
    const router = useRouter();
    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchMyRequest();
    }, []);

    const fetchMyRequest = async () => {
        try {
            const token = await getItem('userToken');
            const res = await fetch(`${API_URL}/api/room-requests/my-request`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.request) {
                setRequest(data.request);
            }
        } catch (err) {
            console.error('Error fetching request:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            setFile({ uri: asset.uri, name: asset.name || 'signed_agreement.pdf', type: asset.mimeType || 'application/pdf' });
        }
    };

    const handleCancelRequest = async () => {
        Alert.alert(
            "Request Cancellation",
            "Are you sure you want to request cancellation for this room? This requires manager approval.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await getItem('userToken');
                            const response = await fetch(`${API_URL}/api/room-requests/my-request/cancel`, {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            const data = await response.json();
                            if (response.ok && data.success) {
                                Alert.alert("Success", "Cancellation requested successfully.");
                                fetchMyRequest();
                            } else {
                                Alert.alert("Error", data.message || "Failed to request cancellation.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Network error occurred.");
                        }
                    }
                }
            ]
        );
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Pending': return { label: 'Pending Manager Review', color: '#eab308', icon: 'hourglass-empty' };
            case 'AgreementSent': return { label: 'Action Required', color: Colors.primary, icon: 'assignment' };
            case 'ReceiptUploaded': return { label: 'Verifying Receipt', color: '#3b82f6', icon: 'cloud-done' };
            case 'Approved': return { label: 'Room Confirmed', color: '#22c55e', icon: 'check-circle' };
            case 'Rejected': return { label: 'Request Rejected', color: '#ef4444', icon: 'cancel' };
            case 'Cancelled': return { label: 'Request Cancelled', color: Colors.outline, icon: 'block' };
            default: return { label: 'Unknown Status', color: Colors.outline, icon: 'help-outline' };
        }
    };

    const handleUpload = async () => {
        if (!file) {
            if (Platform.OS === 'web') window.alert('Please select a file first.');
            return;
        }

        setIsUploading(true);
        try {
            const token = await getItem('userToken');
            const formData = new FormData();
            formData.append('file', { uri: file.uri, name: file.name, type: file.type });

            const res = await fetch(`${API_URL}/api/room-requests/${request._id}/receipt`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            
            const data = await res.json();
            if (data.success) {
                if (Platform.OS === 'web') window.alert('File uploaded successfully!');
                setRequest(data.request);
                setFile(null);
            } else {
                if (Platform.OS === 'web') window.alert(data.message);
            }
        } catch (err) {
            console.error('Upload error:', err);
            if (Platform.OS === 'web') window.alert('Failed to upload file.');
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!request) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.topAppBar}>
                    <TouchableOpacity style={styles.appBarBtn} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.topAppTitle}>My Room Request</Text>
                    <View style={styles.appBarBtn} />
                </View>
                <View style={styles.noRequestContainer}>
                    <MaterialIcons name="event-busy" size={64} color={Colors.outlineVariant} />
                    <Text style={styles.noRequestTitle}>No Active Request</Text>
                    <Text style={styles.noRequestSubtitle}>You haven't requested a room yet.</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/student')}>
                        <Text style={styles.browseBtnText}>Browse Rooms</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusInfo = getStatusInfo(request.status);
    const SCREEN_WIDTH = Dimensions.get('window').width;

    const calculateEndDate = (startDate, months) => {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + parseInt(months));
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.topAppBar}>
                    <TouchableOpacity style={styles.appBarBtn} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.topAppTitle}>My Room Request</Text>
                    <View style={styles.appBarBtn} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    {/* Status Card */}
                    <LinearGradient
                        colors={[Colors.surfaceContainerLowest, Colors.surfaceContainerLowest]}
                        style={styles.statusCard}
                    >
                        <View style={[styles.statusIconWrap, { backgroundColor: `${statusInfo.color}15` }]}>
                            <MaterialIcons name={statusInfo.icon} size={32} color={statusInfo.color} />
                        </View>
                        <Text style={styles.statusTitle}>{statusInfo.label}</Text>
                        <Text style={styles.roomText}>Room {request.roomId?.roomNumber || 'Unknown'}</Text>
                    </LinearGradient>

                    {/* Details Card */}
                    <View style={styles.detailsCard}>
                        <Text style={styles.sectionTitle}>Request Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Monthly Rent</Text>
                            <Text style={styles.detailValue}>Rs. {request.roomId?.pricePerMonth?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Duration of stay</Text>
                            <Text style={styles.detailValue}>{request.durationInMonths} months</Text>
                        </View>
                        {request.status === 'Approved' && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Contract Ends On</Text>
                                <Text style={[styles.detailValue, { color: '#16a34a' }]}>
                                    {calculateEndDate(request.reviewedAt || request.updatedAt, request.durationInMonths)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Key Money (Deposit)</Text>
                            <Text style={styles.detailValue}>Rs. {request.keyMoneyAmount?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Requested On</Text>
                            <Text style={styles.detailValue}>{new Date(request.createdAt).toLocaleDateString()}</Text>
                        </View>
                    </View>

                    {/* Room Photos (Visible if available) */}
                    {(request.roomId?.image || (request.roomId?.images && request.roomId.images.length > 0)) && (
                        <View style={styles.photosSection}>
                            <Text style={styles.sectionTitle}>Room Photos</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosList}>
                                {request.roomId.image && (
                                    <Image 
                                        source={{ uri: request.roomId.image }} 
                                        style={styles.roomPhoto} 
                                        contentFit="cover"
                                    />
                                )}
                                {request.roomId.images?.map((img, index) => (
                                    <Image 
                                        key={index}
                                        source={{ uri: img }} 
                                        style={styles.roomPhoto} 
                                        contentFit="cover"
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Action Area based on Status */}
                    {request.status === 'AgreementSent' && (
                        <View style={styles.actionCard}>
                            <Text style={styles.sectionTitle}>Next Steps</Text>
                            <Text style={styles.instructionText}>
                                1. Download and sign the tenancy agreement.{"\n"}
                                2. Pay the Key Money amount.{"\n"}
                                3. Upload a single PDF containing your signed agreement AND the payment receipt.
                            </Text>

                            <TouchableOpacity 
                                style={styles.downloadBtn}
                                onPress={() => Linking.openURL(request.managerAgreementUrl)}
                            >
                                <MaterialIcons name="file-download" size={20} color={Colors.primary} />
                                <Text style={styles.downloadBtnText}>Download Agreement PDF</Text>
                            </TouchableOpacity>

                            <View style={styles.uploadArea}>
                                {file ? (
                                    <View style={styles.fileSelected}>
                                        <MaterialIcons name="picture-as-pdf" size={24} color={Colors.error} />
                                        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                        <TouchableOpacity onPress={() => setFile(null)}>
                                            <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.pickFileBtn} onPress={pickDocument}>
                                        <MaterialIcons name="upload-file" size={20} color={Colors.outline} />
                                        <Text style={styles.pickFileText}>Select PDF File</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity 
                                    style={[styles.submitBtn, (!file || isUploading) && { opacity: 0.5 }]}
                                    disabled={!file || isUploading}
                                    onPress={handleUpload}
                                >
                                    {isUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Signed Agreement & Receipt</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {request.status === 'ReceiptUploaded' && (
                        <View style={styles.actionCard}>
                            <Text style={styles.sectionTitle}>Review in Progress</Text>
                            <Text style={styles.instructionText}>
                                The manager is currently reviewing your signed agreement and key money receipt. 
                                You will be notified once the room is confirmed.
                            </Text>
                            {!!request.studentReceiptUrl && (
                                <TouchableOpacity 
                                    style={styles.downloadBtn}
                                    onPress={() => Linking.openURL(request.studentReceiptUrl)}
                                >
                                    <MaterialIcons name="visibility" size={20} color={Colors.primary} />
                                    <Text style={styles.downloadBtnText}>View My Uploaded File</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {request.status === 'Approved' && (
                        <View style={[styles.actionCard, { borderColor: '#22c55e', borderWidth: 1, backgroundColor: '#f0fdf4' }]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
                                <MaterialIcons name="verified" size={24} color="#16a34a" />
                                <Text style={[styles.sectionTitle, {color: '#15803d', marginBottom: 0}]}>Congratulations!</Text>
                            </View>
                            <Text style={[styles.instructionText, {color: '#166534'}]}>
                                Your room request has been fully confirmed and your key money is verified. 
                                You can now access the payments module to manage your monthly rent.
                            </Text>
                            <TouchableOpacity 
                                style={[styles.submitBtn, { backgroundColor: '#16a34a', marginTop: 12 }]}
                                onPress={() => router.push('/student/payments')}
                            >
                                <Text style={styles.submitBtnText}>Go to Payments</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Cancellation Section */}
                    {['Pending', 'AgreementSent', 'ReceiptUploaded', 'Approved'].includes(request.status) && (
                        <TouchableOpacity 
                            style={[styles.cancelRequestBtn, request.cancellationRequested && styles.cancelRequestBtnDisabled]} 
                            onPress={handleCancelRequest}
                            disabled={request.cancellationRequested}
                        >
                            <MaterialIcons name="cancel" size={20} color={request.cancellationRequested ? Colors.outline : Colors.error} />
                            <Text style={[styles.cancelRequestBtnText, request.cancellationRequested && styles.cancelRequestBtnTextDisabled]}>
                                {request.cancellationRequested ? "Cancellation Pending Approval" : "Request Cancellation"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.surface, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: Colors.surface },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topAppBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, height: 60, backgroundColor: Colors.surface },
    appBarBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    topAppTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.onSurface },
    content: { padding: Spacing.four, paddingBottom: 40 },
    
    noRequestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.six },
    noRequestTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 24, color: Colors.onSurface, marginTop: Spacing.four },
    noRequestSubtitle: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 },
    browseBtn: { marginTop: Spacing.six, backgroundColor: Colors.primaryContainer, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full },
    browseBtnText: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onPrimaryContainer },

    statusCard: { alignItems: 'center', padding: Spacing.five, borderRadius: Radius.xl, marginBottom: Spacing.four, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
    statusIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.three },
    statusTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: 4 },
    roomText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurfaceVariant },

    detailsCard: { backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.four, borderRadius: Radius.xl, marginBottom: Spacing.four, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface, marginBottom: Spacing.three },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainer },
    detailLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },
    detailValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },

    actionCard: { backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.four, borderRadius: Radius.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    instructionText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginBottom: Spacing.four },
    
    downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryFixed, padding: Spacing.three, borderRadius: Radius.lg, alignSelf: 'flex-start', marginBottom: Spacing.four },
    downloadBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },

    uploadArea: { borderTopWidth: 1, borderTopColor: Colors.surfaceContainer, paddingTop: Spacing.four },
    pickFileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Colors.outline, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.four, marginBottom: Spacing.three },
    pickFileText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.outline },
    
    fileSelected: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest, padding: Spacing.three, borderRadius: Radius.lg, marginBottom: Spacing.three },
    fileName: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurface, marginHorizontal: 8 },
    
    submitBtn: { backgroundColor: Colors.primary, padding: Spacing.four, borderRadius: Radius.xl, alignItems: 'center' },
    submitBtnText: { fontFamily: Fonts.headline, fontSize: 16, color: '#fff' },

    photosSection: { marginBottom: Spacing.four },
    photosList: { gap: 12 },
    roomPhoto: { width: 200, height: 130, borderRadius: Radius.lg, backgroundColor: Colors.surfaceContainerHigh },
    cancelRequestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: Spacing.six,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        backgroundColor: '#fff5f5',
        borderRadius: Radius.lg,
    },
    cancelRequestBtnText: {
        fontFamily: Fonts.headline,
        fontSize: 15,
        color: Colors.error,
    },
    cancelRequestBtnDisabled: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderColor: Colors.surfaceContainer,
    },
    cancelRequestBtnTextDisabled: {
        color: Colors.outline,
    }
});
