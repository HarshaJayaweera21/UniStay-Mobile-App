import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { getItem } from '@/utils/storage';
import { API_URL } from '@/constants/api';

export default function LeaveRequest() {
    const router = useRouter();
    const [reason, setReason] = useState('');
    const [requestedFrom, setRequestedFrom] = useState(new Date());
    const [requestedTo, setRequestedTo] = useState(new Date());
    const [document, setDocument] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // DatePicker Modals
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);
    const [fromMode, setFromMode] = useState('date');
    const [toMode, setToMode] = useState('date');

    const handleDocumentPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                if (file.size > 5 * 1024 * 1024) {
                    Alert.alert('Error', 'Maximum file size is 5MB');
                    return;
                }
                setDocument(file);
            }
        } catch (err) {
            console.error("Document picking failed", err);
            Alert.alert("Selection failed", "Could not attach the document.");
        }
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert("Missing Field", "Please state your reason for the pass.");
            return;
        }

        if (!document) {
            Alert.alert("Missing Document", "Please attach a supporting document.");
            return;
        }

        if (requestedFrom >= requestedTo) {
            Alert.alert("Invalid Dates", "Return time must be after departure time.");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = await getItem('userToken');
            
            const formData = new FormData();
            formData.append('reason', reason);
            formData.append('requestedFrom', requestedFrom.toISOString());
            formData.append('requestedTo', requestedTo.toISOString());

            // Append File securely mapping for React Native
            formData.append('document', {
                uri: Platform.OS === 'ios' ? document.uri.replace('file://', '') : document.uri,
                type: document.mimeType || 'application/pdf',
                name: document.name || 'document.pdf',
            });

            const response = await fetch(`${API_URL}/api/leavepass`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // Content-Type is auto-mapped for FormData
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to submit request');
            }

            Alert.alert("Success", "Your leave pass request has been submitted securely.");
            router.back();

        } catch (error) {
            Alert.alert("Submission Error", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Drop Mesh */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={['rgba(0, 74, 198, 0.05)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                />
            </View>

            {/* Top Navigation */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Request a Pass</Text>
            </View>

            {/* Scrollable Form Bound */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.helperText}>
                    Submit a request to leave or enter the hostel outside normal hours (6AM - 6PM)
                </Text>

                {/* Main Card */}
                <View style={styles.formCard}>
                    
                    {/* Reason Array */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>REASON</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="State your reason for late entry/exit..."
                            placeholderTextColor={Colors.outline}
                            multiline
                            numberOfLines={4}
                            value={reason}
                            onChangeText={setReason}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* From Date Array */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>FROM</Text>
                        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowFromPicker(true)} activeOpacity={0.7}>
                            <MaterialIcons name="calendar-today" size={20} color={Colors.primary} style={styles.dateIcon} />
                            <Text style={styles.dateText}>{requestedFrom.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                        </TouchableOpacity>
                        
                        {showFromPicker && (
                            <DateTimePicker
                                value={requestedFrom}
                                mode={Platform.OS === 'ios' || Platform.OS === 'web' ? 'datetime' : fromMode}
                                display="default"
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        if (event.type === 'set') {
                                            const currentDate = selectedDate || requestedFrom;
                                            setRequestedFrom(currentDate);
                                            if (fromMode === 'date') {
                                                setFromMode('time');
                                            } else {
                                                setShowFromPicker(false);
                                                setFromMode('date');
                                            }
                                        } else {
                                            setShowFromPicker(false);
                                            setFromMode('date');
                                        }
                                    } else {
                                        setShowFromPicker(Platform.OS === 'ios');
                                        if (selectedDate) setRequestedFrom(selectedDate);
                                    }
                                }}
                            />
                        )}
                    </View>

                    {/* To Date Array */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>TO</Text>
                        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowToPicker(true)} activeOpacity={0.7}>
                            <MaterialIcons name="schedule" size={20} color={Colors.primary} style={styles.dateIcon} />
                            <Text style={styles.dateText}>{requestedTo.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                        </TouchableOpacity>

                        {showToPicker && (
                            <DateTimePicker
                                value={requestedTo}
                                mode={Platform.OS === 'ios' || Platform.OS === 'web' ? 'datetime' : toMode}
                                display="default"
                                onChange={(event, selectedDate) => {
                                    if (Platform.OS === 'android') {
                                        if (event.type === 'set') {
                                            const currentDate = selectedDate || requestedTo;
                                            setRequestedTo(currentDate);
                                            if (toMode === 'date') {
                                                setToMode('time');
                                            } else {
                                                setShowToPicker(false);
                                                setToMode('date');
                                            }
                                        } else {
                                            setShowToPicker(false);
                                            setToMode('date');
                                        }
                                    } else {
                                        setShowToPicker(Platform.OS === 'ios');
                                        if (selectedDate) setRequestedTo(selectedDate);
                                    }
                                }}
                            />
                        )}
                    </View>

                    {/* Document Upload Group */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>SUPPORTING DOCUMENT</Text>
                        <TouchableOpacity style={styles.uploadZone} onPress={handleDocumentPick} activeOpacity={0.7} >
                            <View style={styles.uploadOrb}>
                                <MaterialIcons name={document ? "check-circle" : "upload-file"} size={28} color={document ? '#2e7d32' : Colors.primary} />
                            </View>
                            <Text style={styles.uploadTitle}>
                                {document ? document.name : 'Tap to upload PDF or Image'}
                            </Text>
                            <Text style={styles.uploadSubtitle}>
                                {document ? `Size: ${(document.size / 1024 / 1024).toFixed(2)} MB` : 'Maximum file size: 5MB'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

                {/* Submission Object */}
                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleSubmit} 
                    activeOpacity={0.9} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color={Colors.onPrimary} />
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>Submit Request</Text>
                            <MaterialIcons name="send" size={18} color={Colors.onPrimary} style={{ marginLeft: 8 }} />
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.four,
        paddingTop: 60,
        paddingBottom: Spacing.four,
        backgroundColor: Colors.surface,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: Radius.full,
    },
    headerTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 20,
        color: Colors.onSurface,
        marginLeft: Spacing.two,
        letterSpacing: -0.5
    },
    scrollContent: {
        padding: Spacing.五, // I will use explicit spacing numbers
        paddingHorizontal: Spacing.five,
        paddingBottom: 40,
    },
    helperText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurfaceVariant,
        lineHeight: 22,
        marginBottom: Spacing.six
    },
    formCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.五,
        paddingLeft: 24,
        paddingRight: 24,
        paddingTop: 24,
        paddingBottom: 24,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
        elevation: 8,
        marginBottom: Spacing.six
    },
    fieldGroup: {
        marginBottom: Spacing.four
    },
    fieldLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        color: Colors.onSurfaceVariant,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: Spacing.two,
        paddingHorizontal: 4
    },
    textArea: {
        backgroundColor: Colors.surfaceContainerHighest,
        borderRadius: Radius.md,
        padding: Spacing.four,
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurface,
        minHeight: 100, // Provides 4 lines layout exactly
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerHighest,
        borderRadius: Radius.md,
        padding: Spacing.four,
        position: 'relative'
    },
    dateIcon: {
        position: 'absolute',
        left: 16,
    },
    dateText: {
        marginLeft: 36,
        fontFamily: Fonts.bodyMedium,
        fontSize: 14,
        color: Colors.onSurface
    },
    uploadZone: {
        backgroundColor: Colors.surfaceContainerHigh,
        borderWidth: 2,
        borderColor: 'rgba(195, 198, 215, 0.3)',
        borderStyle: 'dashed',
        borderRadius: Radius.md,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center'
    },
    uploadOrb: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.surfaceContainerLowest,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: Spacing.three
    },
    uploadTitle: {
        fontFamily: Fonts.headline,
        fontWeight: '600',
        fontSize: 14,
        color: Colors.onSurface,
        textAlign: 'center'
    },
    uploadSubtitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 11,
        color: Colors.onSurfaceVariant,
        marginTop: 4,
        textAlign: 'center'
    },
    submitButton: {
        height: 52,
        flexDirection: 'row',
        backgroundColor: Colors.primaryContainer,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primaryContainer,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 6
    },
    submitButtonText: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 16,
        color: Colors.onPrimary
    }
});
