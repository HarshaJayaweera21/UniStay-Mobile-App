import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getItem } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import BottomNav from '@/components/BottomNav';

export default function AttendanceHistory() {
    const router = useRouter();
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (activeFilter === 'All') {
            setFilteredLogs(logs);
        } else {
            setFilteredLogs(logs.filter(log => log.type.toLowerCase() === activeFilter.toLowerCase()));
        }
    }, [activeFilter, logs]);

    const fetchHistory = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = await getItem('userToken');
            if (!token) {
                setError('Unauthorized access');
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/api/attendance/mine`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to fetch attendance history');
            } else {
                setLogs(data.data || []);
            }
        } catch (err) {
            console.error(err);
            setError('Network connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isYesterday = (date) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();
    };

    const groupLogsByDate = (logsArray) => {
        const grouped = {};
        logsArray.forEach(log => {
            const dateObj = new Date(log.timestamp);
            let dateKey = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            
            if (isToday(dateObj)) dateKey = 'TODAY';
            else if (isYesterday(dateObj)) dateKey = 'YESTERDAY';
            
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(log);
        });
        return grouped;
    };

    const groupedData = groupLogsByDate(filteredLogs);

    // RENDER FUNCTIONS
    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
                <MaterialIcons name="calendar-month" size={48} color={Colors.primary} />
                <View style={styles.emptyIconBadge}>
                    <MaterialIcons name="history" size={24} color={Colors.primary} />
                </View>
            </View>
            <Text style={styles.emptyStateTitle}>No attendance records yet</Text>
            <Text style={styles.emptyStateDesc}>
                Your entry and exit history will appear here once you start scanning in at the main gate.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchHistory} activeOpacity={0.8}>
                <Text style={styles.refreshButtonText}>REFRESH DATA</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItemCard = (item, index) => {
        const isEntry = item.type === 'entry';
        const dateObj = new Date(item.timestamp);
        const timeString = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateString = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
        const badgeText = item.leavePass ? 'LEAVE PASS' : 'NORMAL HOURS';
        const badgeColor = item.leavePass ? '#7e22ce' : Colors.primary; // Purple for leave pass, primary for normal
        const badgeBg = item.leavePass ? '#faf5ff' : '#eff6ff';

        return (
            <View key={item._id || index} style={styles.recordCard}>
                <View style={[styles.iconBox, { backgroundColor: isEntry ? '#f0fdf4' : '#fff7ed' }]}>
                    <MaterialIcons 
                        name={isEntry ? 'north-east' : 'south-east'} 
                        size={24} 
                        color={isEntry ? '#16a34a' : '#ea580c'} 
                    />
                </View>
                <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: isEntry ? '#16a34a' : '#ea580c' }]}>
                        {isEntry ? 'Entry' : 'Exit'}
                    </Text>
                    <Text style={styles.cardDate}>{dateString}</Text>
                    <Text style={styles.cardTime}>{timeString}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Mesh Gradient Background */}
            <LinearGradient
                colors={['#dbe1ff', '#faf8ff']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <MaterialIcons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance History</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Main Content */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* Filters */}
                <View style={styles.filterContainer}>
                    {['All', 'Entry', 'Exit'].map(filter => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterButton,
                                activeFilter === filter ? styles.filterButtonActive : styles.filterButtonInactive
                            ]}
                            onPress={() => setActiveFilter(filter)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter ? styles.filterTextActive : styles.filterTextInactive
                            ]}>
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* State Handling */}
                {isLoading ? (
                    <View style={styles.centerAll}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.centerAll}>
                        <MaterialIcons name="error-outline" size={48} color={Colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.errorRetryButton} onPress={fetchHistory}>
                            <Text style={styles.errorRetryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredLogs.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <View style={styles.listContainer}>
                        {Object.keys(groupedData).map(dateKey => (
                            <View key={dateKey}>
                                <View style={styles.dateGroupHeader}>
                                    <Text style={styles.dateGroupText}>{dateKey}</Text>
                                </View>
                                {groupedData[dateKey].map((item, index) => renderItemCard(item, index))}
                            </View>
                        ))}

                        {/* Static Pagination for visual completeness */}
                        {logs.length > 0 && (
                            <View style={styles.pagination}>
                                <TouchableOpacity activeOpacity={0.7}>
                                    <Text style={styles.pageButtonText}>Previous</Text>
                                </TouchableOpacity>
                                <Text style={styles.pageText}>Page 1 of 1</Text>
                                <TouchableOpacity activeOpacity={0.7}>
                                    <Text style={styles.pageButtonText}>Next</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
            
            <BottomNav activeTab="scanner" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surfaceContainerLow },
    centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.four,
        paddingTop: 60,
        paddingBottom: Spacing.three,
        backgroundColor: 'rgba(250, 248, 255, 0.8)',
        zIndex: 50
    },
    backButton: { padding: 8, borderRadius: Radius.full, backgroundColor: '#f3f3fe' },
    headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onSurface, letterSpacing: -0.5 },
    content: { flexGrow: 1, paddingHorizontal: Spacing.five, paddingTop: Spacing.four, paddingBottom: 110 },
    
    // Filters
    filterContainer: { flexDirection: 'row', gap: 8, marginBottom: Spacing.six },
    filterButton: { flex: 1, height: 48, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
    filterButtonActive: { backgroundColor: Colors.primaryContainer },
    filterButtonInactive: { backgroundColor: Colors.surfaceContainerHigh },
    filterText: { fontFamily: Fonts.headlineSemiBold, fontSize: 14 },
    filterTextActive: { color: Colors.onPrimary },
    filterTextInactive: { color: Colors.onSurfaceVariant },

    // Empty State
    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyIconCircle: { 
        width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primaryFixed, 
        justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.five,
        position: 'relative'
    },
    emptyIconBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    emptyStateTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, marginBottom: Spacing.two, textAlign: 'center' },
    emptyStateDesc: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', maxWidth: 280, marginBottom: Spacing.six, lineHeight: 22 },
    refreshButton: { backgroundColor: Colors.secondaryContainer, height: 48, paddingHorizontal: 32, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
    refreshButtonText: { fontFamily: Fonts.headlineSemiBold, fontSize: 14, color: Colors.onSecondaryContainer, textTransform: 'uppercase', letterSpacing: 0.5 },

    // List & Cards
    listContainer: { paddingBottom: Spacing.four },
    dateGroupHeader: { paddingVertical: Spacing.three, marginTop: Spacing.two },
    dateGroupText: { fontFamily: Fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: Colors.outline },
    
    recordCard: {
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.md,
        padding: Spacing.four,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.three,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 32,
        elevation: 2
    },
    iconBox: { width: 44, height: 44, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.four },
    cardContent: { flex: 1, justifyContent: 'center' },
    cardTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, marginBottom: 2 },
    cardDate: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant, marginBottom: 2 },
    cardTime: { fontFamily: Fonts.bodySemiBold, fontSize: 11, color: Colors.outline },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full },
    badgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

    // Pagination
    pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surfaceContainerLow, padding: Spacing.four, borderRadius: Radius.md, marginTop: Spacing.six },
    pageButtonText: { fontFamily: Fonts.headlineSemiBold, fontSize: 14, color: Colors.primary, paddingHorizontal: Spacing.two },
    pageText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.onSurfaceVariant },

    // Error
    errorText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.error, marginTop: Spacing.three, marginBottom: Spacing.four },
    errorRetryButton: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, backgroundColor: Colors.primaryContainer, borderRadius: Radius.md },
    errorRetryText: { fontFamily: Fonts.bodyBold, color: Colors.onPrimary }
});
