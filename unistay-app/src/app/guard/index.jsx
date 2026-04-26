import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { getItem } from '@/utils/storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import { API_URL } from '@/constants/api';

const { width } = Dimensions.get('window');

export default function GuardDashboard() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    
    // Scanner State
    const [cameraActive, setCameraActive] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    
    // Result Modals State
    const [scanResult, setScanResult] = useState(null);
    const [showGranted, setShowGranted] = useState(false);
    const [showDenied, setShowDenied] = useState(false);
    const [deniedMessage, setDeniedMessage] = useState("");
    
    // Action State
    const [selectedType, setSelectedType] = useState('entry'); // 'entry' or 'exit'
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // Current Date Formatter
    const [currentDateString, setCurrentDateString] = useState("");
    
    useEffect(() => {
        const now = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
        setCurrentDateString(`${now.toLocaleDateString('en-US', options)} • ${now.toLocaleTimeString('en-US', timeOptions)}`);
    }, []);

    const toggleCamera = async () => {
        if (!cameraActive) {
            if (!permission?.granted) {
                const req = await requestPermission();
                if (!req.granted) return;
            }
            setScanned(false);
        }
        setCameraActive(!cameraActive);
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        setCameraActive(false); // Pause camera
        setIsVerifying(true);

        try {
            const token = await getItem('userToken');
            
            const response = await fetch(`${API_URL}/api/attendance/verify-scan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ qrData: data })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setScanResult({ ...result.data, rawQrData: data });
                
                if (result.accessGranted) {
                    setSelectedType('entry'); // Reset to default
                    setIsDropdownOpen(false);
                    setShowGranted(true);
                } else {
                    setDeniedMessage(result.message || "Access outside allowed hours.");
                    setShowDenied(true);
                }
            } else {
                // Backend rejected it (e.g., completely unapproved QR, invalid format)
                setScanResult({ 
                    studentName: "Unknown Record", 
                    studentId: "N/A", 
                    timestamp: new Date()
                });
                setDeniedMessage(result.message || "Invalid QR Code scanned.");
                setShowDenied(true);
            }
        } catch (error) {
            console.error(error);
            setScanResult({ studentName: "Network Error" });
            setDeniedMessage("Failed to connect to the server.");
            setShowDenied(true);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleConfirmAndRecord = async () => {
        setIsRecording(true);
        try {
            const token = await getItem('userToken');
            
            const response = await fetch(`${API_URL}/api/attendance/scan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    qrData: scanResult.rawQrData,
                    type: selectedType
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Success! Close modal and prompt to scan next
                setShowGranted(false);
                setScanResult(null);
                setScanned(false);
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert("Failed to record attendance. Check network.");
        } finally {
            setIsRecording(false);
        }
    };

    const resetScanner = () => {
        setShowGranted(false);
        setShowDenied(false);
        setScanResult(null);
        setScanned(false);
        setCameraActive(true); // Auto restart camera
    };

    return (
        <View style={styles.container}>
            {/* Base Background Mesh Gradient Emulation */}
            <LinearGradient
                colors={['#004ac6', '#2563eb', '#00174b', '#191b23']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Glowing Decorative Orbs */}
            <View style={[styles.glowOrb, { top: '-10%', right: '-10%',backgroundColor: 'rgba(37, 99, 235, 0.15)' }]} />
            <View style={[styles.glowOrb, { bottom: '-10%', left: '-10%', backgroundColor: 'rgba(172, 191, 255, 0.1)' }]} />

            <View style={styles.contentWrap}>
                {/* Header Block */}
                <View style={styles.header}>
                    <Text style={styles.title}>Scan QR Code</Text>
                    <Text style={styles.subtitle}>{currentDateString}</Text>
                </View>

                {/* Center Scanner View Area */}
                <View style={styles.scannerCenterFlex}>
                    <View style={styles.scannerContainer}>
                        
                        {/* Main White Box */}
                        <View style={styles.scannerBox}>
                            {isVerifying ? (
                                <View style={styles.centered}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={[styles.helperText, { marginTop: 16 }]}>Verifying Rules...</Text>
                                </View>
                            ) : cameraActive ? (
                                <View style={styles.cameraMask}>
                                    <CameraView
                                        style={StyleSheet.absoluteFillObject}
                                        facing="back"
                                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                                    />
                                    {/* Small visual target brackets could go here */}
                                    <View style={styles.cameraOverlayBorder} />
                                </View>
                            ) : (
                                <View style={styles.centered}>
                                    <View style={styles.iconContainer}>
                                        <View style={styles.iconBorder} />
                                        <MaterialIcons name="qr-code-scanner" size={72} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.helperText}>Press the button below to start scanning</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Footer Controls */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={[styles.primaryButton, cameraActive && { backgroundColor: '#e1e2ed' }]} 
                        activeOpacity={0.8}
                        onPress={toggleCamera}
                        disabled={isVerifying}
                    >
                        <MaterialIcons 
                            name={cameraActive ? "videocam-off" : "center-focus-weak"} 
                            size={24} 
                            color={cameraActive ? Colors.onSurface : Colors.onPrimary} 
                        />
                        <Text style={[styles.primaryButtonText, cameraActive && { color: Colors.onSurface }]}>
                            {cameraActive ? "Cancel Scanning" : "Start Scanning"}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.footerBranding}>SECURITY VERIFIED BY UNISTAY</Text>
                </View>
            </View>

            {/* Access Granted Modal */}
            <Modal visible={showGranted} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.glassModal}>
                        {/* Status Graphic */}
                        <View style={[styles.statusIconBox, { backgroundColor: '#22c55e', shadowColor: '#22c55e' }]}>
                            <MaterialIcons name="check-circle" size={48} color="#ffffff" />
                        </View>
                        
                        <Text style={[styles.statusTitle, { color: '#22c55e' }]}>Access Granted</Text>
                        <Text style={styles.studentName}>{scanResult?.studentName}</Text>
                        <Text style={styles.studentId}>RESIDENT ID: {String(scanResult?.studentId).substring(0, 7).toUpperCase()}</Text>

                        {/* Custom Dropdown / Toggle for Entry/Exit */}
                        <View style={styles.dropdownContainer}>
                            <TouchableOpacity 
                                style={styles.dropdownButton} 
                                activeOpacity={0.8}
                                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <MaterialIcons name={selectedType === 'entry' ? "login" : "logout"} size={22} color={Colors.primary} />
                                    <Text style={styles.dropdownText}>{selectedType === 'entry' ? "Entry" : "Exit"}</Text>
                                </View>
                                <MaterialIcons 
                                    name="expand-more" 
                                    size={24} 
                                    color={Colors.outline} 
                                    style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}
                                />
                            </TouchableOpacity>

                            {isDropdownOpen && (
                                <View style={styles.dropdownMenu}>
                                    <TouchableOpacity 
                                        style={[styles.dropdownMenuItem, selectedType === 'entry' && styles.dropdownMenuItemActive]}
                                        onPress={() => { setSelectedType('entry'); setIsDropdownOpen(false); }}
                                    >
                                        <Text style={[styles.dropdownMenuText, selectedType === 'entry' && { color: Colors.primary }]}>Entry</Text>
                                    </TouchableOpacity>
                                    <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />
                                    <TouchableOpacity 
                                        style={[styles.dropdownMenuItem, selectedType === 'exit' && styles.dropdownMenuItemActive]}
                                        onPress={() => { setSelectedType('exit'); setIsDropdownOpen(false); }}
                                    >
                                        <Text style={[styles.dropdownMenuText, selectedType === 'exit' && { color: Colors.primary }]}>Exit</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Metadata Block */}
                        <View style={styles.metadataBox}>
                            <View style={styles.metadataRow}>
                                <Text style={styles.metadataLabel}>TIMESTAMP</Text>
                                <Text style={styles.metadataValue}>
                                    {scanResult?.timestamp ? new Date(scanResult.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                                </Text>
                            </View>
                        </View>

                        {/* Actions */}
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAndRecord} disabled={isRecording}>
                            {isRecording ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Confirm & Record</Text>}
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.dismissButton} onPress={resetScanner} disabled={isRecording}>
                            <Text style={styles.dismissButtonText}>Dismiss and Re-scan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


            {/* Access Denied Modal */}
            <Modal visible={showDenied} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.glassModal}>
                        {/* Status Graphic */}
                        <View style={[styles.statusIconBox, { backgroundColor: '#EF4444', shadowColor: '#EF4444' }]}>
                            <MaterialIcons name="error" size={48} color="#ffffff" />
                        </View>
                        
                        <Text style={[styles.statusTitle, { color: '#EF4444' }]}>Access Denied</Text>
                        <Text style={styles.studentName}>{scanResult?.studentName || 'Unknown Student'}</Text>
                        <Text style={styles.studentId}>RESIDENT ID: {scanResult?.studentId ? String(scanResult.studentId).substring(0, 7).toUpperCase() : 'N/A'}</Text>
                        
                        {/* Metadata Block */}
                        <View style={[styles.metadataBox, { backgroundColor: 'transparent', padding: 0 }]}>
                            <View style={[styles.metadataRow, { flexDirection: 'column', alignItems: 'center', gap: 8 }]}>
                                <Text style={styles.metadataLabel}>REASON</Text>
                                <Text style={[styles.metadataValue, { color: '#EF4444', textAlign: 'center' }]}>
                                    {deniedMessage}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.metadataBox, { width: '100%', alignItems: 'center', backgroundColor: 'transparent' }]}>
                            <Text style={styles.metadataLabel}>TIMESTAMP</Text>
                            <Text style={[styles.metadataValue, { fontSize: 20 }]}>
                                {scanResult?.timestamp ? new Date(scanResult.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </Text>
                        </View>

                        {/* Actions */}
                        <TouchableOpacity style={styles.confirmButton} onPress={resetScanner}>
                            <Text style={styles.confirmButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#004ac6' },
    contentWrap: { flex: 1, paddingHorizontal: 32, paddingTop: 80, paddingBottom: 48, zIndex: 10 },
    
    // Fallback native glow emulations instead of CSS filters
    glowOrb: { position: 'absolute', width: '60%', height: '60%', borderRadius: 999, opacity: 0.6 },
    
    header: { marginBottom: 48 },
    title: { fontFamily: Fonts.headlineExtraBold, fontSize: 36, color: Colors.onPrimary, letterSpacing: -1, marginBottom: 8 },
    subtitle: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
    
    scannerCenterFlex: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    scannerContainer: { position: 'relative', width: '100%', maxWidth: 320, alignItems: 'center' },
    
    // Layered Opacity Halos to simulate React Native blur!
    
    scannerBox: { width: 280, height: 280, alignSelf: 'center', backgroundColor: '#ffffff', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 32 }, shadowOpacity: 0.15, shadowRadius: 64, elevation: 16 },
    
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    iconContainer: { marginBottom: 24, position: 'relative' },
    iconBorder: { position: 'absolute', top: -16, left: -16, right: -16, bottom: -16, borderWidth: 2, borderColor: 'rgba(0, 74, 198, 0.1)', borderRadius: 24 },
    helperText: { fontFamily: Fonts.bodyMedium, color: Colors.onSurfaceVariant, fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 180 },
    
    cameraMask: { flex: 1, borderRadius: 16, overflow: 'hidden', position: 'relative' },
    cameraOverlayBorder: { position: 'absolute', borderWidth: 2, borderColor: 'rgba(37, 99, 235, 0.5)', top: '10%', left: '10%', right: '10%', bottom: '10%', borderRadius: 12 },

    footer: { marginTop: 48, width: '100%', maxWidth: 400, alignSelf: 'center' },
    primaryButton: { width: '100%', height: 64, backgroundColor: Colors.primaryContainer, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
    primaryButtonText: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: Colors.onPrimary },
    footerBranding: { fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 32, letterSpacing: 2, fontWeight: '700' },

    // Modal Styles
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 23, 75, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    glassModal: { width: '100%', maxWidth: 350, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: 48, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 32 }, shadowOpacity: 0.3, shadowRadius: 64, elevation: 24 },
    statusIconBox: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 32, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
    statusTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, marginBottom: 4 },
    studentName: { fontFamily: Fonts.headlineExtraBold, fontSize: 30, color: Colors.onSurface, marginBottom: 4, textAlign: 'center' },
    studentId: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onSurfaceVariant, letterSpacing: 2, marginBottom: 40 },
    
    dropdownContainer: { width: '100%', marginBottom: 32, position: 'relative', zIndex: 50 },
    dropdownButton: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(195, 198, 215, 0.3)', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    dropdownText: { fontFamily: Fonts.headlineExtraBold, fontSize: 16, color: Colors.onSurface },
    dropdownMenu: { position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: 'rgba(195, 198, 215, 0.3)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
    dropdownMenuItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
    dropdownMenuItemActive: { backgroundColor: 'rgba(0, 74, 198, 0.05)' },
    dropdownMenuText: { fontFamily: Fonts.headlineExtraBold, fontSize: 15, color: Colors.onSurfaceVariant },

    metadataBox: { width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 24, padding: 24, marginBottom: 40 },
    metadataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    metadataLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.onSurfaceVariant, letterSpacing: 2 },
    metadataValue: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.onSurface },

    confirmButton: { width: '100%', backgroundColor: Colors.primaryContainer, paddingVertical: 20, borderRadius: 16, shadowColor: Colors.primaryContainer, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8, marginBottom: 24, alignItems: 'center' },
    confirmButtonText: { fontFamily: Fonts.headlineExtraBold, fontSize: 18, color: '#fff' },
    dismissButton: { alignItems: 'center' },
    dismissButtonText: { fontFamily: Fonts.headlineExtraBold, fontSize: 14, color: Colors.primaryContainer }
});