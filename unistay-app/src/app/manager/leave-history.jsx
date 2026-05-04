import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import BottomNav from '@/components/BottomNav';
import { getItem } from '@/utils/storage';
import { API_URL } from '@/constants/api';

export default function ManagerLeaveHistory() {
    const router = useRouter();
    const [historicalRequests, setHistoricalRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    // Pagination Configuration Matching Previous Component perfectly
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 3;

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [])
    );

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const token = await getItem('userToken');
            if (!token) throw new Error("Unauthorized");

            const response = await fetch(`${API_URL}/api/leavepass`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || "Failed to load historical records");
            }

            // Exclusively mapping resolved vectors only
            const resolvedOnly = (result.data || []).filter(req => ['approved', 'rejected'].includes(req.status));
            setHistoricalRequests(resolvedOnly);
            
            setCurrentPage(1);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Pagination Computation
    const totalPages = Math.ceil(historicalRequests.length / ITEMS_PER_PAGE);
    const paginatedData = historicalRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleDelete = async (id) => {
        setIsDeleting(true);
        try {
            const token = await getItem('userToken');
            const response = await fetch(`${API_URL}/api/leavepass/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Failed to delete historical record");
            }

            // Immediately explicitly purge the native local array avoiding whole-page refetches unconditionally!
            setHistoricalRequests(prev => prev.filter(req => req._id !== id));
            
            // Fix index sliding math explicitly capturing edge cases bounds mapping
            const MathLimit = Math.ceil((historicalRequests.length - 1) / ITEMS_PER_PAGE);
            if(currentPage > MathLimit && MathLimit !== 0) {
                setCurrentPage(MathLimit);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsDeleting(false);
        }
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

            <View style={styles.contentWrap}>
                {/* Fixed Header Construct mimicking History Mocks */}
                <View style={styles.topNavRow}>
                    <Text style={[styles.mainTitle, { color: 'black' }]}>Reviewed Requests</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                {isLoading ? (
                    <View style={styles.loaderFlow}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.loaderFlow}>
                        <Text style={[styles.emptySubtitle, { color: Colors.error }]}>{error}</Text>
                    </View>
                ) : historicalRequests.length === 0 ? (
                    <View style={styles.loaderFlow}>
                        <Text style={styles.emptySubtitle}>No archived histories found!</Text>
                    </View>
                ) : (
                    <>
                        {/* Static Metadata Filter Row */}
                        <View style={styles.filterRowTarget}>
                            <Text style={styles.filterTotalLabel}>{historicalRequests.length} REVIEWED REQUESTS</Text>
                            <MaterialIcons name="sort" size={20} color={Colors.outline} />
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listFlow}>
                            {paginatedData.map((item) => {
                                const student = item.student || {};
                                const isApproved = item.status === 'approved';
                                const isExpired = new Date(item.requestedTo) < new Date();
                                
                                return (
                                    <View key={item._id} style={[styles.cardItem, isApproved ? styles.borderApproved : styles.borderRejected]}>
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
                                            <View style={[styles.statusBadge, isApproved ? styles.badgeApprovedBg : styles.badgeRejectedBg]}>
                                                <Text style={[styles.statusBadgeText, isApproved ? styles.badgeApprovedText : styles.badgeRejectedText]}>
                                                    {isApproved ? 'Approved' : 'Rejected'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardDataFlexGrid}>
                                            <View style={styles.cardDataColumn}>
                                                <Text style={styles.cardDataLabel}>STAY PERIOD</Text>
                                                <View style={styles.iconDataPair}>
                                                    <MaterialIcons name="calendar-today" size={12} color={Colors.onSurfaceVariant} />
                                                    <Text style={styles.cardDataValue}>
                                                        {new Date(item.requestedFrom).toLocaleDateString()} — {new Date(item.requestedTo).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[styles.cardDataColumn, { alignItems: 'flex-end' }]}>
                                                <Text style={styles.cardDataLabel}>REVIEWED BY</Text>
                                                <View style={styles.iconDataPair}>
                                                    <MaterialIcons name="shield" size={12} color={Colors.onSurfaceVariant} />
                                                    <Text style={styles.cardDataValue}>Manager</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {(item.status === 'rejected' || isExpired) && (
                                            <View style={styles.cardFooterDivider}>
                                                <View style={styles.expiredFooterFlex}>
                                                    {isExpired && (
                                                        <View style={styles.expiredPillConstraint}>
                                                            <Text style={styles.expiredPillTypography}>Expired</Text>
                                                        </View>
                                                    )}
                                                    <TouchableOpacity 
                                                        style={styles.deleteConstraintWrap}
                                                        activeOpacity={0.6}
                                                        disabled={isDeleting}
                                                        onPress={() => handleDelete(item._id)}
                                                    >
                                                        {isDeleting ? <ActivityIndicator size="small" color={Colors.error} /> : <MaterialIcons name="delete-outline" size={20} color={Colors.error} />}
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}

                            <View style={styles.paginationRow}>
                                <Text style={styles.paginationText}>Showing <Text style={{ fontFamily: Fonts.bodyBold, color: Colors.onSurface }}>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, historicalRequests.length)}</Text> of {historicalRequests.length} logs</Text>
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
                        </ScrollView>
                    </>
                )}
            </View>

            <BottomNav activeTab="events" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    contentWrap: { flex: 1, paddingTop: 16, paddingHorizontal: Spacing.four },
    
    // Top Nav Construct matched to History View
    topNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.four },
    backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    mainTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.primary, letterSpacing: -0.5 },
    
    loaderFlow: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptySubtitle: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' },

    filterRowTarget: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.六 },
    filterTotalLabel: { fontFamily: Fonts.label, fontSize: 11, fontWeight: '900', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 1.5 },

    // Card Maps Output
    listFlow: { paddingBottom: 120, flexGrow: 1 },
    cardItem: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: Spacing.five, marginBottom: Spacing.four, shadowColor: '#191b23', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 32, elevation: 3, borderLeftWidth: 4 },
    borderApproved: { borderLeftColor: '#4ade80' },
    borderRejected: { borderLeftColor: Colors.error },
    
    cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.four },
    cardIdentity: { flexDirection: 'row', alignItems: 'center' },
    studentImgMockupSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.three },
    studentImgMockupSmallText: { fontFamily: Fonts.headlineExtraBold, fontSize: 14, color: Colors.onSurfaceVariant },
    cardIdentityName: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, color: Colors.onSurface },
    cardIdentityUser: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.outline },
    
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full },
    badgeApprovedBg: { backgroundColor: '#dcfce7' },
    badgeApprovedText: { color: '#166534', fontFamily: Fonts.label, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    badgeRejectedBg: { backgroundColor: Colors.errorContainer },
    badgeRejectedText: { color: Colors.onErrorContainer, fontFamily: Fonts.label, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },

    cardDataFlexGrid: { flexDirection: 'row', paddingVertical: Spacing.two },
    cardDataColumn: { flex: 1 },
    cardDataLabel: { fontFamily: Fonts.label, fontSize: 10, fontWeight: '900', color: Colors.outline, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    iconDataPair: { flexDirection: 'row', alignItems: 'center' },
    cardDataValue: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onSurfaceVariant, marginLeft: 4 },

    cardFooterDivider: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(195, 198, 215, 0.3)', paddingTop: Spacing.three, marginTop: Spacing.three },
    
    expiredFooterFlex: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
    expiredPillConstraint: { backgroundColor: Colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.outlineVariant },
    expiredPillTypography: { fontFamily: Fonts.label, fontSize: 9, color: Colors.onSurfaceVariant, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    deleteConstraintWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.errorContainer, alignItems: 'center', justifyContent: 'center' },

    // Pagination Reuse matching request constraint exactly
    paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.eight, paddingBottom: 20 },
    paginationText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant },
    paginationNavWrap: { flexDirection: 'row', alignItems: 'center' },
    pageBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    pageIndicationTarget: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
    pageIndicationNum: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onPrimary }
});
