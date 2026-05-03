import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Modal, TextInput, Platform, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import BottomNav from '@/components/BottomNav';
import { getItem } from '@/utils/storage';
import { API_URL } from '@/constants/api';

export default function LeavePasses() {
    const router = useRouter();
    const [passes, setPasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // UI State
    const [isReasonModalVisible, setIsReasonModalVisible] = useState(false);
    const [selectedReason, setSelectedReason] = useState('');
    
    // Edit Modal State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingPass, setEditingPass] = useState(null);
    const [editReason, setEditReason] = useState('');
    const [editFromDate, setEditFromDate] = useState(new Date());
    const [editToDate, setEditToDate] = useState(new Date());
    const [isSaving, setIsSaving] = useState(false);
    
    // Date Picker States
    const [showEditFromPicker, setShowEditFromPicker] = useState(false);
    const [showEditToPicker, setShowEditToPicker] = useState(false);
    const [editFromMode, setEditFromMode] = useState('date');
    const [editToMode, setEditToMode] = useState('date');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useFocusEffect(
        useCallback(() => {
            fetchLeavePasses();
        }, [])
    );

    const fetchLeavePasses = async () => {
        try {
            const token = await getItem('userToken');
            if (!token) throw new Error("Unauthorized");

            const response = await fetch(`${API_URL}/api/leavepass/mine`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Failed to load leave passes");
            }

            setPasses(result.data || []);
            // Only reset to first page on hard refresh, not on updates to preserve context
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenEdit = (item) => {
        setEditingPass(item);
        setEditReason(item.reason);
        setEditFromDate(new Date(item.requestedFrom));
        setEditToDate(new Date(item.requestedTo));
        setEditFromMode('date');
        setEditToMode('date');
        setIsEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editReason.trim()) {
            Alert.alert("Validation Error", "Reason cannot be empty.");
            return;
        }
        if (editFromDate >= editToDate) {
            Alert.alert("Validation Error", "Return date must be after departure date.");
            return;
        }

        setIsSaving(true);
        try {
            const token = await getItem('userToken');
            const response = await fetch(`${API_URL}/api/leavepass/${editingPass._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: editReason,
                    requestedFrom: editFromDate.toISOString(),
                    requestedTo: editToDate.toISOString()
                })
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Failed to update leave pass");
            }

            setIsEditModalVisible(false);
            setEditingPass(null);
            Alert.alert("Success", "Your request has been updated.");
            fetchLeavePasses(); // refresh list
        } catch (error) {
            Alert.alert("Update Failed", error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Pagination Logic
    const totalPages = Math.ceil(passes.length / ITEMS_PER_PAGE) || 1;
    const paginatedPasses = passes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const EmptyState = () => (
        <View style={styles.emptyCard}>
            <View style={styles.emptyIconGroup}>
                <View style={[styles.blurOrb, { top: -20, left: -20, backgroundColor: 'rgba(0, 74, 198, 0.05)' }]} />
                <View style={[styles.blurOrb, { bottom: -10, right: -10, backgroundColor: 'rgba(172, 191, 255, 0.2)', width: 64, height: 64 }]} />
                
                <View style={styles.emptyMainIconWrap}>
                    <MaterialIcons name="confirmation-number" size={64} color="rgba(0, 74, 198, 0.2)" />
                    <View style={styles.emptyBadgeIcon}>
                        <MaterialIcons name="edit-calendar" size={24} color="#ffffff" />
                    </View>
                </View>
            </View>

            <Text style={styles.emptyTitle}>No leave passes yet</Text>
            <Text style={styles.emptySubtitle}>
                Tap <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.primary }}>Request</Text> to submit your first request for temporary leave.
            </Text>

            <View style={styles.infoBanner}>
                <View style={styles.infoIconWrap}>
                    <MaterialIcons name="info" size={20} color={Colors.primary} />
                </View>
                <View style={styles.infoTextGroup}>
                    <Text style={styles.infoBannerTitle}>Did you know?</Text>
                    <Text style={styles.infoBannerText}>
                        Passes are typically approved by the warden within 24 hours of submission. Plan your travel accordingly.
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderPassCard = ({ item }) => {
        const isPending = item.status === 'pending';
        const isApproved = item.status === 'approved';
        
        // Generate a short ID from MongoDB _id
        const shortId = `#LP-${item._id.slice(-5).toUpperCase()}`;
        
        // Determine Validity
        const now = new Date();
        const fromDate = new Date(item.requestedFrom);
        const toDate = new Date(item.requestedTo);
        
        let validityTag = null;
        if (isApproved) {
            if (now > toDate) {
                validityTag = (
                    <View style={[styles.validityBadge, { backgroundColor: '#fee2e2' }]}>
                        <Text style={[styles.validityText, { color: '#ef4444' }]}>EXPIRED</Text>
                    </View>
                );
            } else {
                validityTag = (
                    <View style={[styles.validityBadge, { backgroundColor: '#dcfce7' }]}>
                        <Text style={[styles.validityText, { color: '#16a34a' }]}>VALID</Text>
                    </View>
                );
            }
        }

        return (
            <View style={styles.passCard}>
                <Text style={styles.passId}>{shortId}</Text>
                
                <View style={{ alignItems: 'flex-start', marginVertical: Spacing.two }}>
                    <View style={[
                        styles.statusPill, 
                        { backgroundColor: isPending ? Colors.surfaceContainerHighest : isApproved ? 'rgba(0, 74, 198, 0.1)' : 'rgba(186, 26, 26, 0.1)' }
                    ]}>
                        <Text style={[
                            styles.statusText, 
                            { color: isPending ? Colors.onSurfaceVariant : isApproved ? Colors.primary : Colors.error }
                        ]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.dateRow}>
                    <MaterialIcons name="date-range" size={16} color={Colors.outline} style={{ marginRight: 6 }} />
                    <Text style={styles.passDate}>
                        {fromDate.toLocaleDateString()} — {toDate.toLocaleDateString()}
                    </Text>
                </View>

                {validityTag && (
                    <View style={styles.validityContainer}>
                        {validityTag}
                    </View>
                )}

                <View style={styles.passFooter}>
                    <TouchableOpacity 
                        style={styles.viewReasonButton}
                        onPress={() => {
                            setSelectedReason(item.reason);
                            setIsReasonModalVisible(true);
                        }}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="visibility" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.viewReasonText}>View Reason</Text>
                    </TouchableOpacity>

                    {isPending && (
                        <TouchableOpacity 
                            style={[styles.viewReasonButton, { marginLeft: Spacing.three, backgroundColor: Colors.surfaceContainerHighest }]}
                            onPress={() => handleOpenEdit(item)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="edit" size={16} color={Colors.onSurfaceVariant} style={{ marginRight: 6 }} />
                            <Text style={[styles.viewReasonText, { color: Colors.onSurfaceVariant }]}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Base background gradient — matches qr.jsx */}
            <LinearGradient
                colors={['#dbe1ff', '#faf8ff']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Top dark blue header section */}
            <View style={styles.blueBackgroundAnchor}>
                <LinearGradient
                    colors={['#003ea8', '#004ac6']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            {/* Fixed Back Button */}
            <View style={styles.topNav}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.contentWrapper}>
                {/* Header Layer */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerLabel}>UNISTAY MANAGEMENT</Text>
                        <Text style={styles.headerTitle}>Leave{'\n'}Passes</Text>
                    </View>
                    <TouchableOpacity style={styles.requestButton} activeOpacity={0.8} onPress={() => router.push('/student/leave-request')}>
                        <MaterialIcons name="add" size={18} color={Colors.onPrimary} />
                        <Text style={styles.requestButtonText}>Request</Text>
                    </TouchableOpacity>
                </View>

                {/* Dashboard Loading Content or Cards */}
                {isLoading ? (
                    <View style={styles.centerFlow}>
                        <ActivityIndicator size="large" color={Colors.surfaceContainerLowest} />
                    </View>
                ) : error ? (
                    <View style={styles.centerFlow}>
                        <MaterialIcons name="error-outline" size={48} color={Colors.surfaceContainerLowest} />
                        <Text style={[styles.emptySubtitle, { color: Colors.surfaceContainerLowest, marginTop: Spacing.two }]}>{error}</Text>
                        <TouchableOpacity onPress={fetchLeavePasses} style={[styles.requestButton, { marginTop: Spacing.four }]}>
                             <Text style={styles.requestButtonText}>Retry Fetch</Text>
                        </TouchableOpacity>
                    </View>
                ) : passes.length === 0 ? (
                    <ScrollView contentContainerStyle={styles.scrollFlow} showsVerticalScrollIndicator={false}>
                        <EmptyState />
                    </ScrollView>
                ) : (
                    <View style={styles.listWrapper}>
                        <FlatList
                            data={paginatedPasses}
                            keyExtractor={(item) => item._id}
                            renderItem={renderPassCard}
                            contentContainerStyle={styles.listFlow}
                            showsVerticalScrollIndicator={false}
                        />
                        
                        {/* Pagination Controls */}
                        {passes.length > ITEMS_PER_PAGE && (
                            <View style={styles.pagination}>
                                <TouchableOpacity 
                                    style={styles.pageButton} 
                                    onPress={handlePrevPage} 
                                    disabled={currentPage === 1}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonDisabled]}>Previous</Text>
                                </TouchableOpacity>
                                <Text style={styles.pageText}>Page {currentPage} of {totalPages}</Text>
                                <TouchableOpacity 
                                    style={styles.pageButton} 
                                    onPress={handleNextPage} 
                                    disabled={currentPage === totalPages}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonDisabled]}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>

            {/* Reason Modal */}
            <Modal
                visible={isReasonModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsReasonModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <MaterialIcons name="assignment" size={24} color={Colors.primary} />
                            <Text style={styles.modalTitle}>Leave Pass Reason</Text>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalReasonText}>{selectedReason}</Text>
                        </ScrollView>
                        <TouchableOpacity 
                            style={styles.modalCloseButton} 
                            onPress={() => setIsReasonModalVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { padding: 0 }]}>
                        <View style={[styles.modalHeader, { padding: Spacing.five, marginBottom: 0 }]}>
                            <MaterialIcons name="edit-document" size={24} color={Colors.primary} />
                            <Text style={styles.modalTitle}>Edit Request</Text>
                        </View>
                        
                        <ScrollView style={{ paddingHorizontal: Spacing.five, paddingBottom: Spacing.five }} showsVerticalScrollIndicator={false}>
                            {/* Reason Field */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>REASON</Text>
                                <TextInput
                                    style={styles.textArea}
                                    placeholder="State your reason..."
                                    placeholderTextColor={Colors.outline}
                                    multiline
                                    numberOfLines={4}
                                    value={editReason}
                                    onChangeText={setEditReason}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* From Date Field */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>FROM</Text>
                                <TouchableOpacity style={styles.dateSelector} onPress={() => setShowEditFromPicker(true)} activeOpacity={0.7}>
                                    <MaterialIcons name="calendar-today" size={20} color={Colors.primary} style={styles.dateIcon} />
                                    <Text style={styles.dateText}>{editFromDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                                </TouchableOpacity>
                                
                                {showEditFromPicker && (
                                    <DateTimePicker
                                        value={editFromDate}
                                        mode={Platform.OS === 'ios' || Platform.OS === 'web' ? 'datetime' : editFromMode}
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS === 'android') {
                                                if (event.type === 'set') {
                                                    const currentDate = selectedDate || editFromDate;
                                                    setEditFromDate(currentDate);
                                                    if (editFromMode === 'date') {
                                                        setEditFromMode('time');
                                                    } else {
                                                        setShowEditFromPicker(false);
                                                        setEditFromMode('date');
                                                    }
                                                } else {
                                                    setShowEditFromPicker(false);
                                                    setEditFromMode('date');
                                                }
                                            } else {
                                                setShowEditFromPicker(Platform.OS === 'ios');
                                                if (selectedDate) setEditFromDate(selectedDate);
                                            }
                                        }}
                                    />
                                )}
                            </View>

                            {/* To Date Field */}
                            <View style={styles.fieldGroup}>
                                <Text style={styles.fieldLabel}>TO</Text>
                                <TouchableOpacity style={styles.dateSelector} onPress={() => setShowEditToPicker(true)} activeOpacity={0.7}>
                                    <MaterialIcons name="schedule" size={20} color={Colors.primary} style={styles.dateIcon} />
                                    <Text style={styles.dateText}>{editToDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                                </TouchableOpacity>

                                {showEditToPicker && (
                                    <DateTimePicker
                                        value={editToDate}
                                        mode={Platform.OS === 'ios' || Platform.OS === 'web' ? 'datetime' : editToMode}
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS === 'android') {
                                                if (event.type === 'set') {
                                                    const currentDate = selectedDate || editToDate;
                                                    setEditToDate(currentDate);
                                                    if (editToMode === 'date') {
                                                        setEditToMode('time');
                                                    } else {
                                                        setShowEditToPicker(false);
                                                        setEditToMode('date');
                                                    }
                                                } else {
                                                    setShowEditToPicker(false);
                                                    setEditToMode('date');
                                                }
                                            } else {
                                                setShowEditToPicker(Platform.OS === 'ios');
                                                if (selectedDate) setEditToDate(selectedDate);
                                            }
                                        }}
                                    />
                                )}
                            </View>
                            
                            <View style={styles.modalActionFlow}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)} disabled={isSaving}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={isSaving}>
                                    {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <BottomNav activeTab="events" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerLow,
    },
    blueBackgroundAnchor: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 350,
        backgroundColor: Colors.primary,
    },
    topNav: {
        position: 'absolute',
        top: 60,
        left: Spacing.four,
        zIndex: 50,
    },
    backButton: {
        padding: 8,
        borderRadius: Radius.full,
        backgroundColor: '#f3f3fe',
    },
    contentWrapper: {
        flex: 1,
        paddingTop: 120, // Increased to clear the new back button
        paddingHorizontal: Spacing.four,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 40,
    },
    headerLabel: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        color: 'rgba(238, 239, 255, 0.7)',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: Spacing.one
    },
    headerTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 42,
        color: Colors.onPrimary,
        letterSpacing: -1,
        lineHeight: 46
    },
    requestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryContainer,
        paddingHorizontal: Spacing.four,
        paddingVertical: 12,
        borderRadius: Radius.xl,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: Spacing.two
    },
    requestButtonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: Colors.onPrimary,
        marginLeft: 6
    },
    scrollFlow: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 110, // Account for BottomNav clipping
    },
    listWrapper: {
        flex: 1,
        paddingBottom: 110, // Ensure FlatList + Pagination clears BottomNav
    },
    listFlow: {
        paddingTop: Spacing.two,
        paddingBottom: Spacing.four
    },
    centerFlow: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 110
    },
    emptyCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        width: '100%',
        borderRadius: 32,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.05,
        shadowRadius: 32,
        elevation: 8
    },
    emptyIconGroup: {
        position: 'relative',
        marginBottom: 48,
    },
    blurOrb: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    emptyMainIconWrap: {
        width: 128,
        height: 128,
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ rotate: '-3deg' }]
    },
    emptyBadgeIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: Colors.primaryContainer,
        padding: 12,
        borderRadius: 16,
        transform: [{ rotate: '12deg' }],
        shadowColor: Colors.primaryContainer,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    emptyTitle: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 24,
        color: Colors.onSurface,
        marginBottom: Spacing.four
    },
    emptySubtitle: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        color: Colors.onSurfaceVariant,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 280,
        marginBottom: 40
    },
    infoBanner: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceContainerLow,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        width: '100%'
    },
    infoIconWrap: {
        backgroundColor: '#ffffff',
        padding: 8,
        borderRadius: Radius.lg,
        alignSelf: 'flex-start',
        marginRight: Spacing.four
    },
    infoTextGroup: {
        flex: 1,
    },
    infoBannerTitle: {
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
        color: Colors.onSurface,
        marginBottom: 4
    },
    infoBannerText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 12,
        lineHeight: 20,
        color: Colors.onSurfaceVariant
    },

    // Redesigned Active Card Items
    passCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.four,
        marginBottom: Spacing.four,
        width: '100%',
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6
    },
    passId: {
        fontFamily: Fonts.headlineExtraBold,
        fontSize: 18,
        color: Colors.onSurface,
        letterSpacing: -0.5
    },
    statusPill: {
        paddingHorizontal: Spacing.three,
        paddingVertical: 6,
        borderRadius: Radius.full,
    },
    statusText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 10,
        letterSpacing: 1.5
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceContainerLow,
        padding: Spacing.three,
        borderRadius: Radius.md,
        marginBottom: Spacing.three
    },
    passDate: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.onSurfaceVariant
    },
    validityContainer: {
        alignItems: 'flex-end',
        marginBottom: Spacing.three
    },
    validityBadge: {
        paddingHorizontal: Spacing.three,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    validityText: {
        fontFamily: Fonts.labelBold,
        fontSize: 10,
        letterSpacing: 0.5
    },
    passFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        borderTopWidth: 1,
        borderTopColor: Colors.surfaceVariant,
        paddingTop: Spacing.three
    },
    viewReasonButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.secondaryFixed,
        paddingHorizontal: Spacing.four,
        paddingVertical: 8,
        borderRadius: Radius.md,
    },
    viewReasonText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 12,
        color: Colors.onPrimaryFixedVariant
    },

    // Pagination
    pagination: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: Colors.surfaceContainerLowest, 
        padding: Spacing.four, 
        borderRadius: Radius.xl, 
        marginTop: Spacing.two,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3
    },
    pageButton: {
        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.three,
    },
    pageButtonText: { 
        fontFamily: Fonts.headlineBold, 
        fontSize: 14, 
        color: Colors.primary 
    },
    pageButtonDisabled: {
        color: Colors.outlineVariant
    },
    pageText: { 
        fontFamily: Fonts.bodyMedium, 
        fontSize: 14, 
        color: Colors.onSurfaceVariant 
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(25, 27, 35, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.four
    },
    modalContent: {
        backgroundColor: Colors.surfaceContainerLowest,
        width: '100%',
        maxWidth: 500,
        borderRadius: 28,
        padding: Spacing.five,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.four,
        paddingBottom: Spacing.three,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceVariant
    },
    modalTitle: {
        fontFamily: Fonts.headlineBold,
        fontSize: 18,
        color: Colors.onSurface,
        marginLeft: Spacing.two
    },
    modalBody: {
        maxHeight: 300,
        marginBottom: Spacing.six
    },
    modalReasonText: {
        fontFamily: Fonts.bodyMedium,
        fontSize: 15,
        color: Colors.onSurfaceVariant,
        lineHeight: 24
    },
    modalCloseButton: {
        backgroundColor: Colors.primaryContainer,
        paddingVertical: 14,
        borderRadius: Radius.md,
        alignItems: 'center'
    },
    modalCloseText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        color: Colors.onPrimary
    },

    // Edit Form Styles
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
        minHeight: 100,
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
    modalActionFlow: {
        flexDirection: 'row',
        marginTop: Spacing.four
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: Colors.surfaceContainerHighest,
        paddingVertical: 14,
        borderRadius: Radius.md,
        alignItems: 'center',
        marginRight: Spacing.three
    },
    cancelBtnText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        color: Colors.onSurfaceVariant
    },
    saveBtn: {
        flex: 1,
        backgroundColor: Colors.primaryContainer,
        paddingVertical: 14,
        borderRadius: Radius.md,
        alignItems: 'center'
    },
    saveBtnText: {
        fontFamily: Fonts.bodyBold,
        fontSize: 15,
        color: Colors.onPrimary
    }
});
