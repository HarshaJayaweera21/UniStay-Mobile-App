import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, ScrollView, Platform, SafeAreaView,
    StatusBar, Linking, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';

export default function ManagerRequestDetails() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [agreementFile, setAgreementFile] = useState(null);

    useEffect(() => {
        if (id) fetchRequest();
    }, [id]);

    const fetchRequest = async () => {
        try {
            const token = await getItem('userToken');
            const res = await fetch(`${API_URL}/api/room-requests/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
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
            setAgreementFile({ uri: asset.uri, name: asset.name || 'agreement.pdf', type: asset.mimeType || 'application/pdf' });
        }
    };

    const handleUploadAgreement = async () => {
        if (!agreementFile) {
            if (Platform.OS === 'web') window.alert('Please select an agreement PDF first.');
            return;
        }

        setIsActionLoading(true);
        try {
            const token = await getItem('userToken');
            const formData = new FormData();
            formData.append('file', { uri: agreementFile.uri, name: agreementFile.name, type: agreementFile.type });

            const res = await fetch(`${API_URL}/api/room-requests/${id}/agreement`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            
            const data = await res.json();
            if (data.success) {
                if (Platform.OS === 'web') window.alert('Agreement sent successfully!');
                setRequest(data.request);
                setAgreementFile(null);
            } else {
                if (Platform.OS === 'web') window.alert(data.message);
            }
        } catch (err) {
            console.error('Upload error:', err);
            if (Platform.OS === 'web') window.alert('Failed to upload agreement.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAction = async (actionType) => {
        setIsActionLoading(true);
        try {
            const token = await getItem('userToken');
            let endpoint = `${API_URL}/api/room-requests/${id}`;
            let method = 'PUT';
            let body = null;

            if (actionType === 'verify') {
                endpoint += '/verify';
            } else if (actionType === 'reject') {
                endpoint += '/status';
                body = JSON.stringify({ status: 'Rejected' });
            } else if (actionType === 'approve-cancellation') {
                endpoint += '/approve-cancellation';
            } else if (actionType === 'reject-cancellation') {
                endpoint += '/reject-cancellation';
            }

            const res = await fetch(endpoint, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body
            });
            
            const data = await res.json();
            if (data.success) {
                if (Platform.OS === 'web') window.alert(`Request action successful.`);
                setRequest(data.request);
            } else {
                if (Platform.OS === 'web') window.alert(data.message);
            }
        } catch (err) {
            console.error(`Action ${actionType} error:`, err);
            if (Platform.OS === 'web') window.alert('Action failed.');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading || !request) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: request.cancellationRequested ? '#fee2e2' : request.status === 'Approved' ? '#dcfce7' : request.status === 'Rejected' ? '#fee2e2' : Colors.primaryContainer }]}>
                    <MaterialIcons 
                        name={request.cancellationRequested ? 'warning' : request.status === 'Approved' ? 'check-circle' : request.status === 'Rejected' ? 'cancel' : 'info'} 
                        size={24} 
                        color={request.cancellationRequested ? '#dc2626' : request.status === 'Approved' ? '#16a34a' : request.status === 'Rejected' ? '#dc2626' : Colors.onPrimaryContainer} 
                    />
                    <Text style={[styles.statusBannerText, { color: request.cancellationRequested ? '#dc2626' : request.status === 'Approved' ? '#16a34a' : request.status === 'Rejected' ? '#dc2626' : Colors.onPrimaryContainer }]}>
                        Current Status: {request.cancellationRequested ? 'Cancellation Pending Approval' : request.status}
                    </Text>
                </View>

                {/* Details Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Request Information</Text>
                    
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Student Name</Text>
                        <Text style={styles.detailValue}>{request.studentId?.firstName} {request.studentId?.lastName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Student Email</Text>
                        <Text style={styles.detailValue}>{request.studentId?.email}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Room Requested</Text>
                        <Text style={styles.detailValue}>Room {request.roomId?.roomNumber}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Duration of stay</Text>
                        <Text style={styles.detailValue}>{request.durationInMonths} months</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Key Money (3x Rent)</Text>
                        <Text style={styles.detailValue}>Rs. {request.keyMoneyAmount?.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Action Section: Pending -> Upload Agreement */}
                {request.status === 'Pending' && (
                    <View style={styles.actionCard}>
                        <Text style={styles.sectionTitle}>Manager Action: Upload Agreement</Text>
                        <Text style={styles.instructionText}>
                            Please generate the tenancy agreement PDF for this student. The agreement should state the Key Money amount (Rs. {request.keyMoneyAmount?.toLocaleString()}).
                        </Text>
                        
                        <View style={styles.uploadArea}>
                            {agreementFile ? (
                                <View style={styles.fileSelected}>
                                    <MaterialIcons name="picture-as-pdf" size={24} color={Colors.error} />
                                    <Text style={styles.fileName} numberOfLines={1}>{agreementFile.name}</Text>
                                    <TouchableOpacity onPress={() => setAgreementFile(null)}>
                                        <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.pickFileBtn} onPress={pickDocument}>
                                    <MaterialIcons name="upload-file" size={20} color={Colors.outline} />
                                    <Text style={styles.pickFileText}>Select Agreement PDF</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity 
                                style={[styles.submitBtn, (!agreementFile || isActionLoading) && { opacity: 0.5 }]}
                                disabled={!agreementFile || isActionLoading}
                                onPress={handleUploadAgreement}
                            >
                                {isActionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send Agreement to Student</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Action Section: ReceiptUploaded -> Verify */}
                {request.status === 'ReceiptUploaded' && (
                    <View style={styles.actionCard}>
                        <Text style={styles.sectionTitle}>Manager Action: Verify Receipt</Text>
                        <Text style={styles.instructionText}>
                            The student has uploaded their signed agreement and key money receipt. Please review the document and verify to confirm their room assignment.
                        </Text>
                        
                        <TouchableOpacity 
                            style={styles.downloadBtn}
                            onPress={() => Linking.openURL(request.studentReceiptUrl)}
                        >
                            <MaterialIcons name="visibility" size={20} color={Colors.primary} />
                            <Text style={styles.downloadBtnText}>View Uploaded PDF</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.rejectBtn, isActionLoading && { opacity: 0.5 }]}
                                disabled={isActionLoading}
                                onPress={() => handleAction('reject')}
                            >
                                <Text style={styles.rejectBtnText}>Reject Request</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.verifyBtn, isActionLoading && { opacity: 0.5 }]}
                                disabled={isActionLoading}
                                onPress={() => handleAction('verify')}
                            >
                                {isActionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Verify & Confirm Room</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Action Section: Cancellation Requested */}
                {request.cancellationRequested && (
                    <View style={styles.actionCard}>
                        <Text style={[styles.sectionTitle, { color: Colors.error }]}>Manager Action: Room Cancellation Request</Text>
                        <Text style={styles.instructionText}>
                            This student has requested to cancel their room assignment. Approving this will free up the room and mark this request as Cancelled.
                        </Text>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.rejectBtn, isActionLoading && { opacity: 0.5 }]}
                                disabled={isActionLoading}
                                onPress={() => handleAction('reject-cancellation')}
                            >
                                <Text style={styles.rejectBtnText}>Reject Cancellation</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.verifyBtn, { backgroundColor: Colors.error }, isActionLoading && { opacity: 0.5 }]}
                                disabled={isActionLoading}
                                onPress={() => handleAction('approve-cancellation')}
                            >
                                {isActionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyBtnText}>Approve & Remove Room</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Global Reject Button (Optional, can be hidden if approved/rejected) */}
                {['Pending', 'AgreementSent'].includes(request.status) && (
                    <TouchableOpacity 
                        style={[styles.globalRejectBtn, isActionLoading && { opacity: 0.5 }]}
                        disabled={isActionLoading}
                        onPress={() => handleAction('reject')}
                    >
                        <MaterialIcons name="cancel" size={20} color={Colors.error} />
                        <Text style={styles.globalRejectText}>Reject Request</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.surface, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topAppBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, height: 60, backgroundColor: Colors.surface },
    appBarBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    topAppTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.onSurface },
    content: { padding: Spacing.four, paddingBottom: 40 },

    statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.four },
    statusBannerText: { fontFamily: Fonts.headlineSemiBold, fontSize: 16 },

    card: { backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.four, borderRadius: Radius.xl, marginBottom: Spacing.four, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    sectionTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface, marginBottom: Spacing.three },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainer },
    detailLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },
    detailValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },

    actionCard: { backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.four, borderRadius: Radius.xl, marginBottom: Spacing.four, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    instructionText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22, marginBottom: Spacing.four },

    uploadArea: { borderTopWidth: 1, borderTopColor: Colors.surfaceContainer, paddingTop: Spacing.four },
    pickFileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: Colors.outline, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.four, marginBottom: Spacing.three },
    pickFileText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.outline },
    
    fileSelected: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest, padding: Spacing.three, borderRadius: Radius.lg, marginBottom: Spacing.three },
    fileName: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurface, marginHorizontal: 8 },
    
    submitBtn: { backgroundColor: Colors.primary, padding: Spacing.four, borderRadius: Radius.xl, alignItems: 'center' },
    submitBtnText: { fontFamily: Fonts.headline, fontSize: 16, color: '#fff' },

    downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryFixed, padding: Spacing.three, borderRadius: Radius.lg, alignSelf: 'flex-start', marginBottom: Spacing.four },
    downloadBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },

    buttonRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: Colors.surfaceContainer, paddingTop: Spacing.four },
    rejectBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.xl, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center' },
    rejectBtnText: { fontFamily: Fonts.headline, fontSize: 15, color: Colors.onSurfaceVariant },
    verifyBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.xl, backgroundColor: '#16a34a', alignItems: 'center' },
    verifyBtnText: { fontFamily: Fonts.headline, fontSize: 15, color: '#fff' },

    globalRejectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: Spacing.three, marginTop: Spacing.two },
    globalRejectText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.error },
});
