import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
    Linking,
    SafeAreaView,
    Modal,
    Platform,
    StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { PAYMENTS_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const STATUS_UI = {
    Pending: { bg: '#FFF3E0', text: '#E65100', dot: '#FFB74D' },
    Approved: { bg: '#E8F5E9', text: '#1B5E20', dot: '#81C784' },
    Rejected: { bg: '#FFEBEE', text: '#B71C1C', dot: '#E57373' },
};

export default function PaymentDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [payment, setPayment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    
    // Modal state for rejection
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectNote, setRejectNote] = useState('');

    // Custom Alert Modal state
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'default', // 'default', 'success', 'error', 'warning'
        confirmText: 'OK',
        cancelText: '',
        onConfirm: null,
        onCancel: null
    });

    const showAlert = (title, message, type = 'default', confirmText = 'OK', onConfirm = null, cancelText = '', onCancel = null) => {
        setAlertConfig({ visible: true, title, message, type, confirmText, cancelText, onConfirm, onCancel });
    };

    const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

    useEffect(() => {
        if (id) fetchPaymentDetail();
    }, [id]);

    const fetchPaymentDetail = async () => {
        try {
            setIsLoading(true);
            setError('');

            const token = await getItem('userToken');
            const response = await fetch(`${PAYMENTS_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();
            if (!response.ok) {
                setError(data.message || 'Failed to fetch payment details.');
                return;
            }
            setPayment(data.payment);
        } catch (err) {
            console.error('fetchPaymentDetail error:', err);
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const confirmApprove = () => {
        showAlert(
            "Approve Payment",
            "Are you sure you want to approve this payment?",
            "default",
            "Approve",
            () => submitStatusUpdate('Approved'),
            "Cancel",
            null
        );
    };

    const handleRejectSubmit = () => {
        if (rejectNote.trim().length === 0) {
            showAlert(
                "Note Required",
                "A rejection note is highly recommended, but you can continue without one.",
                "warning",
                "Continue",
                () => {
                    setShowRejectModal(false);
                    submitStatusUpdate('Rejected');
                },
                "Cancel",
                null
            );
        } else {
            setShowRejectModal(false);
            submitStatusUpdate('Rejected');
        }
    };

    const submitStatusUpdate = async (status) => {
        try {
            setIsProcessing(true);

            const token = await getItem('userToken');
            const body = { status };
            if (status === 'Rejected' && rejectNote.trim()) {
                body.note = rejectNote.trim();
            }

            const response = await fetch(`${PAYMENTS_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                showAlert('Error', data.message || 'Failed to update payment.', 'error');
                return;
            }

            showAlert(
                'Success',
                `Payment ${status.toLowerCase()} successfully.`,
                'success',
                'OK',
                () => router.back()
            );
        } catch (err) {
            console.error('submitStatusUpdate error:', err);
            showAlert('Error', 'Network error. Please try again.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const isPdf = (url) => {
        return url && (url.toLowerCase().endsWith('.pdf') || url.includes('/raw/'));
    };

    const handleViewReceipt = (url) => {
        if (isPdf(url)) {
            Linking.openURL(url);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error || !payment) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.centerContainer}>
                    <MaterialIcons name="error-outline" size={48} color={Colors.error} />
                    <Text style={[styles.errorText, {marginTop: Spacing.two}]}>{error || 'Not Found'}</Text>
                    <TouchableOpacity onPress={fetchPaymentDetail} style={{ marginTop: Spacing.four }}>
                        <Text style={{ fontFamily: Fonts.bodySemiBold, color: Colors.primary }}>Tap to retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const uiConfig = STATUS_UI[payment.status] || STATUS_UI.Pending;
    const studentName = payment.studentId ? `${payment.studentId.firstName} ${payment.studentId.lastName}` : 'Unknown Student';
    const stID = payment.studentId?.split?.('-')?.[1] || Math.floor(Math.random() * 9000); 

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top App Bar */}
            <View style={styles.topAppBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.appBarBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.appBarTitle}>Payment Approval</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.headerSection}>
                    <Text style={styles.pageTitle}>Payment Details</Text>
                    <Text style={styles.pageSubtitle}>Review the transaction details and receipt for verification.</Text>
                </View>

                {/* Resident Block */}
                <View style={styles.card}>
                    <View style={styles.studentHeader}>
                        <View style={styles.avatarWrap}>
                            <MaterialIcons name="person" size={28} color={Colors.primary} />
                        </View>
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentLabel}>RESIDENT</Text>
                            <Text style={styles.studentName}>{studentName}</Text>
                        </View>
                    </View>
                    <View style={styles.studentDetails}>
                        <View style={styles.studentDetailRow}>
                            <MaterialIcons name="email" size={16} color={Colors.onSurfaceVariant} />
                            <Text style={styles.studentDetailText}>{payment.studentId?.email || 'N/A'}</Text>
                        </View>
                        <View style={styles.studentDetailRow}>
                            <MaterialIcons name="business" size={16} color={Colors.onSurfaceVariant} />
                            <Text style={styles.studentDetailText}>ID: STU-{stID}</Text>
                        </View>
                    </View>
                </View>

                {/* Amount Block */}
                <View style={styles.card}>
                    <View style={styles.amountHeader}>
                        <View>
                            <Text style={styles.amountLabel}>TOTAL AMOUNT</Text>
                            <Text style={styles.amountValue}>LKR {parseFloat(payment.amount).toLocaleString()}</Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: uiConfig.bg }]}>
                            <Text style={[styles.statusText, { color: uiConfig.text }]}>{payment.status.toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.transactionList}>
                        <View style={styles.transRow}>
                            <Text style={styles.transLabel}>Payment Type</Text>
                            <Text style={styles.transValue}>{payment.paymentType?.name || 'Standard'}</Text>
                        </View>
                        <View style={styles.transRow}>
                            <Text style={styles.transLabel}>Date Submitted</Text>
                            <Text style={styles.transValue}>{new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                        </View>
                        <View style={styles.transRow}>
                            <Text style={styles.transLabel}>Reference ID</Text>
                            <Text style={styles.transValue}>TXN-{payment._id.slice(-6).toUpperCase()}</Text>
                        </View>
                    </View>
                </View>

                {/* Receipt Preview */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Receipt Preview</Text>
                    {isPdf(payment.receipt) && (
                        <TouchableOpacity onPress={() => handleViewReceipt(payment.receipt)} style={styles.fullScreenBtn}>
                            <MaterialIcons name="open-in-new" size={16} color={Colors.primary} />
                            <Text style={styles.fullScreenText}>Open PDF</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.receiptContainer}>
                    {isPdf(payment.receipt) ? (
                        <View style={styles.pdfPlaceholder}>
                            <MaterialIcons name="picture-as-pdf" size={48} color={Colors.error} />
                            <Text style={styles.pdfPlaceholderText}>PDF Document</Text>
                        </View>
                    ) : (
                        <Image source={{ uri: payment.receipt }} style={styles.receiptImage} resizeMode="cover" />
                    )}
                </View>

                {/* If rejected and has note, display it here */}
                {payment.status === 'Rejected' && payment.note && (
                    <View style={[styles.card, { marginTop: Spacing.four, backgroundColor: '#FEF2F2' }]}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8}}>
                             <MaterialIcons name="info" size={20} color={Colors.error} />
                             <Text style={{ fontFamily: Fonts.headlineSemiBold, fontSize: 16, color: Colors.error}}>Rejection Note</Text>
                        </View>
                        <Text style={{ fontFamily: Fonts.bodyMedium, color: Colors.onSurface, fontSize: 14 }}>{payment.note}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Actions if Pending */}
            {payment.status === 'Pending' && (
                <View style={styles.bottomTray}>
                    <TouchableOpacity style={styles.btnReject} onPress={() => setShowRejectModal(true)} disabled={isProcessing}>
                        <MaterialIcons name="cancel" size={20} color={Colors.error} />
                        <Text style={styles.btnRejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btnApprove} onPress={confirmApprove} disabled={isProcessing}>
                        <MaterialIcons name="check-circle" size={20} color={Colors.onPrimary} />
                        <Text style={styles.btnApproveText}>Approve Payment</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Rejection Modal */}
            <Modal visible={showRejectModal} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowRejectModal(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        <View style={styles.modalDrag} />
                        <Text style={styles.modalTitle}>Reject Payment</Text>
                        <Text style={styles.modalSub}>Optionally provide a reason for rejecting this payment to notify the resident.</Text>
                        
                        <TextInput
                            style={styles.textArea}
                            placeholder="Add reason (optional)..."
                            placeholderTextColor={Colors.outline}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={rejectNote}
                            onChangeText={setRejectNote}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowRejectModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSubmit} onPress={handleRejectSubmit}>
                                <Text style={styles.modalSubmitText}>Confirm Rejection</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Custom Alert Modal */}
            <Modal visible={alertConfig.visible} transparent animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={styles.alertContent}>
                        {alertConfig.type === 'success' && <MaterialIcons name="check-circle" size={48} color={Colors.primary} style={styles.alertIcon} />}
                        {alertConfig.type === 'error' && <MaterialIcons name="error" size={48} color={Colors.error} style={styles.alertIcon} />}
                        {alertConfig.type === 'warning' && <MaterialIcons name="warning" size={48} color="#B71C1C" style={styles.alertIcon} />}
                        
                        <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                        <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                        
                        <View style={styles.alertActions}>
                            {!!alertConfig.cancelText && (
                                <TouchableOpacity 
                                    style={styles.alertCancelBtn} 
                                    onPress={() => {
                                        closeAlert();
                                        if(alertConfig.onCancel) alertConfig.onCancel();
                                    }}
                                >
                                    <Text style={styles.alertCancelText}>{alertConfig.cancelText}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                                style={[styles.alertConfirmBtn, alertConfig.type === 'warning' || alertConfig.type === 'error' ? { backgroundColor: Colors.error } : null]} 
                                onPress={() => {
                                    const cb = alertConfig.onConfirm;
                                    closeAlert();
                                    if (cb) setTimeout(cb, 300);
                                }}
                            >
                                <Text style={styles.alertConfirmText}>{alertConfig.confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.surface, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurfaceVariant },
    
    topAppBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.four,
        zIndex: 10,
        backgroundColor: Colors.surface,
    },
    appBarBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    appBarTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 18, color: Colors.onSurface },

    scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: 140 },

    headerSection: { marginBottom: Spacing.five },
    pageTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.onSurface, marginBottom: Spacing.two },
    pageSubtitle: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22 },

    card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius['2xl'], padding: Spacing.five, shadowColor: '#191b23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, elevation: 2, marginBottom: Spacing.four },
    
    studentHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four, marginBottom: Spacing.four },
    avatarWrap: { width: 52, height: 52, backgroundColor: Colors.primaryContainer, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
    studentLabel: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    studentName: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface },
    
    studentDetails: { gap: Spacing.two },
    studentDetailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
    studentDetailText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },

    amountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.four },
    amountLabel: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    amountValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.primary },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md },
    statusText: { fontFamily: Fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },

    separator: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginBottom: Spacing.four },

    transactionList: { gap: Spacing.three },
    transRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    transLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },
    transValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.four, marginTop: Spacing.two },
    sectionTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface },
    fullScreenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    fullScreenText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },

    receiptContainer: { width: '100%', height: 420, backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius['2xl'], overflow: 'hidden' },
    receiptImage: { width: '100%', height: '100%' },
    pdfPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pdfPlaceholderText: { fontFamily: Fonts.bodySemiBold, color: Colors.onSurfaceVariant, marginTop: Spacing.two },

    bottomTray: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.surfaceContainerLowest, paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: 36, flexDirection: 'row', gap: Spacing.three, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, elevation: 15, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'] },
    btnReject: { flex: 0.8, flexDirection: 'row', backgroundColor: '#FEF2F2', paddingVertical: 16, borderRadius: Radius.xl, justifyContent: 'center', alignItems: 'center', gap: 8 },
    btnRejectText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.error },
    btnApprove: { flex: 1.2, flexDirection: 'row', backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: Radius.xl, justifyContent: 'center', alignItems: 'center', gap: 8 },
    btnApproveText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onPrimary },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.surfaceContainerLowest, paddingHorizontal: Spacing.five, paddingTop: Spacing.four, paddingBottom: 40, borderTopLeftRadius: Radius['3xl'], borderTopRightRadius: Radius['3xl'] },
    modalDrag: { width: 40, height: 4, backgroundColor: Colors.outlineVariant, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.four },
    modalTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: Spacing.two },
    modalSub: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: Spacing.four, lineHeight: 22 },
    textArea: { backgroundColor: Colors.surfaceContainerLowest, borderWidth: 1, borderColor: Colors.outlineVariant, borderRadius: Radius.xl, padding: Spacing.four, fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurface, minHeight: 120, marginBottom: Spacing.five },
    modalActions: { flexDirection: 'row', gap: Spacing.three },
    modalCancel: { flex: 1, paddingVertical: 16, borderRadius: Radius.xl, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center' },
    modalCancelText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onSurfaceVariant },
    modalSubmit: { flex: 1.5, paddingVertical: 16, borderRadius: Radius.xl, backgroundColor: Colors.error, alignItems: 'center' },
    modalSubmitText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onError },

    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
    alertContent: { width: '100%', backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius['2xl'], padding: Spacing.five, alignItems: 'center' },
    alertIcon: { marginBottom: Spacing.four },
    alertTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: Spacing.two, textAlign: 'center' },
    alertMessage: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, textAlign: 'center', marginBottom: Spacing.five, lineHeight: 22 },
    alertActions: { flexDirection: 'row', gap: Spacing.three, width: '100%' },
    alertCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.xl, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center' },
    alertCancelText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onSurfaceVariant },
    alertConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: Radius.xl, backgroundColor: Colors.primary, alignItems: 'center' },
    alertConfirmText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onPrimary },
});
