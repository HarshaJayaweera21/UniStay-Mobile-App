import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Image, Linking, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import BottomNav from '@/components/BottomNav';
import { getItem } from '@/utils/storage';
import { API_URL } from '@/constants/api';

export default function ManagerLeaveRequests() {
    const router = useRouter();
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActioning, setIsActioning] = useState(false);
    const [error, setError] = useState(null);

    // Context Map
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Pagination Map
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    useFocusEffect(
        useCallback(() => {
            fetchRequests();
        }, [])
    );

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const token = await getItem('userToken');
            if (!token) throw new Error("Unauthorized");

            const response = await fetch(`${API_URL}/api/leavepass`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || "Failed to load requests");
            }

            // Manually filter exclusively pending operations for manager dashboard
            const pendingOnly = (result.data || []).filter(req => req.status === 'pending');
            setPendingRequests(pendingOnly);
            
            // Re-calibrate paging safe zones dynamically avoiding index overshoot!
            setCurrentPage(1);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (actionType) => {
        if(!selectedRequest) return;
        setIsActioning(true);

        try {
            const token = await getItem('userToken');
            const endpoint = `${API_URL}/api/leavepass/${actionType}/${selectedRequest._id}`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const result = await response.json();
            if(!response.ok) {
                throw new Error(result.message || `Failed to ${actionType} request`);
            }

            // Safe wipe sequence resetting contextual overlay locks
            setModalVisible(false);
            setSelectedRequest(null);
            
            // Re-sync explicitly pulling fresh arrays natively solving staleness
            fetchRequests();

        } catch (err) {
            Alert.alert("Action Failed", err.message);
        } finally {
            setIsActioning(false);
        }
    };

    // Calculate strict arrays respecting constraints
    const totalPages = Math.ceil(pendingRequests.length / ITEMS_PER_PAGE);
    const paginatedData = pendingRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // Renders Empty Array Canvas Map 
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
                {/* Decorations removed */}
                
                <View style={styles.checkWrap}>
                    <MaterialIcons name="check-circle" size={64} color={Colors.primary} />
                </View>
                
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySubtitle}>No pending leave pass requests for your review right now.</Text>
                
                <View style={styles.updatedBanner}>
                    <View style={styles.updatedIconBox}>
                        <MaterialIcons name="update" size={20} color={Colors.primary} />
                    </View>
                    <Text style={styles.updatedText}>Updated just now</Text>
                </View>
            </View>
        </View>
    );

    const renderRequestModal = () => {
        if (!selectedRequest) return null;
        const student = selectedRequest.student || {};

        return (
            <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        {/* Header Box */}
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalHeaderLabel}>LEAVE PASS REQUEST</Text>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                                <MaterialIcons name="close" size={16} color={Colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScrollFlow} showsVerticalScrollIndicator={false}>
                            {/* Student Base Details Mapping */}
                            <View style={styles.studentWrapInfo}>
                                <View style={styles.studentBaseImgWrapper}>
                                    <View style={styles.studentImgMockup}>
                                        <Text style={styles.studentImgMockupText}>
                                            {(student.firstName?.[0] || '') + (student.lastName?.[0] || '')}
                                        </Text>
                                    </View>
                                    <View style={styles.activeDot} />
                                </View>
                                <View style={styles.studentBaseDetails}>
                                    <Text style={styles.modalStudentName}>{student.firstName} {student.lastName}</Text>
                                    <Text style={styles.modalStudentUser}>@{student.username}</Text>
                                    <Text style={styles.modalStudentEmail}>{student.email}</Text>
                                </View>
                            </View>

                            {/* Reason Block */}
                            <Text style={styles.modalSectionLabel}>REASON</Text>
                            <View style={styles.reasonBox}>
                                <Text style={styles.reasonText}>{selectedRequest.reason}</Text>
                            </View>

                            {/* Dates Vector Grid */}
                            <Text style={styles.modalSectionLabel}>REQUESTED TIME</Text>
                            <View style={styles.datesGrid}>
                                <View style={styles.dateBoxHalf}>
                                    <View style={styles.dateIconWrapper}>
                                        <MaterialIcons name="login" size={20} color={Colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.dateHint}>DEPARTURE</Text>
                                        <Text style={styles.dateObjValue}>{new Date(selectedRequest.requestedFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                        <Text style={styles.dateObjTime}>{new Date(selectedRequest.requestedFrom).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                                    </View>
                                </View>
                                <View style={styles.dateBoxHalf}>
                                    <View style={styles.dateIconWrapper}>
                                        <MaterialIcons name="logout" size={20} color={Colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.dateHint}>RETURN</Text>
                                        <Text style={styles.dateObjValue}>{new Date(selectedRequest.requestedTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                        <Text style={styles.dateObjTime}>{new Date(selectedRequest.requestedTo).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Document Array Extractor linking natively straight onto physical OS parsing engines via generic openURL */}
                            <Text style={styles.modalSectionLabel}>SUPPORTING DOCUMENT</Text>
                            <TouchableOpacity 
                                style={styles.docBannerTarget} 
                                activeOpacity={0.7} 
                                onPress={() => selectedRequest.documentUrl && Linking.openURL(selectedRequest.documentUrl)}
                            >
                                <View style={styles.docBannerIconDrop}>
                                    <MaterialIcons name="picture-as-pdf" size={24} color={Colors.error} />
                                </View>
                                <View style={styles.docBannerInfoFlow}>
                                    <Text style={styles.docBannerName} numberOfLines={1}>Attached_Document.pdf</Text>
                                    <Text style={styles.docBannerDesc}>Requires Validation</Text>
                                </View>
                                <MaterialIcons name="file-download" size={24} color={Colors.primary} />
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Action Container Triggers */}
                        <View style={styles.modalActionFlow}>
                            <TouchableOpacity style={styles.rejectBtn} activeOpacity={0.8} onPress={() => handleAction('reject')} disabled={isActioning}>
                                <MaterialIcons name="close" size={18} color={Colors.error} />
                                <Text style={styles.rejectText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.approveBtn} activeOpacity={0.8} onPress={() => handleAction('approve')} disabled={isActioning}>
                                {isActioning ? <ActivityIndicator size="small" color={Colors.onPrimary} /> : (
                                    <>
                                        <MaterialIcons name="check-circle" size={18} color={Colors.onPrimary} />
                                        <Text style={styles.approveText}>Approve</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            {/* Background Drop Mesh Match layout */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={['rgba(219, 225, 255, 0.5)', 'rgba(243, 243, 254, 0.1)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentWrap}>
                {/* Top Nav Row Removed */}

                <View style={styles.headerStack}>
                    <Text style={styles.mainTitle}>Leave Pass Requests</Text>

                    <View style={styles.pillStack}>
                        <View style={styles.statusPillAlert}>
                            <Text style={styles.statusPillAlertText}>{pendingRequests.length} Pending</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.historyButton} 
                            activeOpacity={0.8}
                            onPress={() => router.push('/manager/leave-history')}
                        >
                            <MaterialIcons name="history" size={18} color={Colors.onSecondaryContainer} />
                            <Text style={styles.historyButtonText}>View History</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {isLoading ? (
                    <View style={styles.loaderFlow}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.loaderFlow}>
                        <Text style={[styles.emptySubtitle, { color: Colors.error }]}>{error}</Text>
                    </View>
                ) : pendingRequests.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <View style={styles.listFlow}>
                        {paginatedData.map((item) => {
                                const student = item.student || {};
                                
                                return (
                                    <View key={item._id} style={styles.cardItem}>
                                        <View style={styles.cardHeaderFlex}>
                                            <View style={styles.cardIdentity}>
                                                <View style={styles.studentImgMockupSmall}>
                                                    <Text style={styles.studentImgMockupSmallText}>{(student.firstName?.[0] || '') + (student.lastName?.[0] || '')}</Text>
                                                </View>
                                                <View>
                                                    <Text style={styles.cardIdentityName}>{student.firstName} {student.lastName}</Text>
                                                    <Text style={styles.cardIdentityUser}>@{student.username}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.pendingBadgeMini}>
                                                <View style={styles.pendingDot} />
                                                <Text style={styles.pendingBadgeTextMini}>Pending</Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardDataRow}>
                                            <View style={styles.dateIconPair}>
                                                <MaterialIcons name="calendar-month" size={16} color={Colors.outline} />
                                                <Text style={styles.cardDataPrimary}>{new Date(item.requestedFrom).toLocaleDateString()} — {new Date(item.requestedTo).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.cardFooter}>
                                            <TouchableOpacity 
                                                style={styles.viewRequestBtn}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    setSelectedRequest(item);
                                                    setModalVisible(true);
                                                }}
                                            >
                                                <MaterialIcons name="visibility" size={16} color={Colors.primary} />
                                                <Text style={styles.viewRequestBtnText}>View Full Request</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}

                            <View style={styles.paginationRow}>
                                <Text style={styles.paginationText}>Showing <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.onSurface }}>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, pendingRequests.length)}</Text> of {pendingRequests.length} requests</Text>
                                <View style={styles.paginationNavWrap}>
                                    <TouchableOpacity 
                                        style={[styles.pageBtn, currentPage === 1 && { opacity: 0.5 }]} 
                                        disabled={currentPage === 1}
                                        onPress={() => setCurrentPage(p => p - 1)}
                                    >
                                        <MaterialIcons name="chevron-left" size={24} color={Colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                    
                                    <View style={styles.pageIndicationTarget}>
                                        <Text style={styles.pageIndicationNum}>{currentPage}</Text>
                                    </View>

                                    <TouchableOpacity 
                                        style={[styles.pageBtn, currentPage === totalPages && { opacity: 0.5 }]} 
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        onPress={() => setCurrentPage(p => p + 1)}
                                    >
                                        <MaterialIcons name="chevron-right" size={24} color={Colors.onSurfaceVariant} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                )}
            </ScrollView>

            {renderRequestModal()}
            <BottomNav activeTab="events" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    contentWrap: { flexGrow: 1, paddingTop: 16, paddingHorizontal: Spacing.four },
    
    topNavRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(25, 27, 35, 0.05)', alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    historyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondaryContainer, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg },
    historyButtonText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onSecondaryContainer, marginLeft: 6 },

    headerStack: { marginBottom: Spacing.eight },
    mainTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 36, color: Colors.onSurface, marginBottom: Spacing.two, lineHeight: 42 },
    pillStack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    statusPillAlert: { backgroundColor: Colors.primaryContainer, paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, marginRight: Spacing.three },
    statusPillAlertText: { fontFamily: Fonts.label, fontSize: 10, color: Colors.onPrimaryContainer, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    portalTag: { fontFamily: Fonts.label, fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '500' },
    loaderFlow: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    
    // Empty View Maps
    emptyContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 110, paddingTop: 32 },
    emptyCard: { width: '100%', backgroundColor: Colors.surfaceContainerLowest, borderRadius: 32, padding: Spacing.八, paddingVertical: 60, alignItems: 'center', shadowColor: '#002a78', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.03, shadowRadius: 50, elevation: 6, overflow: 'hidden' },
    blurLight: { position: 'absolute', width: 128, height: 128, borderRadius: 64 },
    checkWrap: { width: 96, height: 96, borderRadius: 32, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    emptyTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 28, color: Colors.onSurface, marginBottom: Spacing.two },
    emptySubtitle: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 240, marginBottom: Spacing.six },
    updatedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHigh, padding: 6, paddingRight: 16, borderRadius: Radius.xl },
    updatedIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.two },
    updatedText: { fontFamily: Fonts.label, fontSize: 11, fontWeight: 'bold', color: Colors.onSurfaceVariant },

    // Card Maps Output
    listFlow: { paddingBottom: 120, paddingTop: 32, flexGrow: 1 },
    cardItem: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.five, marginBottom: Spacing.four, shadowColor: '#191b23', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 3 },
    cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.four },
    cardIdentity: { flexDirection: 'row', alignItems: 'center' },
    studentImgMockupSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondaryFixed, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
    studentImgMockupSmallText: { fontFamily: Fonts.headlineExtraBold, fontSize: 14, color: Colors.onSecondaryFixed },
    cardIdentityName: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, color: Colors.onSurface },
    cardIdentityUser: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant },
    pendingBadgeMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(195, 198, 215, 0.2)' },
    pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.tertiaryContainer, marginRight: 6 },
    pendingBadgeTextMini: { fontFamily: Fonts.label, fontSize: 10, fontWeight: 'bold', color: Colors.onSurfaceVariant },
    cardDataRow: { marginBottom: Spacing.two },
    dateIconPair: { flexDirection: 'row', alignItems: 'center' },
    cardDataPrimary: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurface, fontWeight: '500', marginLeft: 6 },
    cardFooter: { marginTop: Spacing.three, borderTopWidth: 1, borderTopColor: Colors.surfaceVariant, paddingTop: Spacing.three },
    viewRequestBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondaryFixed, paddingHorizontal: Spacing.four, paddingVertical: 10, borderRadius: Radius.md, alignSelf: 'flex-start' },
    viewRequestBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onPrimaryFixedVariant, marginLeft: 6 },

    // Pagination Row Object Mapping constraints strictly isolating 3 entries
    paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.eight, paddingBottom: 20 },
    paginationText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant },
    paginationNavWrap: { flexDirection: 'row', alignItems: 'center' },
    pageBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    pageIndicationTarget: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    pageIndicationNum: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onPrimary },

    // Overlay Modal Wrapper Objects
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(25, 27, 35, 0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
    modalContent: { width: '100%', maxWidth: 500, maxHeight: '85%', backgroundColor: Colors.surfaceContainerLowest, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.five, paddingTop: Spacing.five, paddingBottom: Spacing.two },
    modalHeaderLabel: { fontFamily: Fonts.label, fontSize: 10, color: Colors.onSurfaceVariant, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
    modalScrollFlow: { paddingHorizontal: Spacing.five, paddingBottom: Spacing.five },
    
    studentWrapInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.five },
    studentBaseImgWrapper: { position: 'relative', marginRight: Spacing.three },
    studentImgMockup: { width: 56, height: 56, borderRadius: 20, backgroundColor: Colors.secondaryFixed, alignItems: 'center', justifyContent: 'center' },
    studentImgMockupText: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSecondaryFixed },
    activeDot: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.primary, borderWidth: 2, borderColor: '#ffffff' },
    modalStudentName: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, letterSpacing: -0.5 },
    modalStudentUser: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.primary, fontWeight: '500', marginBottom: 2 },
    modalStudentEmail: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.onSurfaceVariant },

    modalSectionLabel: { fontFamily: Fonts.label, fontSize: 9, fontWeight: 'bold', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.one },
    reasonBox: { backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.three, marginBottom: Spacing.four },
    reasonText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurface, lineHeight: 20 },
    
    datesGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.four },
    dateBoxHalf: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.two, marginHorizontal: 3 },
    dateIconWrapper: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0, 74, 198, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.two },
    dateHint: { fontFamily: Fonts.label, fontSize: 9, fontWeight: 'bold', color: Colors.outline, textTransform: 'uppercase' },
    dateObjValue: { fontFamily: Fonts.headlineExtraBold, fontSize: 11, color: Colors.onSurface, marginTop: 2 },
    dateObjTime: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.primary, marginTop: 2 },

    docBannerTarget: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.three, borderWidth: 1, borderColor: Colors.surfaceVariant, marginBottom: Spacing.three },
    docBannerIconDrop: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.errorContainer, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
    docBannerInfoFlow: { flex: 1 },
    docBannerName: { fontFamily: Fonts.headlineExtraBold, fontSize: 12, color: Colors.onSurface },
    docBannerDesc: { fontFamily: Fonts.bodyMedium, fontSize: 10, color: Colors.onSurfaceVariant },

    modalActionFlow: { flexDirection: 'row', paddingHorizontal: Spacing.five, paddingBottom: Spacing.five, paddingTop: Spacing.one },
    rejectBtn: { flex: 1, flexDirection: 'row', height: 46, borderRadius: 12, backgroundColor: 'rgba(255, 218, 214, 0.2)', borderWidth: 1, borderColor: 'rgba(186, 26, 26, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
    rejectText: { fontFamily: Fonts.headlineExtraBold, fontSize: 13, color: Colors.error, marginLeft: 6 },
    approveBtn: { flex: 1, flexDirection: 'row', height: 46, borderRadius: 12, backgroundColor: Colors.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    approveText: { fontFamily: Fonts.headlineExtraBold, fontSize: 13, color: Colors.onPrimary, marginLeft: 6 }
});
