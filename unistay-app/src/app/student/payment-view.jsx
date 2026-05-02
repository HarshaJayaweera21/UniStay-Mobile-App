import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    ActivityIndicator, TextInput, Linking, SafeAreaView, Modal,
    Platform, StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { PAYMENTS_URL, PAYMENT_TYPES_URL, API_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const STATUS_UI = {
    Pending: { bg: '#FFF3E0', text: '#E65100', dot: '#FFB74D', icon: 'schedule' },
    Approved: { bg: '#E8F5E9', text: '#1B5E20', dot: '#81C784', icon: 'check-circle' },
    Rejected: { bg: '#FFEBEE', text: '#B71C1C', dot: '#E57373', icon: 'cancel' },
};

export default function PaymentView() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [payment, setPayment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [authToken, setAuthToken] = useState('');

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editAmount, setEditAmount] = useState('');
    const [editType, setEditType] = useState(null);
    const [newFile, setNewFile] = useState(null);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [showFullPdf, setShowFullPdf] = useState(false);

    // File picker modal
    const [showFilePickerModal, setShowFilePickerModal] = useState(false);

    // Custom Alert Modal
    const [alertConfig, setAlertConfig] = useState({
        visible: false, title: '', message: '', type: 'info',
        onConfirm: null, confirmText: 'OK', showCancel: false,
    });

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm, confirmText: 'OK', showCancel: false });
    };

    const closeAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const ALERT_ICONS = {
        info: { name: 'info', color: Colors.primary },
        success: { name: 'check-circle', color: '#1B5E20' },
        error: { name: 'error', color: Colors.error },
        warning: { name: 'warning', color: '#E65100' },
    };

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
            const token = await getItem('userToken');
            const res = await fetch(`${PAYMENTS_URL}/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Failed to fetch details.'); return; }
            setPayment(data.payment);
            setEditAmount(data.payment.amount.toString());
        } catch (err) {
            setError('Network error.');
        } finally { setIsLoading(false); }
    };

    const fetchPaymentTypes = async () => {
        try {
            const token = await getItem('userToken');
            const res = await fetch(PAYMENT_TYPES_URL, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setPaymentTypes(data.paymentTypes || []);
        } catch (err) {
            console.error('Failed to load types', err);
        }
    };

    const enterEditMode = () => {
        fetchPaymentTypes();
        setEditAmount(payment.amount.toString());
        setEditType(payment.paymentType);
        setNewFile(null);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditAmount(payment.amount.toString());
        setEditType(null);
        setNewFile(null);
    };

    const pickImage = async () => {
        setShowFilePickerModal(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            setNewFile({ uri: asset.uri, name: asset.fileName || 'receipt.jpg', type: asset.mimeType || 'image/jpeg' });
        }
    };

    const pickDocument = async () => {
        setShowFilePickerModal(false);
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            setNewFile({ uri: asset.uri, name: asset.name || 'receipt.pdf', type: asset.mimeType || 'application/pdf' });
        }
    };

    const handleResubmit = async () => {
        const parsed = parseFloat(editAmount);
        if (isNaN(parsed) || parsed <= 0) {
            showAlert('Invalid Amount', 'Amount must be greater than 0.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = await getItem('userToken');
            const formData = new FormData();
            const typeId = editType?._id || payment.paymentType?._id;
            if (typeId) formData.append('paymentType', typeId);
            formData.append('amount', parsed.toString());
            if (newFile) {
                formData.append('receipt', { uri: newFile.uri, name: newFile.name, type: newFile.type });
            }

            const res = await fetch(`${PAYMENTS_URL}/${id}/resubmit`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) { showAlert('Resubmit Failed', data.message || 'Failed.', 'error'); return; }
            showAlert('Success', 'Payment resubmitted for review.', 'success', () => {
                setPayment(data.payment);
                setIsEditing(false);
                setNewFile(null);
            });
        } catch (err) {
            showAlert('Network Error', 'Please check your connection.', 'error');
        } finally { setIsSubmitting(false); }
    };

    const handleCancelPayment = () => {
        setAlertConfig({
            visible: true,
            title: 'Cancel Payment?',
            message: 'Are you sure you want to cancel and delete this payment request? This action cannot be undone.',
            type: 'warning',
            confirmText: 'Yes, Cancel',
            showCancel: true,
            onConfirm: async () => {
                setIsDeleting(true);
                try {
                    const token = await getItem('userToken');
                    const res = await fetch(`${PAYMENTS_URL}/${id}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const data = await res.json();
                    
                    if (!res.ok) { 
                        setIsDeleting(false);
                        setTimeout(() => showAlert('Cancel Failed', data.message || 'Failed.', 'error'), 400);
                        return; 
                    }
                    
                    setTimeout(() => showAlert('Success', 'Payment canceled successfully.', 'success', () => {
                        router.back();
                    }), 400);
                } catch (err) {
                    setIsDeleting(false);
                    setTimeout(() => showAlert('Network Error', 'Please check your connection.', 'error'), 400);
                }
            }
        });
    };

    const isPdf = (url) => url && (url.toLowerCase().endsWith('.pdf') || url.includes('/raw/'));

    const receiptProxyUrl = id ? `${API_URL}/api/payments/${id}/receipt` : '';

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

    const canEdit = payment && (payment.status === 'Pending' || payment.status === 'Rejected');

    // --- RENDER ---

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
                    <Text style={styles.errorText}>{error || 'Payment not found.'}</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const uiConfig = STATUS_UI[payment.status] || STATUS_UI.Pending;
    const displayType = isEditing && editType ? editType.name : (payment.paymentType?.name || 'Standard');
    const displayAmount = isEditing ? editAmount : payment.amount.toString();

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top App Bar */}
            <View style={styles.topAppBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.appBarBtn}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.appBarTitle}>Payment Details</Text>
                {canEdit && !isEditing ? (
                    <TouchableOpacity onPress={enterEditMode} style={styles.appBarBtn}>
                        <MaterialIcons name="edit" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                ) : isEditing ? (
                    <TouchableOpacity onPress={cancelEdit} style={styles.appBarBtn}>
                        <MaterialIcons name="close" size={24} color={Colors.error} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <Text style={styles.pageTitle}>
                        {payment.status === 'Approved' ? 'Payment Confirmed' :
                         payment.status === 'Rejected' ? 'Payment Rejected' : 'Pending Review'}
                    </Text>
                    <Text style={styles.pageSubtitle}>
                        {payment.status === 'Approved' ? 'This payment has been verified and approved by a manager.' :
                         payment.status === 'Rejected' ? 'This payment was rejected. You can edit and resubmit below.' :
                         'Your payment is currently under review.'}
                    </Text>
                </View>

                {/* Rejection Note Banner */}
                {payment.status === 'Rejected' && !!payment.note && (
                    <View style={styles.rejectionBanner}>
                        <View style={styles.rejectionHeader}>
                            <MaterialIcons name="info" size={20} color={Colors.error} />
                            <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                        </View>
                        <Text style={styles.rejectionNote}>{payment.note}</Text>
                    </View>
                )}

                {/* Status + Amount Card */}
                <View style={styles.card}>
                    <View style={styles.amountHeader}>
                        <View>
                            <Text style={styles.amountLabel}>TOTAL AMOUNT</Text>
                            {isEditing ? (
                                <View style={styles.editAmountRow}>
                                    <Text style={styles.currencyPrefix}>LKR</Text>
                                    <TextInput
                                        style={styles.editAmountInput}
                                        value={editAmount}
                                        onChangeText={setEditAmount}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        placeholderTextColor={Colors.outline}
                                    />
                                </View>
                            ) : (
                                <Text style={styles.amountValue}>LKR {parseFloat(payment.amount).toLocaleString()}</Text>
                            )}
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: uiConfig.bg }]}>
                            <MaterialIcons name={uiConfig.icon} size={14} color={uiConfig.text} />
                            <Text style={[styles.statusText, { color: uiConfig.text }]}>{payment.status.toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.transactionList}>
                        <View style={styles.transRow}>
                            <Text style={styles.transLabel}>Payment Type</Text>
                            {isEditing ? (
                                <TouchableOpacity onPress={() => setShowTypePicker(true)} style={styles.editTypeBtn}>
                                    <Text style={styles.editTypeText}>{displayType}</Text>
                                    <MaterialIcons name="expand-more" size={18} color={Colors.primary} />
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.transValue}>{displayType}</Text>
                            )}
                        </View>
                        <View style={styles.transRow}>
                            <Text style={styles.transLabel}>Date Submitted</Text>
                            <Text style={styles.transValue}>
                                {new Date(payment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </View>
                        <View style={styles.transRow}>
                            <Text style={styles.transLabel}>Transaction ID</Text>
                            <Text style={[styles.transValue, { fontSize: 12, fontFamily: Fonts.bodyMedium }]}>
                                TXN-{payment._id.slice(-6).toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Receipt Preview */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Receipt</Text>
                    {isEditing && (
                        <TouchableOpacity onPress={() => setShowFilePickerModal(true)} style={styles.changeReceiptBtn}>
                            <MaterialIcons name="swap-horiz" size={16} color={Colors.primary} />
                            <Text style={styles.changeReceiptText}>Change</Text>
                        </TouchableOpacity>
                    )}
                    {!isEditing && isPdf(payment.receipt) && (
                        <TouchableOpacity onPress={() => setShowFullPdf(true)} style={styles.changeReceiptBtn}>
                            <MaterialIcons name="fullscreen" size={18} color={Colors.primary} />
                            <Text style={styles.changeReceiptText}>Full Screen</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {newFile ? (
                    <View style={styles.newFilePreview}>
                        <MaterialIcons name="insert-drive-file" size={32} color={Colors.primary} />
                        <Text style={styles.newFileName} numberOfLines={1}>{newFile.name}</Text>
                        <TouchableOpacity onPress={() => setNewFile(null)}>
                            <MaterialIcons name="close" size={22} color={Colors.error} />
                        </TouchableOpacity>
                    </View>
                ) : (
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
                )}

            </ScrollView>

            {/* Bottom Action Tray — Only for editable statuses */}
            {canEdit && (
                <View style={styles.bottomTray}>
                    {isEditing ? (
                        <>
                            <TouchableOpacity style={styles.btnCancel} onPress={cancelEdit} disabled={isSubmitting}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnResubmit} onPress={handleResubmit} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <ActivityIndicator color={Colors.onPrimary} size="small" />
                                ) : (
                                    <>
                                        <MaterialIcons name="send" size={18} color={Colors.onPrimary} />
                                        <Text style={styles.btnResubmitText}>Resubmit</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            {payment.status === 'Pending' ? (
                                <View style={{ flexDirection: 'row', gap: Spacing.three, flex: 1 }}>
                                    <TouchableOpacity style={styles.btnCancelPending} onPress={handleCancelPayment} disabled={isDeleting}>
                                        {isDeleting ? (
                                            <ActivityIndicator color={Colors.error} size="small" />
                                        ) : (
                                            <Text style={styles.btnCancelPendingText}>Cancel Request</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.btnEditFlex} onPress={enterEditMode} disabled={isDeleting}>
                                        <MaterialIcons name="edit" size={18} color={Colors.onPrimary} />
                                        <Text style={styles.btnResubmitText}>Edit</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity style={styles.btnEditFull} onPress={enterEditMode}>
                                    <MaterialIcons name="edit" size={18} color={Colors.onPrimary} />
                                    <Text style={styles.btnResubmitText}>Edit & Resubmit</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}

            {/* Payment Type Picker Modal */}
            <Modal visible={showTypePicker} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTypePicker(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        <View style={styles.modalDrag} />
                        <Text style={styles.modalTitle}>Select Payment Type</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {paymentTypes.map((t) => (
                                <TouchableOpacity key={t._id}
                                    style={[styles.typeOption, (editType?._id || payment.paymentType?._id) === t._id && styles.typeOptionActive]}
                                    onPress={() => { setEditType(t); setShowTypePicker(false); }}>
                                    <Text style={[styles.typeOptionText, (editType?._id || payment.paymentType?._id) === t._id && styles.typeOptionTextActive]}>
                                        {t.name}
                                    </Text>
                                    {(editType?._id || payment.paymentType?._id) === t._id && (
                                        <MaterialIcons name="check" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* File Picker Modal */}
            <Modal visible={showFilePickerModal} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilePickerModal(false)}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        <View style={styles.modalDrag} />
                        <Text style={styles.modalTitle}>Replace Receipt</Text>
                        <Text style={styles.modalSub}>Choose a new receipt file to upload.</Text>
                        <View style={{ gap: Spacing.three, marginTop: Spacing.four }}>
                            <TouchableOpacity style={styles.fileOptionBtn} onPress={pickImage}>
                                <View style={[styles.fileOptionIcon, { backgroundColor: '#E3F2FD' }]}>
                                    <MaterialIcons name="photo-library" size={24} color="#1565C0" />
                                </View>
                                <View>
                                    <Text style={styles.fileOptionTitle}>Photo Gallery</Text>
                                    <Text style={styles.fileOptionSub}>JPG, PNG up to 5MB</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.fileOptionBtn} onPress={pickDocument}>
                                <View style={[styles.fileOptionIcon, { backgroundColor: '#FDE0DC' }]}>
                                    <MaterialIcons name="picture-as-pdf" size={24} color="#C62828" />
                                </View>
                                <View>
                                    <Text style={styles.fileOptionTitle}>PDF Document</Text>
                                    <Text style={styles.fileOptionSub}>PDF up to 5MB</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
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

            {/* Custom Alert Modal */}
            <Modal visible={alertConfig.visible} transparent animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={styles.alertBox}>
                        <View style={styles.alertIconWrap}>
                            <MaterialIcons
                                name={ALERT_ICONS[alertConfig.type]?.name || 'info'}
                                size={36}
                                color={ALERT_ICONS[alertConfig.type]?.color || Colors.primary}
                            />
                        </View>
                        <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                        <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                        <View style={{ flexDirection: 'row', gap: Spacing.three, width: '100%' }}>
                            {alertConfig.showCancel && (
                                <TouchableOpacity
                                    style={[styles.alertBtn, { flex: 1, backgroundColor: Colors.surfaceContainerHigh }]}
                                    onPress={closeAlert}
                                >
                                    <Text style={[styles.alertBtnText, { color: Colors.onSurface }]}>Go Back</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.alertBtn, { flex: 1, backgroundColor: ALERT_ICONS[alertConfig.type]?.color || Colors.primary }]}
                                onPress={() => {
                                    const cb = alertConfig.onConfirm;
                                    closeAlert();
                                    if (cb) setTimeout(cb, 300);
                                }}
                            >
                                <Text style={styles.alertBtnText}>{alertConfig.confirmText}</Text>
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
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.five },
    errorText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurfaceVariant, marginTop: Spacing.three, textAlign: 'center' },
    retryBtn: { marginTop: Spacing.four, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: Radius.xl },
    retryText: { fontFamily: Fonts.bodySemiBold, color: Colors.onPrimary, fontSize: 14 },

    topAppBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.four, paddingVertical: Spacing.four,
        zIndex: 10, backgroundColor: Colors.surface,
    },
    appBarBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    appBarTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 18, color: Colors.onSurface },

    scrollContent: { paddingHorizontal: Spacing.four, paddingBottom: 140 },

    headerSection: { marginBottom: Spacing.five },
    pageTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: Colors.onSurface, marginBottom: Spacing.two },
    pageSubtitle: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 22 },

    // Rejection Banner
    rejectionBanner: {
        backgroundColor: '#FEF2F2', borderRadius: Radius.xl, padding: Spacing.four,
        marginBottom: Spacing.five, borderWidth: 1, borderColor: '#FECACA',
    },
    rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    rejectionTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 16, color: Colors.error },
    rejectionNote: { fontFamily: Fonts.bodyMedium, color: '#7F1D1D', fontSize: 14, lineHeight: 22 },

    // Card
    card: {
        backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius['2xl'],
        padding: Spacing.five, marginBottom: Spacing.five,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, elevation: 3,
    },
    amountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.four },
    amountLabel: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.outline, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    amountValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 32, color: Colors.primary },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md },
    statusText: { fontFamily: Fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },

    editAmountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    currencyPrefix: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.primary },
    editAmountInput: {
        fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: Colors.primary,
        borderBottomWidth: 2, borderBottomColor: Colors.primary, minWidth: 120, paddingVertical: 2,
    },

    separator: { height: 1, backgroundColor: Colors.surfaceContainerHigh, marginBottom: Spacing.four },

    transactionList: { gap: Spacing.three },
    transRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    transLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },
    transValue: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },

    editTypeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryContainer + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md },
    editTypeText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.primary },

    // Receipt
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.four, marginTop: Spacing.two },
    sectionTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface },
    changeReceiptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    changeReceiptText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },

    receiptContainer: { width: '100%', height: 420, backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius['2xl'], overflow: 'hidden' },
    receiptImage: { width: '100%', height: '100%' },
    pdfLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest },
    pdfLoadingText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: Spacing.two },

    newFilePreview: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
        backgroundColor: Colors.primaryContainer + '20', borderRadius: Radius.xl,
        padding: Spacing.four, borderWidth: 1, borderColor: Colors.primary + '40', borderStyle: 'dashed',
    },
    newFileName: { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },

    // PDF Modal
    pdfModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three, backgroundColor: '#1a1a2e' },
    pdfModalClose: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    pdfModalTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 16, color: '#fff' },

    // Bottom Tray
    bottomTray: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.surfaceContainerLowest, paddingHorizontal: Spacing.four,
        paddingTop: Spacing.four, paddingBottom: 36, flexDirection: 'row', gap: Spacing.three,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, elevation: 15,
        borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    },
    btnCancel: {
        flex: 0.4, paddingVertical: 16, borderRadius: Radius.xl, justifyContent: 'center',
        alignItems: 'center', backgroundColor: Colors.surfaceContainerHigh,
    },
    btnCancelText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onSurface },
    btnResubmit: {
        flex: 0.6, flexDirection: 'row', paddingVertical: 16, borderRadius: Radius.xl,
        justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.primary,
    },
    btnResubmitText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.onPrimary },
    btnEditFull: {
        flex: 1, flexDirection: 'row', paddingVertical: 16, borderRadius: Radius.xl,
        justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.primary,
    },
    btnCancelPending: {
        flex: 1, paddingVertical: 16, borderRadius: Radius.xl, justifyContent: 'center',
        alignItems: 'center', backgroundColor: Colors.errorContainer, borderWidth: 1, borderColor: Colors.error + '40',
    },
    btnCancelPendingText: { fontFamily: Fonts.headlineSemiBold, fontSize: 15, color: Colors.error },
    btnEditFlex: {
        flex: 1, flexDirection: 'row', paddingVertical: 16, borderRadius: Radius.xl,
        justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.primary,
    },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: Colors.surfaceContainerLowest, borderTopLeftRadius: Radius['3xl'],
        borderTopRightRadius: Radius['3xl'], padding: Spacing.five, paddingBottom: 40,
        maxHeight: '70%',
    },
    modalDrag: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.outlineVariant, alignSelf: 'center', marginBottom: Spacing.four },
    modalTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: Spacing.two },
    modalSub: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },

    typeOption: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 14, paddingHorizontal: Spacing.four, borderRadius: Radius.lg, marginTop: Spacing.two,
    },
    typeOptionActive: { backgroundColor: Colors.primaryContainer + '30' },
    typeOptionText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurface },
    typeOptionTextActive: { fontFamily: Fonts.headlineSemiBold, color: Colors.primary },

    fileOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12 },
    fileOptionIcon: { width: 48, height: 48, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },
    fileOptionTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 16, color: Colors.onSurface },
    fileOptionSub: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },

    // Alert Modal
    alertOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    alertBox: {
        backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius['2xl'],
        padding: Spacing.five, width: '85%', alignItems: 'center', maxWidth: 340,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, elevation: 20,
    },
    alertIconWrap: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceContainerHighest,
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.four,
    },
    alertTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: Spacing.two, textAlign: 'center' },
    alertMessage: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.five },
    alertBtn: {
        width: '100%', paddingVertical: 14, borderRadius: Radius.xl,
        justifyContent: 'center', alignItems: 'center',
    },
    alertBtnText: { fontFamily: Fonts.headlineSemiBold, fontSize: 16, color: '#fff' },
});
