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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getItem } from '@/utils/storage';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { PAYMENTS_URL } from '@/constants/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const STATUS_COLORS = {
    Pending: { bg: '#FFF3E0', text: '#E65100' },
    Approved: { bg: '#E8F5E9', text: '#1B5E20' },
    Rejected: { bg: '#FFEBEE', text: '#B71C1C' },
};

export default function PaymentDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [payment, setPayment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [showRejectNote, setShowRejectNote] = useState(false);
    const [rejectNote, setRejectNote] = useState('');

    useEffect(() => {
        fetchPaymentDetail();
    }, [id]);

    const fetchPaymentDetail = async () => {
        try {
            setIsLoading(true);
            setError('');

            const token = await getItem('userToken');
            const response = await fetch(`${PAYMENTS_URL}/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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

    const handleUpdateStatus = (status) => {
        if (status === 'Rejected' && !showRejectNote) {
            setShowRejectNote(true);
            return;
        }

        const actionText = status === 'Approved' ? 'approve' : 'reject';

        Alert.alert(
            `Confirm ${actionText}`,
            `Are you sure you want to ${actionText} this payment?${
                status === 'Rejected' && rejectNote
                    ? `\n\nNote: "${rejectNote}"`
                    : ''
            }`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: status === 'Approved' ? 'Approve' : 'Reject',
                    style: status === 'Rejected' ? 'destructive' : 'default',
                    onPress: () => submitStatusUpdate(status),
                },
            ]
        );
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
                Alert.alert('Error', data.message || 'Failed to update payment.');
                return;
            }

            Alert.alert(
                'Success',
                `Payment ${status.toLowerCase()} successfully.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (err) {
            console.error('submitStatusUpdate error:', err);
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading payment details...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <MaterialIcons name="error-outline" size={48} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={fetchPaymentDetail}>
                    <Text style={styles.retryText}>Tap to retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!payment) return null;

    const statusColor = STATUS_COLORS[payment.status] || STATUS_COLORS.Pending;
    const studentName = payment.studentId
        ? `${payment.studentId.firstName} ${payment.studentId.lastName}`
        : 'Unknown Student';
    const studentEmail = payment.studentId?.email || 'N/A';
    const typeName = payment.paymentType?.name || 'Unknown Type';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <MaterialIcons
                        name="arrow-back"
                        size={24}
                        color={Colors.onSurface}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Detail</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Badge */}
                <View style={styles.statusSection}>
                    <View
                        style={[
                            styles.statusPillLarge,
                            { backgroundColor: statusColor.bg },
                        ]}
                    >
                        <MaterialIcons
                            name={
                                payment.status === 'Approved'
                                    ? 'check-circle'
                                    : payment.status === 'Rejected'
                                    ? 'cancel'
                                    : 'schedule'
                            }
                            size={20}
                            color={statusColor.text}
                        />
                        <Text
                            style={[
                                styles.statusTextLarge,
                                { color: statusColor.text },
                            ]}
                        >
                            {payment.status}
                        </Text>
                    </View>
                </View>

                {/* Amount */}
                <View style={styles.amountSection}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>
                        LKR {parseFloat(payment.amount).toLocaleString()}
                    </Text>
                </View>

                {/* Details Card */}
                <View style={styles.detailCard}>
                    <DetailRow
                        icon="person"
                        label="Student"
                        value={studentName}
                    />
                    <DetailRow
                        icon="email"
                        label="Email"
                        value={studentEmail}
                    />
                    <DetailRow
                        icon="category"
                        label="Payment Type"
                        value={typeName}
                    />
                    <DetailRow
                        icon="calendar-today"
                        label="Submitted"
                        value={formatDate(payment.createdAt)}
                    />
                    {payment.note && (
                        <DetailRow
                            icon="notes"
                            label="Note"
                            value={payment.note}
                        />
                    )}
                </View>

                {/* Receipt */}
                <View style={styles.receiptSection}>
                    <Text style={styles.sectionTitle}>Receipt</Text>
                    {isPdf(payment.receipt) ? (
                        <TouchableOpacity
                            style={styles.pdfButton}
                            onPress={() => handleViewReceipt(payment.receipt)}
                        >
                            <MaterialIcons
                                name="picture-as-pdf"
                                size={32}
                                color={Colors.error}
                            />
                            <Text style={styles.pdfText}>
                                Tap to open PDF receipt
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Image
                            source={{ uri: payment.receipt }}
                            style={styles.receiptImage}
                            resizeMode="contain"
                        />
                    )}
                </View>

                {/* Action Buttons — only for Pending payments */}
                {payment.status === 'Pending' && (
                    <View style={styles.actionSection}>
                        {showRejectNote && (
                            <View style={styles.noteInputContainer}>
                                <Text style={styles.noteLabel}>Rejection Note (optional)</Text>
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Enter reason for rejection..."
                                    placeholderTextColor={Colors.outline}
                                    value={rejectNote}
                                    onChangeText={setRejectNote}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>
                        )}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleUpdateStatus('Rejected')}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="#B71C1C" size="small" />
                                ) : (
                                    <>
                                        <MaterialIcons
                                            name="close"
                                            size={20}
                                            color="#B71C1C"
                                        />
                                        <Text style={styles.rejectButtonText}>
                                            Reject
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={() => handleUpdateStatus('Approved')}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator
                                        color={Colors.onPrimary}
                                        size="small"
                                    />
                                ) : (
                                    <>
                                        <MaterialIcons
                                            name="check"
                                            size={20}
                                            color={Colors.onPrimary}
                                        />
                                        <Text style={styles.approveButtonText}>
                                            Approve
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function DetailRow({ icon, label, value }) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
                <MaterialIcons name={icon} size={20} color={Colors.onSurfaceVariant} />
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 16,
        color: Colors.onSurfaceVariant,
        marginTop: Spacing.three,
    },
    errorText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.error,
        textAlign: 'center',
        marginTop: Spacing.two,
    },
    retryText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.primary,
        marginTop: Spacing.three,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingTop: 56,
        paddingBottom: Spacing.three,
        backgroundColor: Colors.surfaceContainerLowest,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: Radius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: Fonts.headline,
        fontSize: 20,
        color: Colors.onSurface,
    },
    scrollContent: {
        padding: Spacing.four,
        paddingBottom: 100,
    },
    statusSection: {
        alignItems: 'center',
        marginBottom: Spacing.four,
    },
    statusPillLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,
        borderRadius: Radius.full,
        gap: 8,
    },
    statusTextLarge: {
        fontFamily: Fonts.headlineSemiBold,
        fontSize: 16,
    },
    amountSection: {
        alignItems: 'center',
        marginBottom: Spacing.five,
    },
    amountLabel: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        marginBottom: 4,
    },
    amountValue: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 32,
        color: Colors.onSurface,
    },
    detailCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.md,
        padding: Spacing.four,
        marginBottom: Spacing.four,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: Spacing.two,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceContainerHigh,
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: Radius.full,
        backgroundColor: Colors.surfaceContainer,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.three,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontFamily: Fonts.body,
        fontSize: 12,
        color: Colors.onSurfaceVariant,
        marginBottom: 2,
    },
    detailValue: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 15,
        color: Colors.onSurface,
    },
    receiptSection: {
        marginBottom: Spacing.four,
    },
    sectionTitle: {
        fontFamily: Fonts.headline,
        fontSize: 18,
        color: Colors.onSurface,
        marginBottom: Spacing.three,
    },
    receiptImage: {
        width: '100%',
        height: 300,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceContainer,
    },
    pdfButton: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.md,
        padding: Spacing.five,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    pdfText: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.primary,
        marginTop: Spacing.two,
    },
    actionSection: {
        marginTop: Spacing.two,
    },
    noteInputContainer: {
        marginBottom: Spacing.four,
    },
    noteLabel: {
        fontFamily: Fonts.bodySemiBold,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        marginBottom: Spacing.two,
    },
    noteInput: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.md,
        padding: Spacing.three,
        fontFamily: Fonts.body,
        fontSize: 15,
        color: Colors.onSurface,
        minHeight: 80,
        borderWidth: 1,
        borderColor: Colors.outlineVariant,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: Radius.md,
        gap: 8,
    },
    approveButton: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    approveButtonText: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: Colors.onPrimary,
    },
    rejectButton: {
        backgroundColor: '#FFEBEE',
    },
    rejectButtonText: {
        fontFamily: Fonts.headline,
        fontSize: 16,
        color: '#B71C1C',
    },
});
