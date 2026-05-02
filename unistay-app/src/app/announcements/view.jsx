import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_URL } from '@/constants/api';

export default function ViewAnnouncementsScreen() {
    const router = useRouter();
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch(`${API_URL}/api/announcements`);
            const data = await response.json();
            if (response.ok) {
                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Failed to fetch announcements:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenPDF = async (url) => {
        if (!url) return;
        
        if (Platform.OS === 'web') {
            try {
                // Add Cloudinary's native attachment flag
                const finalUrl = url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
                
                // Fetch the file directly to guarantee it downloads to File Explorer instead of opening in a new tab
                const response = await fetch(finalUrl);
                const blob = await response.blob();
                
                // Create object URL and trigger download
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.setAttribute('download', 'Announcement.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
                
                // Cleanup
                window.URL.revokeObjectURL(downloadUrl);
            } catch (error) {
                console.error("Strict download failed, falling back to openURL", error);
                Linking.openURL(url).catch(err => console.error("Couldn't open file", err));
            }
        } else {
            Linking.openURL(url).catch(err => console.error("Couldn't open file", err));
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={Colors.onSurface} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Announcements</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    Stay updated with the latest news and notices.
                </Text>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading Announcements...</Text>
                    </View>
                ) : announcements.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="notifications-none" size={48} color={Colors.outline} />
                        <Text style={styles.emptyText}>No announcements available right now.</Text>
                    </View>
                ) : (
                    announcements.map((item) => (
                        <View key={item._id} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialIcons name="campaign" size={24} color={Colors.primary} />
                                <Text style={styles.cardTitle}>{item.title}</Text>
                            </View>
                            <Text style={styles.cardBody}>
                                {item.message}
                            </Text>
                            
                            {item.pdfUrl && (
                                <TouchableOpacity 
                                    style={styles.pdfButton} 
                                    onPress={() => handleOpenPDF(item.pdfUrl)}
                                >
                                    <MaterialIcons name="picture-as-pdf" size={20} color={Colors.primary} />
                                    <Text style={styles.pdfButtonText}>View Attached PDF</Text>
                                    <MaterialIcons name="open-in-new" size={16} color={Colors.primary} style={{ marginLeft: 'auto' }} />
                                </TouchableOpacity>
                            )}

                            <View style={styles.cardFooter}>
                                <MaterialIcons name="event" size={16} color={Colors.outline} />
                                <Text style={styles.dateText}>
                                    {new Date(item.createdAt).toLocaleDateString(undefined, { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.four, paddingTop: Spacing.six, backgroundColor: Colors.surface, elevation: 2 },
    backButton: { padding: Spacing.two, marginRight: Spacing.two },
    headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface },
    content: { padding: Spacing.four },
    description: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, marginBottom: Spacing.six },
    
    loadingContainer: { alignItems: 'center', justifyContent: 'center', marginTop: Spacing.eight },
    loadingText: { fontFamily: Fonts.bodyMedium, color: Colors.onSurfaceVariant, marginTop: Spacing.four },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: Spacing.eight },
    emptyText: { fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.outline, marginTop: Spacing.four, textAlign: 'center' },

    card: { backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radius.lg, padding: Spacing.four, marginBottom: Spacing.four, shadowColor: '#191b23', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two, gap: Spacing.two },
    cardTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface, flex: 1 },
    cardBody: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant, marginBottom: Spacing.four, lineHeight: 22 },
    
    pdfButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryContainer, padding: Spacing.three, borderRadius: Radius.md, marginBottom: Spacing.four, gap: Spacing.two },
    pdfButtonText: { fontFamily: Fonts.bodyMedium, color: Colors.onPrimaryContainer },

    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, borderTopWidth: 1, borderTopColor: Colors.surfaceVariant, paddingTop: Spacing.three },
    dateText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.outline }
});
