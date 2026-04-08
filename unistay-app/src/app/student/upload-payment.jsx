import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ActivityIndicator, Alert, Image, ScrollView, KeyboardAvoidingView, Platform,
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

    useEffect(() => { fetchPaymentTypes(); }, []);

    const fetchPaymentTypes = async () => {
        try {
            const token = await getItem('userToken');
            const res = await fetch(PAYMENT_TYPES_URL, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) setPaymentTypes(data.paymentTypes || []);
        } catch (err) {
            Alert.alert('Error', 'Failed to load payment types.');
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

    const handleSubmit = async () => {
        if (!selectedType || !amount || !file) {
            Alert.alert('Validation', 'Please fill in all fields and attach a receipt.');
            return;
        }
        const parsed = parseFloat(amount);
        if (isNaN(parsed) || parsed <= 0) {
            Alert.alert('Validation', 'Amount must be a number greater than 0.');
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
            if (!res.ok) { Alert.alert('Error', data.message || 'Failed to submit payment.'); return; }
            Alert.alert('Success', 'Payment submitted successfully!', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (err) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally { setIsLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Upload Payment</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Payment Type */}
                    <Text style={styles.label}>PAYMENT TYPE</Text>
                    {isLoadingTypes ? <ActivityIndicator color={Colors.primary} /> : (
                        <>
                            <TouchableOpacity style={styles.picker} onPress={() => setShowTypePicker(!showTypePicker)}>
                                <Text style={selectedType ? styles.pickerText : styles.pickerPlaceholder}>
                                    {selectedType ? selectedType.name : 'Select payment type'}
                                </Text>
                                <MaterialIcons name={showTypePicker ? 'expand-less' : 'expand-more'} size={24} color={Colors.outline} />
                            </TouchableOpacity>
                            {showTypePicker && (
                                <View style={styles.dropdownList}>
                                    {paymentTypes.map((t) => (
                                        <TouchableOpacity key={t._id} style={[styles.dropdownItem, selectedType?._id === t._id && styles.dropdownItemActive]}
                                            onPress={() => { setSelectedType(t); setShowTypePicker(false); }}>
                                            <Text style={[styles.dropdownText, selectedType?._id === t._id && styles.dropdownTextActive]}>{t.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    {/* Amount */}
                    <Text style={[styles.label, { marginTop: Spacing.four }]}>AMOUNT (LKR)</Text>
                    <View style={styles.inputContainer}>
                        <MaterialIcons name="payments" size={20} color={Colors.outline} style={{ marginRight: 8 }} />
                        <TextInput style={styles.input} placeholder="0.00" placeholderTextColor={Colors.outline}
                            keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
                    </View>

                    {/* Receipt */}
                    <Text style={[styles.label, { marginTop: Spacing.four }]}>RECEIPT</Text>
                    {file ? (
                        <View style={styles.filePreview}>
                            {file.type?.includes('image') ? (
                                <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="cover" />
                            ) : (
                                <View style={styles.pdfPreview}>
                                    <MaterialIcons name="picture-as-pdf" size={40} color={Colors.error} />
                                    <Text style={styles.pdfName} numberOfLines={1}>{file.name}</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.removeFile} onPress={() => setFile(null)}>
                                <MaterialIcons name="close" size={20} color={Colors.onPrimary} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.fileButtons}>
                            <TouchableOpacity style={styles.fileBtn} onPress={pickImage}>
                                <MaterialIcons name="image" size={24} color={Colors.primary} />
                                <Text style={styles.fileBtnText}>Image</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.fileBtn} onPress={pickDocument}>
                                <MaterialIcons name="picture-as-pdf" size={24} color={Colors.error} />
                                <Text style={styles.fileBtnText}>PDF</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Submit */}
                    <TouchableOpacity style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.8}>
                        {isLoading ? <ActivityIndicator color={Colors.onPrimary} /> : (
                            <><Text style={styles.submitText}>Submit Payment</Text><MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} /></>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingTop: 56, paddingBottom: Spacing.three, backgroundColor: Colors.surfaceContainerLowest },
    backBtn: { width: 40, height: 40, borderRadius: Radius.full, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontFamily: Fonts.headline, fontSize: 20, color: Colors.onSurface },
    content: { padding: Spacing.four, paddingBottom: 100 },
    label: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.two, marginLeft: Spacing.one },
    picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, paddingHorizontal: Spacing.three, paddingVertical: 16 },
    pickerText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.onSurface },
    pickerPlaceholder: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.outline },
    dropdownList: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.md, marginTop: Spacing.one, overflow: 'hidden', shadowColor: '#191b23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
    dropdownItem: { paddingHorizontal: Spacing.four, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.surfaceContainerHigh },
    dropdownItemActive: { backgroundColor: Colors.primaryFixed },
    dropdownText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurface },
    dropdownTextActive: { fontFamily: Fonts.bodySemiBold, color: Colors.primary },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.xl, paddingHorizontal: Spacing.three },
    input: { flex: 1, paddingVertical: 16, fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.onSurface },
    fileButtons: { flexDirection: 'row', gap: 12 },
    fileBtn: { flex: 1, backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.md, padding: Spacing.four, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.outlineVariant, borderStyle: 'dashed', gap: 8 },
    fileBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurfaceVariant },
    filePreview: { position: 'relative', borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.surfaceContainer },
    previewImage: { width: '100%', height: 200, borderRadius: Radius.md },
    pdfPreview: { padding: Spacing.five, alignItems: 'center', justifyContent: 'center', gap: 8 },
    pdfName: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },
    removeFile: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingVertical: 18, marginTop: Spacing.five, gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
    submitText: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onPrimary },
});
