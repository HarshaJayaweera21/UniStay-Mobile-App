import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getItem } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

export default function StudentQR() {
    const router = useRouter();
    const [qrData, setQrData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchMyQR();
    }, []);

    useEffect(() => {
        // Simple infinite pulse animation for the active indicator
        if (qrData?.isApproved) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.4,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        }
    }, [qrData?.isApproved]);

    const fetchMyQR = async () => {
        try {
            const token = await getItem('userToken');
            if (!token) {
                setError('Unauthorized access');
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/api/qr/my-qr`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to fetch QR');
            } else {
                setQrData(data);
            }
        } catch (err) {
            console.error(err);
            setError('Network connection failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <MaterialIcons name="error-outline" size={48} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchMyQR}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const studentName = qrData?.student
        ? `${qrData.student.firstName} ${qrData.student.lastName}`
        : "Unknown Student";

    return (
        <View style={styles.container}>
            {/* Mesh Gradient Emulation */}
            <LinearGradient
                colors={['#dbe1ff', '#faf8ff']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Top Navigation Anchor */}
            <Header />
            {/* <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <Text style={styles.headerTitle}>MY QR CODE</Text>
            </View> */}

            {/* Main Content Canvas */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <Text style={styles.profileName}>{studentName}</Text>
                    <Text style={styles.studentId}>{qrData?.student?.email || 'No email'}</Text>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: qrData.isApproved ? 'rgba(22, 163, 74, 0.1)' : 'rgba(186, 26, 26, 0.1)' }]}>
                        <Animated.View style={[styles.statusDot, {
                            backgroundColor: qrData.isApproved ? '#16a34a' : Colors.error,
                            opacity: qrData.isApproved ? pulseAnim : 1
                        }]} />
                        <Text style={[styles.statusText, { color: qrData.isApproved ? '#16a34a' : Colors.error }]}>
                            {qrData.isApproved ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                    </View>
                </View>

                {/* QR Code Card */}
                <View style={styles.qrContainerWrapper}>
                    <View style={styles.glowOverlay} />
                    <View style={styles.qrCard}>
                        {/* Mesh inside card */}
                        <LinearGradient
                            colors={['transparent', 'rgba(219, 225, 255, 0.3)']}
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.qrInnerBox}>
                            {qrData?.qrCodeUrl ? (
                                <Image
                                    source={{ uri: qrData.qrCodeUrl }}
                                    style={styles.qrImage}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Text style={{ fontFamily: Fonts.bodyMedium, color: Colors.outline }}>No Code Assigned</Text>
                            )}
                        </View>

                        <View style={styles.securedRow}>
                            <MaterialIcons name="verified" size={14} color={Colors.outline} />
                            <Text style={styles.securedText}>IDENTITY SECURED</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.helperText}>
                    Present this code at any authorized campus terminal to verify your student status and gain access to facilities.
                </Text>

                <TouchableOpacity
                    style={styles.historyButton}
                    activeOpacity={0.8}
                    onPress={() => router.push('/student/attendance-history')}
                >
                    <Text style={styles.historyButtonText}>View Attendance History</Text>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.primaryContainer} />
                </TouchableOpacity>

            </ScrollView>

            <BottomNav activeTab="scanner" />

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surfaceContainerLow },
    centerAll: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
    centerAll: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
    headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface, letterSpacing: -0.5 },
    content: { flexGrow: 1, alignItems: 'center', paddingTop: Spacing.five, paddingHorizontal: Spacing.five, paddingBottom: 110 },
    profileSection: { alignItems: 'center', marginBottom: Spacing.four, width: '100%' },
    avatarContainer: {
        position: 'relative',
        marginBottom: Spacing.four,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.surfaceContainerLowest,
        borderWidth: 4,
        borderColor: Colors.surfaceContainerLowest,
    },
    badgeAnchor: {
        position: 'absolute',
        bottom: -4,
        alignSelf: 'center',
        backgroundColor: Colors.surfaceContainerLowest,
        padding: 4,
        borderRadius: Radius.full,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.three,
        paddingVertical: 4,
        borderRadius: Radius.full,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontFamily: Fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 },
    profileName: { fontFamily: Fonts.headlineExtraBold, fontSize: 26, color: Colors.onSurface, marginBottom: 4, letterSpacing: -0.5 },
    studentId: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.three },
    qrContainerWrapper: {
        position: 'relative',
        width: '100%',
        maxWidth: 320,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.four
    },
    glowOverlay: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 74, 198, 0.05)',
        borderRadius: 160,
    },
    qrCard: {
        width: '100%',
        height: '100%',
        backgroundColor: Colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        padding: Spacing.five,
        paddingLeft: 32,
        paddingRight: 32,
        paddingTop: 32,
        paddingBottom: 32,
        shadowColor: '#004ac6',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.12,
        shadowRadius: 40,
        elevation: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    qrInnerBox: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#ffffff',
        borderRadius: Radius.md,
        padding: Spacing.three,
        alignItems: 'center',
        justifyContent: 'center'
    },
    qrImage: { width: '100%', height: '100%', opacity: 0.95 },
    securedRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.five, opacity: 0.4 },
    securedText: { fontFamily: Fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, marginLeft: Spacing.one },
    helperText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.four },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#e2e8f0',
        paddingHorizontal: Spacing.five,
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#191b23',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 2
    },
    historyButtonText: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.onSurface },
    errorText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.error, marginTop: Spacing.three, marginBottom: Spacing.four },
    retryButton: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, backgroundColor: Colors.primaryContainer, borderRadius: Radius.md },
    retryButtonText: { fontFamily: Fonts.bodyBold, color: Colors.onPrimary }
});
