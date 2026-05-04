import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@/constants/colors';
import { Fonts, Spacing, Radius } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { API_URL } from '@/constants/api';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

export default function ManageAnnouncementsScreen() {
    const router = useRouter();

    const [announcements, setAnnouncements] = useState([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [editingId, setEditingId] = useState(null);

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
            setIsLoadingList(false);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (result.canceled === false) {
                setFile(result.assets[0]);
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item._id);
        setTitle(item.title);
        setMessage(item.message);
        setFile(null);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setMessage('');
        setFile(null);
    };

    const handleSubmit = async () => {
        if (!title || !message || (!file && !editingId)) {
            Alert.alert("Missing Fields", "Please provide a title, message, and select a PDF file.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('message', message);

            // Append file carefully based on platform
            if (file) {
                if (Platform.OS === 'web' && file.file) {
                    formData.append('file', file.file);
                } else {
                    formData.append('file', {
                        uri: file.uri,
                        type: file.mimeType || 'application/pdf',
                        name: file.name
                    });
                }
            }

            const endpoint = editingId
                ? `${API_URL}/api/announcements/${editingId}`
                : `${API_URL}/api/announcements/create`;
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                // Important: DO NOT set Content-Type to multipart/form-data manually, fetch will do it with the boundary!
                body: formData,
            });

            if (response.ok) {
                Alert.alert("Success", `Announcement ${editingId ? 'updated' : 'created'} successfully!`);
                handleCancelEdit();
                fetchAnnouncements(); // refresh list
            } else {
                const data = await response.json();
                Alert.alert("Error from Server", data.message || "Failed to create announcement.");
                console.log("Server responded with:", data);
            }
        } catch (error) {
            console.error("Create error:", error);
            Alert.alert("Network Error", "Could not connect to the backend server. Is it running?");
        } finally {
            setIsSubmitting(false);
        }
    };

    const executeDelete = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/announcements/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                if (Platform.OS !== 'web') {
                    Alert.alert("Deleted", "Announcement removed.");
                }
                fetchAnnouncements();
            } else {
                if (Platform.OS === 'web') alert("Could not delete announcement.");
                else Alert.alert("Error", "Could not delete announcement.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            if (Platform.OS === 'web') alert("Could not delete announcement.");
            else Alert.alert("Error", "Could not delete announcement.");
        }
    };

    const handleDelete = async (id) => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to permanently delete this announcement?")) {
                executeDelete(id);
            }
        } else {
            Alert.alert("Delete Announcement", "Are you sure you want to permanently delete this announcement?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => executeDelete(id)
                }
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <Header />
            
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <Text style={styles.headerTitle}>Announcements</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>{editingId ? "Edit Announcement" : "Create New Announcement"}</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Announcement Title"
                        placeholderTextColor={Colors.outline}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Write message here..."
                        placeholderTextColor={Colors.outline}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <View style={styles.fileRow}>
                        <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                            <MaterialIcons name="upload-file" size={20} color={Colors.primary} />
                            <Text style={styles.uploadText}>{file ? "Change PDF" : "Select PDF"}</Text>
                        </TouchableOpacity>
                        {file && (
                            <Text style={styles.fileName} numberOfLines={1}>
                                {file.name}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.createButton, (!title || !message || (!file && !editingId) || isSubmitting) && styles.disabledButton]}
                        onPress={handleSubmit}
                        disabled={!title || !message || (!file && !editingId) || isSubmitting}
                    >
                        {isSubmitting ? <ActivityIndicator color={Colors.onPrimary} /> : (
                            <>
                                <MaterialIcons name={editingId ? "update" : "add-circle"} size={20} color={Colors.onPrimary} />
                                <Text style={styles.createText}>{editingId ? "Update Announcement" : "Create Announcement"}</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {editingId && (
                        <TouchableOpacity style={{ marginTop: Spacing.four, alignItems: 'center' }} onPress={handleCancelEdit}>
                            <Text style={{ fontFamily: Fonts.bodyMedium, color: Colors.error }}>Cancel Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.listSection}>
                    <Text style={styles.sectionTitle}>Manage Existing</Text>

                    {isLoadingList ? (
                        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.four }} />
                    ) : announcements.length === 0 ? (
                        <Text style={styles.emptyText}>No announcements found.</Text>
                    ) : (
                        announcements.map((item) => (
                            <View key={item._id} style={styles.announcementItem}>
                                <View style={styles.announcementInfo}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
                                        <MaterialIcons name="edit" size={20} color={Colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
                                        <MaterialIcons name="delete" size={20} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>

            <BottomNav activeTab="notifications" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.one, justifyContent: 'center' },
    backButton: { padding: Spacing.two, marginRight: Spacing.two },
    headerTitle: { fontFamily: Fonts.headlineExtraBold, fontSize: 20, color: Colors.onSurface },
    content: { padding: Spacing.four, paddingBottom: 100 },
    sectionTitle: { fontFamily: Fonts.headline, fontSize: 18, color: Colors.onSurface, marginBottom: Spacing.four },

    formCard: { backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.four, borderRadius: Radius.lg, marginBottom: Spacing.six, elevation: 3 },
    input: { backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radius.md, padding: Spacing.three, fontFamily: Fonts.bodyMedium, color: Colors.onSurface, marginBottom: Spacing.three },
    textArea: { height: 100 },

    fileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.four, gap: Spacing.three },
    uploadButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.primary, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Radius.md, gap: Spacing.one },
    uploadText: { fontFamily: Fonts.bodyMedium, color: Colors.primary },
    fileName: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurfaceVariant },

    createButton: { backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: Spacing.three, borderRadius: Radius.md, gap: Spacing.two },
    disabledButton: { opacity: 0.6 },
    createText: { fontFamily: Fonts.headline, color: Colors.onPrimary, fontSize: 16 },

    listSection: { marginTop: Spacing.two },
    emptyText: { fontFamily: Fonts.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center', marginTop: Spacing.four },
    announcementItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceContainerLowest, padding: Spacing.three, borderRadius: Radius.md, marginBottom: Spacing.three, elevation: 1 },
    announcementInfo: { flex: 1 },
    itemTitle: { fontFamily: Fonts.headline, fontSize: 16, color: Colors.onSurface, marginBottom: 2 },
    itemDate: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.outline },
    actionButtons: { flexDirection: 'row', gap: Spacing.two },
    editButton: { padding: Spacing.two, backgroundColor: Colors.primaryContainer, borderRadius: Radius.sm },
    deleteButton: { padding: Spacing.two, backgroundColor: Colors.errorContainer, borderRadius: Radius.sm }
});
