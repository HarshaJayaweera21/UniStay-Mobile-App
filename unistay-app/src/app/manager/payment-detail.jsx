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
import { PAYMENTS_URL, API_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';

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
    const [showFullPdf, setShowFullPdf] = useState(false);
    const [authToken, setAuthToken] = useState('');

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

    useEffect(() => {
        (async () => {
            const token = await getItem('userToken');
            if (token) setAuthToken(token);
        })();
    }, []);

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

    // Build the proxy URL for the receipt
    const receiptProxyUrl = id ? `${API_URL}/api/payments/${id}/receipt` : '';

    // PDF.js viewer HTML — fetches via backend proxy with auth header
    const buildPdfViewerHtml = (bgColor = '#f5f5f5') => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${bgColor}; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
    #loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #666; font-family: -apple-system, sans-serif; }
    #loading .spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #4361ee; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #loading p { margin-top: 16px; font-size: 14px; }
    #error { display: none; text-align: center; padding: 40px 20px; color: #B71C1C; font-family: -apple-system, sans-serif; }
    #error h3 { margin-bottom: 8px; }
    canvas { max-width: 100%; display: block; margin: 8px auto; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <div id="loading"><div class="spinner"></div><p>Loading receipt...</p></div>
  <div id="error"><h3>Unable to load PDF</h3><p id="errorMsg"></p></div>
  <div id="pages"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    async function loadPdf() {
      try {
        const resp = await fetch('${receiptProxyUrl}', {
          headers: { 'Authorization': 'Bearer ${authToken}' }
        });
        if (!resp.ok) throw new Error('Server returned ' + resp.status);
        const buf = await resp.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        document.getElementById('loading').style.display = 'none';
        const container = document.getElementById('pages');
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const vp = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = vp.width;
          canvas.height = vp.height;
          container.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        }
      } catch (e) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('errorMsg').textContent = e.message;
      }
    }
    loadPdf();
  </script>
</body>
</html>`;

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
    const studentUsername = payment.studentId?.username || 'N/A';

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
                            <Text style={styles.studentDetailText}>@{studentUsername}</Text>
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
                        {payment.status !== 'Pending' && payment.reviewedBy && (
                            <>
                                <View style={styles.transRow}>
                                    <Text style={styles.transLabel}>Reviewed By</Text>
                                    <Text style={styles.transValue}>{payment.reviewedBy.firstName} {payment.reviewedBy.lastName}</Text>
                                </View>
                                <View style={styles.transRow}>
                                    <Text style={styles.transLabel}>Reviewed On</Text>
                                    <Text style={styles.transValue}>{new Date(payment.reviewedAt || payment.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Receipt Preview */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Receipt Preview</Text>
                    {isPdf(payment.receipt) && (
                        <TouchableOpacity onPress={() => setShowFullPdf(true)} style={styles.fullScreenBtn}>
                            <MaterialIcons name="fullscreen" size={18} color={Colors.primary} />
                            <Text style={styles.fullScreenText}>Full Screen</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.receiptContainer}>
                    {isPdf(payment.receipt) ? (
                        authToken ? (
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: buildPdfViewerHtml(Colors.surfaceContainerHighest) }}
                                style={{ flex: 1 }}
                                javaScriptEnabled={true}
                                startInLoadingState={true}
                                renderLoading={() => (
                                    <View style={styles.pdfLoading}>
                                        <ActivityIndicator size="large" color={Colors.primary} />
                                        <Text style={styles.pdfLoadingText}>Loading document...</Text>
                                    </View>
                                )}
                            />
                        ) : (
                            <View style={styles.pdfLoading}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                            </View>
                        )
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

            {/* Full-Screen PDF Modal */}
            <Modal visible={showFullPdf} animationType="slide">
                <SafeAreaView style={[styles.safeArea, { backgroundColor: '#1a1a2e' }]}>
                    <View style={styles.pdfModalHeader}>
                        <TouchableOpacity onPress={() => setShowFullPdf(false)} style={styles.pdfModalClose}>
                            <MaterialIcons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.pdfModalTitle}>Receipt Document</Text>
                        <TouchableOpacity onPress={() => Linking.openURL(payment.receipt)} style={styles.pdfModalClose}>
                            <MaterialIcons name="open-in-new" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {authToken ? (
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: buildPdfViewerHtml('#1a1a2e') }}
                            style={{ flex: 1 }}
                            javaScriptEnabled={true}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.pdfLoading}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={[styles.pdfLoadingText, { color: '#ccc' }]}>Loading document...</Text>
                                </View>
                            )}
                        />
                    ) : (
                        <View style={styles.pdfLoading}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    )}
                </SafeAreaView>
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
    pdfLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest },
    pdfLoadingText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: Spacing.two },

    pdfModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, backgroundColor: '#1a1a2e' },
    pdfModalClose: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    pdfModalTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 16, color: '#fff' },

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
