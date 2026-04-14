import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, Image, ScrollView, Platform, SafeAreaView, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { PAYMENTS_URL, PAYMENT_TYPES_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function UploadPayment() {
    const router = useRouter();
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [showTypePicker, setShowTypePicker] = useState(false);

    // Custom UI States
    const [showFilePickerModal, setShowFilePickerModal] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'info', onConfirm: null });

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setAlertConfig({ visible: true, title, message, type, onConfirm });
    };

    useEffect(() => { fetchPaymentTypes(); }, []);

    const fetchPaymentTypes = async () => {
        try {
            const token = await getItem('userToken');
            const res = await fetch(PAYMENT_TYPES_URL, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setPaymentTypes(data.paymentTypes || []);
        } catch (err) {
            showAlert('Wait a moment', 'Failed to load payment categories.', 'error');
        } finally { setIsLoadingTypes(false); }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
        });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            setFile({ uri: asset.uri, name: asset.fileName || 'receipt.jpg', type: asset.mimeType || 'image/jpeg' });
        }
    };

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            setFile({ uri: asset.uri, name: asset.name || 'receipt.pdf', type: asset.mimeType || 'application/pdf' });
        }
    };

    const handleFileTypeSelection = () => {
        setShowFilePickerModal(true);
    };

    const handleSubmit = async () => {
        if (!selectedType || !amount || !file) {
            showAlert('Missing Information', 'Please fill in all fields and attach a receipt.', 'info');
            return;
        }
        const parsed = parseFloat(amount);
        if (isNaN(parsed) || parsed <= 0) {
            showAlert('Invalid Amount', 'Amount must be a number greater than 0.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const token = await getItem('userToken');
            const formData = new FormData();
            formData.append('paymentType', selectedType._id);
            formData.append('amount', parsed.toString());
            formData.append('receipt', { uri: file.uri, name: file.name, type: file.type });

            const res = await fetch(PAYMENTS_URL, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) { showAlert('Upload Failed', data.message || 'Failed to submit payment.', 'error'); return; }
            showAlert('Success', 'Payment submitted successfully!', 'success', () => router.back());
        } catch (err) {
            showAlert('Network Error', 'Please check your connection and try again.', 'error');
        } finally { setIsLoading(false); }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Top App Bar */}
                <View style={styles.topAppBar}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.appBarBtn}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.topAppTitle}>Upload Payment</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <Text style={styles.pageTitle}>Confirm Your{"\n"}Transaction</Text>
                        <Text style={styles.pageSubtitle}>Submit your payment receipt to confirm your transaction.</Text>
                    </View>

                    {/* Payment Type */}
                    <View style={{ zIndex: 10 }}>
                        <Text style={styles.label}>Payment Category</Text>
                        {isLoadingTypes ? <ActivityIndicator color={Colors.primary} style={{ alignSelf: 'flex-start', marginTop: 10 }} /> : (
                            <View>
                                <TouchableOpacity style={styles.inputContainer} onPress={() => setShowTypePicker(!showTypePicker)}>
                                    <View style={styles.iconWrap}>
                                        <MaterialIcons name="category" size={20} color={Colors.primary} />
                                    </View>
                                    <Text style={selectedType ? styles.pickerText : styles.pickerPlaceholder}>
                                        {selectedType ? selectedType.name : 'Select payment type'}
                                    </Text>
                                    <View style={styles.iconWrapRight}>
                                        <MaterialIcons name={showTypePicker ? 'expand-less' : 'expand-more'} size={24} color={Colors.onSurfaceVariant} />
                                    </View>
                                </TouchableOpacity>

                                {showTypePicker && (
                                    <View style={styles.dropdownList}>
                                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                                            {paymentTypes.map((t) => (
                                                <TouchableOpacity key={t._id} style={[styles.dropdownItem, selectedType?._id === t._id && styles.dropdownItemActive]}
                                                    onPress={() => { setSelectedType(t); setShowTypePicker(false); }}>
                                                    <Text style={[styles.dropdownText, selectedType?._id === t._id && styles.dropdownTextActive]}>{t.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Amount */}
                    <View style={{ marginTop: Spacing.four, zIndex: 1 }}>
                        <Text style={styles.label}>Total Amount Paid</Text>
                        <View style={styles.inputContainer}>
                            <View style={styles.iconWrap}>
                                <MaterialIcons name="payments" size={20} color={Colors.primary} />
                            </View>
                            <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={Colors.outline}
                                keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
                        </View>
                    </View>

                    {/* Receipt Upload */}
                    <View style={{ marginTop: Spacing.four, zIndex: 1 }}>
                        <Text style={styles.label}>Receipt Image or Document</Text>
                        {file ? (
                            <View style={styles.filePreviewContainer}>
                                {file.type?.includes('image') ? (
                                    <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="cover" />
                                ) : (
                                    <View style={styles.pdfPreview}>
                                        <MaterialIcons name="picture-as-pdf" size={48} color={Colors.error} />
                                        <Text style={styles.pdfName} numberOfLines={1}>{file.name}</Text>
                                    </View>
                                )}
                                <TouchableOpacity style={styles.removeFile} onPress={() => setFile(null)}>
                                    <MaterialIcons name="close" size={20} color={Colors.onPrimary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.uploadArea} onPress={handleFileTypeSelection} activeOpacity={0.7}>
                                <View style={styles.uploadIconCircle}>
                                    <MaterialIcons name="cloud-upload" size={32} color={Colors.onPrimary} />
                                </View>
                                <Text style={styles.uploadTitle}>Tap to upload receipt</Text>
                                <Text style={styles.uploadSubtitle}>Supports JPG, PNG, PDF. Max size 5MB.</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoBox}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Processing time</Text>
                            <Text style={styles.infoVal}>24-48 Hours</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Reference ID</Text>
                            <Text style={styles.infoVal}>#TXN-{Math.floor(10000 + Math.random() * 90000)}</Text>
                        </View>
                        <View style={styles.infoDisclaimer}>
                            <MaterialIcons name="info" size={16} color={Colors.tertiary} style={{ marginTop: 1 }} />
                            <Text style={styles.infoDiscText}>By submitting, you agree that all information provided is accurate. Falsification of documents may lead to penalties.</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Sticky Footer Button */}
                <View style={styles.footer}>
                    <TouchableOpacity style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.88}>
                        {isLoading ? <ActivityIndicator color={Colors.onPrimary} /> : (
                            <>
                                <Text style={styles.submitText}>Submit Proof</Text>
                                <MaterialIcons name="send" size={20} color={Colors.onPrimary} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Custom Alert Modal */}
            <Modal transparent visible={alertConfig.visible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.alertBox}>
                        <View style={styles.alertHeader}>
                            <MaterialIcons 
                                name={alertConfig.type === 'error' ? 'error' : alertConfig.type === 'success' ? 'check-circle' : 'info'} 
                                size={28} 
                                color={alertConfig.type === 'error' ? Colors.error : alertConfig.type === 'success' ? '#15803D' : Colors.primaryContainer} 
                            />
                            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
                        </View>
                        <Text style={styles.alertMessage}>{alertConfig.message}</Text>
                        <TouchableOpacity style={styles.alertBtn} activeOpacity={0.8} onPress={() => {
                            setAlertConfig({ ...alertConfig, visible: false });
                            if (alertConfig.onConfirm) alertConfig.onConfirm();
                        }}>
                            <Text style={styles.alertBtnText}>Sounds Good</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Custom File Picker Selection Modal */}
            <Modal transparent visible={showFilePickerModal} animationType="slide">
                <View style={styles.bottomSheetOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Upload Receipt</Text>
                            <TouchableOpacity onPress={() => setShowFilePickerModal(false)}>
                                <MaterialIcons name="close" size={24} color={Colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.sheetSubtitle}>Choose a file type to upload your payment proof.</Text>
                        
                        <TouchableOpacity style={styles.sheetOption} activeOpacity={0.7} onPress={() => { setShowFilePickerModal(false); pickImage(); }}>
                            <View style={[styles.sheetIconWrap, { backgroundColor: Colors.primaryFixed }]}>
                                <MaterialIcons name="image" size={24} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.sheetOptionTitle}>Photo / Image</Text>
                                <Text style={styles.sheetOptionSub}>Upload a JPG or PNG</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => { setShowFilePickerModal(false); pickDocument(); }}>
                            <View style={[styles.sheetIconWrap, { backgroundColor: Colors.errorContainer }]}>
                                <MaterialIcons name="picture-as-pdf" size={24} color={Colors.error} />
                            </View>
                            <View>
                                <Text style={styles.sheetOptionTitle}>PDF Document</Text>
                                <Text style={styles.sheetOptionSub}>Upload a standard PDF file</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.surface },
    container: { flex: 1, backgroundColor: Colors.surface },
    
    topAppBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        height: 60,
        backgroundColor: Colors.surface,
    },
    appBarBtn: {
        width: 40, height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    topAppTitle: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 16,
        color: Colors.onSurface,
    },

    content: { padding: Spacing.four, paddingBottom: 120, flexGrow: 1 },
    
    headerSection: {
        marginBottom: Spacing.six,
    },
    pageTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 32,
        color: Colors.onSurface,
        letterSpacing: -0.5,
        lineHeight: 38,
    },
    pageSubtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.two,
        lineHeight: 22,
    },

    label: { 
        fontFamily: Fonts.bodySemiBold, 
        fontSize: 14, 
        color: Colors.onSurfaceVariant, 
        marginBottom: Spacing.two, 
        marginLeft: 4,
    },
    
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: Colors.surfaceContainerHighest, 
        borderRadius: Radius.lg, 
        height: 56,
        paddingHorizontal: Spacing.one,
    },
    iconWrap: {
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapRight: {
        width: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: { 
        flex: 1, 
        height: '100%',
        fontFamily: Fonts.bodyMedium, 
        fontSize: 16, 
        color: Colors.onSurface,
        paddingRight: Spacing.four,
    },
    pickerText: { 
        flex: 1, 
        fontFamily: Fonts.bodyMedium, 
        fontSize: 16, 
        color: Colors.onSurface 
    },
    pickerPlaceholder: { 
        flex: 1, 
        fontFamily: Fonts.bodyMedium, 
        fontSize: 16, 
        color: Colors.outline 
    },
    
    dropdownList: { 
        position: 'absolute',
        top: 64,
        left: 0,
        right: 0,
        backgroundColor: Colors.surfaceContainerLowest, 
        borderRadius: Radius.lg, 
        overflow: 'hidden', 
        shadowColor: '#191b23', 
        shadowOffset: { width: 0, height: 12 }, 
        shadowOpacity: 0.12, 
        shadowRadius: 24, 
        elevation: 8,
        zIndex: 999,
        maxHeight: 200,
    },
    dropdownItem: { paddingHorizontal: Spacing.four, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainer },
    dropdownItemActive: { backgroundColor: Colors.primaryFixed },
    dropdownText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurface },
    dropdownTextActive: { fontFamily: Fonts.bodySemiBold, color: Colors.primary },

    uploadArea: {
        width: '100%',
        aspectRatio: 2,
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        borderWidth: 2,
        borderColor: 'rgba(195, 198, 215, 0.5)', 
        borderStyle: 'dashed',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.one,
    },
    uploadIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryContainer,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.three,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 4,
    },
    uploadTitle: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 16,
        color: Colors.onSurface,
        marginBottom: 4,
    },
    uploadSubtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 13,
        color: Colors.onSurfaceVariant,
    },

    filePreviewContainer: { 
        position: 'relative', 
        borderRadius: Radius.xl, 
        overflow: 'hidden', 
        backgroundColor: Colors.surfaceContainerHighest,
        aspectRatio: 2,
        borderWidth: 1,
        borderColor: Colors.outlineVariant,
        marginTop: Spacing.one,
    },
    previewImage: { width: '100%', height: '100%' },
    pdfPreview: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    pdfName: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, paddingHorizontal: Spacing.four, textAlign: 'center' },
    removeFile: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

    infoBox: {
        backgroundColor: Colors.surfaceContainer,
        borderRadius: Radius.xl,
        padding: Spacing.four,
        marginTop: Spacing.six,
        gap: Spacing.three,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoLabel: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
    },
    infoVal: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.onSurface,
    },
    infoDisclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingTop: Spacing.two,
        borderTopWidth: 1,
        borderTopColor: 'rgba(195, 198, 215, 0.3)',
        marginTop: Spacing.one,
    },
    infoDiscText: {
        flex: 1,
        fontFamily: Fonts.bodyMedium,
        fontSize: 11,
        lineHeight: 16,
        color: Colors.onSurfaceVariant,
    },

    footer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: Spacing.four,
        paddingBottom: 32,
        paddingTop: Spacing.three,
        backgroundColor: 'rgba(250, 248, 255, 0.85)',
    },
    submitBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: Colors.primaryContainer, 
        borderRadius: Radius.lg, 
        height: 60,
        gap: 12, 
        shadowColor: Colors.primary, 
        shadowOffset: { width: 0, height: 12 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 32, 
        elevation: 8 
    },
    submitText: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onPrimary },

    /* Modals */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.four,
    },
    alertBox: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
        elevation: 10,
    },
    alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.one },
    alertTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface },
    alertMessage: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, marginBottom: Spacing.five, marginTop: Spacing.one, lineHeight: 22 },
    alertBtn: { backgroundColor: Colors.primaryContainer, paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center' },
    alertBtnText: { fontFamily: Fonts.headlineSemiBold, fontSize: 16, color: Colors.onPrimary },

    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: Spacing.five,
        paddingTop: Spacing.six,
        paddingBottom: 50,
    },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.one },
    sheetTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 22, color: Colors.onSurface },
    sheetSubtitle: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: Spacing.four },
    sheetOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four, paddingVertical: Spacing.three, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainer },
    sheetIconWrap: { width: 48, height: 48, borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center' },
    sheetOptionTitle: { fontFamily: Fonts.headlineSemiBold, fontSize: 16, color: Colors.onSurface },
    sheetOptionSub: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurfaceVariant },
});
