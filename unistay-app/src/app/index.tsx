import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  createRoomRequest,
  Faculty,
  Gender,
  getStudentRoomDashboard,
  PaymentMethod,
  RoomSummary,
  YearOfStudy,
} from "@/lib/roomRequestsApi";

type RoomCategory = "single" | "double";

/* ── Editorial Palette ── */
const ed = {
  surface: "#faf8ff",
  surfaceLow: "#f3f3fe",
  surfaceLowest: "#ffffff",
  surfaceHigh: "#e7e7f3",
  surfaceHighest: "#e1e2ed",
  primary: "#004ac6",
  primaryContainer: "#2563eb",
  primaryFixed: "#dbe1ff",
  secondaryContainer: "#acbfff",
  onSurface: "#191b23",
  mutedText: "#4e5364",
  outlineVariant: "rgba(195,198,215,0.20)",
  onPrimary: "#ffffff",
} as const;

const YEARS: YearOfStudy[] = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const FACULTIES: { label: string; value: Faculty }[] = [
  { label: "Faculty of Computing", value: "Faculty of Computing" },
  { label: "Faculty of Business Management", value: "Faculty of Business Management" },
  { label: "Other", value: "Other" },
];
const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Bank Transfer", value: "bank-transfer" },
  { label: "Cash", value: "cash" },
  { label: "Other", value: "other" },
];

export default function RequestRoomScreen() {
  // Auto-filled for development as per user request
  const token = process.env.EXPO_PUBLIC_STUDENT_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWQxMTMxNWEzZWU2MjRmYmYwMWRlY2EiLCJpYXQiOjE3NzY3MjMwNDIsImV4cCI6MTc3OTMxNTA0Mn0.qRYCasXzZotsBu6aXDniLioVrq_ojTkrstaCGruUtmg";

  const [studentName, setStudentName] = useState("");
  const [studentItNumber, setStudentItNumber] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank-transfer");
  const [roomId, setRoomId] = useState("");
  const [availableRooms, setAvailableRooms] = useState<RoomSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory>("double");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [proofUri, setProofUri] = useState<string>();
  const [proofName, setProofName] = useState<string>();
  const [proofType, setProofType] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Guardian & Emergency
  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Medical Information
  const [medicalConditions, setMedicalConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");

  const pickProof = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const selected = result.assets[0];
    setProofUri(selected.uri);
    setProofName(selected.name);
    setProofType(selected.mimeType);
  }, []);

  const submitRequest = useCallback(async () => {
    if (!studentName.trim() || !studentItNumber.trim()) {
      setMessage("Please enter your name and IT number.");
      setIsError(true);
      return;
    }
    if (!gender) {
      setMessage("Please select your gender.");
      setIsError(true);
      return;
    }
    if (!yearOfStudy) {
      setMessage("Please select your year of study.");
      setIsError(true);
      return;
    }
    if (!faculty) {
      setMessage("Please select your faculty.");
      setIsError(true);
      return;
    }
    setSubmitting(true);
    setMessage("");

    try {
      const created = await createRoomRequest(token, {
        roomType: selectedCategory,
        roomId: roomId || undefined,
        studentName: studentName.trim(),
        studentItNumber: studentItNumber.trim().toUpperCase(),
        gender: gender as Gender,
        yearOfStudy,
        faculty,
        paymentMethod,
        paymentProofUri: proofUri,
        paymentProofName: proofName,
        paymentProofType: proofType,
        guardianName: guardianName.trim(),
        guardianContact: guardianContact.trim(),
        emergencyName: emergencyName.trim(),
        emergencyPhone: emergencyPhone.trim(),
        medicalConditions: medicalConditions.trim(),
        allergies: allergies.trim(),
        medications: medications.trim(),
      });
      setMessage(`Request submitted successfully (${created.status})`);
      setIsError(false);
      setRoomId("");
      setProofUri(undefined);
      setProofName(undefined);
      setProofType(undefined);
      setStudentName("");
      setStudentItNumber("");
      setGender(null);
      setYearOfStudy(null);
      setFaculty(null);
      setGuardianName("");
      setGuardianContact("");
      setEmergencyName("");
      setEmergencyPhone("");
      setMedicalConditions("");
      setAllergies("");
      setMedications("");
      const dashboard = await getStudentRoomDashboard(token);
      setAvailableRooms(dashboard.availableRooms);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to submit request");
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
    }, [
      faculty,
      gender,
      paymentMethod,
      proofName,
      proofType,
      proofUri,
      roomId,
      studentItNumber,
      studentName,
      token,
      yearOfStudy,
      guardianName,
      guardianContact,
      emergencyName,
      emergencyPhone,
      medicalConditions,
      allergies,
      medications,
    ]);

  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room._id === roomId),
    [availableRooms, roomId]
  );

  const inferCategory = useCallback((room: RoomSummary): RoomCategory => {
    if (room.roomType) return room.roomType;
    if (room.capacity <= 1) return "single";
    return "double";
  }, []);

  const filteredRooms = useMemo(() => {
    return availableRooms.filter((room) => {
      const isRightCategory = inferCategory(room) === selectedCategory;
      if (!isRightCategory) return false;
      if (!gender) return true;
      const expectedWing = gender === "male" ? "boys" : "girls";
      return room.wing === expectedWing || room.wing === "unassigned" || !room.wing;
    });
  }, [availableRooms, inferCategory, selectedCategory, gender]);

  const roomCategoryPhotos = useMemo(() => {
    if (gender === "female") {
      return {
        single: [require("@/assets/images/rooms/female-wing-1.png")],
        double: [require("@/assets/images/rooms/female-wing-2.png"), require("@/assets/images/rooms/female-wing-1.png")],
      };
    }
    if (gender === "male") {
      return {
        single: [require("@/assets/images/rooms/male-wing-1.png")],
        double: [require("@/assets/images/rooms/male-wing-2.png"), require("@/assets/images/rooms/male-wing-1.png")],
      };
    }
    return {
      single: [require("@/assets/images/rooms/single-1.png")],
      double: [
        require("@/assets/images/rooms/double-1.png"),
        require("@/assets/images/rooms/double-2.png"),
        require("@/assets/images/rooms/double-3.png"),
      ],
    };
  }, [gender]);

  const loadAvailableRooms = useCallback(async () => {
    if (!token) return;
    setLoadingRooms(true);
    setMessage("");
    try {
      const dashboard = await getStudentRoomDashboard(token);
      setAvailableRooms(dashboard.availableRooms);
      if (!dashboard.availableRooms.length) {
        setMessage("No available rooms right now.");
        setIsError(false);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load rooms");
      setIsError(true);
    } finally {
      setLoadingRooms(false);
    }
  }, [token]);

  useEffect(() => {
    loadAvailableRooms();
  }, [loadAvailableRooms]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <ThemedText style={styles.display}>
              Request Your Room
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Fill in your details, choose a room, and submit your allocation request.
            </ThemedText>
          </View>

          {/* ── Personal Details ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Personal Details</ThemedText>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.label}>FULL NAME</ThemedText>
                  <TextInput
                    value={studentName}
                    onChangeText={setStudentName}
                    placeholder="Enter full name"
                    placeholderTextColor={ed.mutedText}
                    style={styles.input}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.label}>IT NUMBER</ThemedText>
                  <TextInput
                    value={studentItNumber}
                    onChangeText={setStudentItNumber}
                    placeholder="e.g. IT2026-0012"
                    autoCapitalize="characters"
                    placeholderTextColor={ed.mutedText}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={{ height: 12 }} />

              <ThemedText style={styles.label}>GENDER</ThemedText>
              <View style={styles.chipRow}>
                <Pressable
                  onPress={() => { setGender("male"); setRoomId(""); }}
                  style={[styles.chip, gender === "male" && styles.chipSelected]}>
                  <ThemedText style={[styles.chipText, gender === "male" && styles.chipTextSelected]}>
                    Male
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => { setGender("female"); setRoomId(""); }}
                  style={[styles.chip, gender === "female" && styles.chipSelected]}>
                  <ThemedText style={[styles.chipText, gender === "female" && styles.chipTextSelected]}>
                    Female
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* ── Academic Information ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Academic Information</ThemedText>
            <View style={styles.card}>
              <ThemedText style={styles.label}>CURRENT YEAR OF STUDY</ThemedText>
              <View style={styles.chipRow}>
                {YEARS.map((year) => (
                  <Pressable
                    key={year}
                    onPress={() => setYearOfStudy(year)}
                    style={[styles.chip, yearOfStudy === year && styles.chipSelected]}>
                    <ThemedText
                      style={[styles.chipText, yearOfStudy === year && styles.chipTextSelected]}>
                      {year}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={{ height: 12 }} />

              <ThemedText style={styles.label}>FACULTY OF STUDY</ThemedText>
              <View style={styles.chipRow}>
                {FACULTIES.map((f) => (
                  <Pressable
                    key={f.value}
                    onPress={() => setFaculty(f.value)}
                    style={[styles.chip, faculty === f.value && styles.chipSelected]}>
                    <ThemedText
                      style={[styles.chipText, faculty === f.value && styles.chipTextSelected]}>
                      {f.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* ── Payment Method ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Payment Method</ThemedText>
            <View style={styles.card}>
              <View style={styles.chipRow}>
                {PAYMENT_METHODS.map((pm) => (
                  <Pressable
                    key={pm.value}
                    onPress={() => {
                      setPaymentMethod(pm.value);
                      if (pm.value !== "bank-transfer") {
                        setProofUri(undefined);
                        setProofName(undefined);
                        setProofType(undefined);
                      }
                    }}
                    style={[styles.chip, paymentMethod === pm.value && styles.chipSelected]}>
                    <ThemedText
                      style={[styles.chipText, paymentMethod === pm.value && styles.chipTextSelected]}>
                      {pm.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {paymentMethod === "bank-transfer" ? (
                <View style={{ marginTop: 12 }}>
                  <ThemedText style={styles.label}>PAYMENT PROOF</ThemedText>
                  <Pressable onPress={pickProof} style={styles.uploadArea}>
                    <ThemedText style={styles.uploadText}>
                      {proofName ? proofName : "Tap to upload payment proof (image / PDF)"}
                    </ThemedText>
                    {proofName ? (
                      <ThemedText style={styles.uploadHint}>Tap to change</ThemedText>
                    ) : null}
                  </Pressable>

                </View>
              ) : (
                <View style={styles.infoStrip}>
                  <ThemedText style={styles.infoStripText}>
                    Contact the hostel management for alternative payment arrangements.
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* ── Guardian & Emergency ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Guardian & Emergency</ThemedText>
            <View style={styles.card}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.label}>GUARDIAN NAME</ThemedText>
                  <TextInput
                    value={guardianName}
                    onChangeText={setGuardianName}
                    placeholder="Guardian Name"
                    placeholderTextColor={ed.mutedText}
                    style={styles.input}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.label}>GUARDIAN CONTACT</ThemedText>
                  <TextInput
                    value={guardianContact}
                    onChangeText={setGuardianContact}
                    placeholder="0123456789"
                    keyboardType="phone-pad"
                    placeholderTextColor={ed.mutedText}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={{ height: 12 }} />

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.label}>EMERGENCY NAME</ThemedText>
                  <TextInput
                    value={emergencyName}
                    onChangeText={setEmergencyName}
                    placeholder="Emergency Contact Name"
                    placeholderTextColor={ed.mutedText}
                    style={styles.input}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.label}>EMERGENCY PHONE</ThemedText>
                  <TextInput
                    value={emergencyPhone}
                    onChangeText={setEmergencyPhone}
                    placeholder="0987654321"
                    keyboardType="phone-pad"
                    placeholderTextColor={ed.mutedText}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* ── Medical Information ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Medical Information</ThemedText>
            <View style={styles.card}>
              <ThemedText style={styles.label}>CONDITIONS</ThemedText>
              <TextInput
                value={medicalConditions}
                onChangeText={setMedicalConditions}
                placeholder="e.g. Asthma, Diabetes"
                placeholderTextColor={ed.mutedText}
                style={styles.input}
              />

              <View style={{ height: 12 }} />

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.label}>ALLERGIES</ThemedText>
                  <TextInput
                    value={allergies}
                    onChangeText={setAllergies}
                    placeholder="None or specify"
                    placeholderTextColor={ed.mutedText}
                    style={styles.input}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <ThemedText style={styles.label}>MEDICATIONS</ThemedText>
                  <TextInput
                    value={medications}
                    onChangeText={setMedications}
                    placeholder="Current medications"
                    placeholderTextColor={ed.mutedText}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* ── Room Preference ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Room Preference</ThemedText>
            <View style={styles.card}>
              {loadingRooms ? <ActivityIndicator color={ed.primary} /> : null}

              <View style={styles.chipRow}>
                {(["single", "double"] as RoomCategory[]).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { setSelectedCategory(cat); setRoomId(""); }}
                    style={[styles.chip, selectedCategory === cat && styles.chipSelected]}>
                    <ThemedText
                      style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>
                      {`${cat[0].toUpperCase()}${cat.slice(1)} Room`}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {/* ── Room Type Description ── */}
              {selectedCategory === "single" ? (
                <View style={styles.roomDescCard}>
                  <View style={styles.roomDescIconRow}>
                    <View style={styles.roomDescIconBadge}>
                      <ThemedText style={styles.roomDescIcon}>🛏</ThemedText>
                    </View>
                    <ThemedText style={styles.roomDescTitle}>Single Room</ThemedText>
                  </View>
                  <ThemedText style={styles.roomDescText}>
                    A single room is designed for one person only. It includes one bed and offers full privacy, with no sharing required. This option is ideal for individuals who prefer a quiet and private space.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.roomDescCard}>
                  <View style={styles.roomDescIconRow}>
                    <View style={styles.roomDescIconBadge}>
                      <ThemedText style={styles.roomDescIcon}>🛏🛏</ThemedText>
                    </View>
                    <ThemedText style={styles.roomDescTitle}>Double Room</ThemedText>
                  </View>
                  <ThemedText style={styles.roomDescText}>
                    A double room is designed for two people. It includes either two separate beds or one shared double bed. In hostel settings, it usually means sharing the room with another person, each having their own bed.
                  </ThemedText>
                </View>
              )}

              <View style={styles.infoStrip}>
                <ThemedText style={styles.infoStripText}>
                  Your request will be submitted for a {selectedCategory} room. The specific room number will be assigned upon approval.
                </ThemedText>
              </View>
            </View>
          </View>

          {/* ── Submit ── */}
          <Pressable
            onPress={submitRequest}
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={ed.onPrimary} />
            ) : (
              <ThemedText style={styles.submitText}>Submit Request</ThemedText>
            )}
          </Pressable>

          {message ? (
            <View style={[styles.messageStrip, isError && styles.messageStripError]}>
              <ThemedText style={[styles.messageText, isError && { color: "#b23a3a" }]}>
                {message}
              </ThemedText>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ed.surface },
  safeArea: { flex: 1 },
  content: { padding: 20, gap: 10 },

  hero: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 16,
    padding: 24,
    gap: 10,
  },
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: ed.onSurface,
  },
  subtitle: {
    color: ed.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },

  section: { gap: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: ed.onSurface,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: ed.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },

  fieldRow: { flexDirection: "row", gap: 12 },
  fieldHalf: { flex: 1, gap: 6 },

  label: {
    color: ed.mutedText,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: ed.surfaceHigh,
    borderRadius: 12,
    color: ed.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: {
    backgroundColor: ed.primaryFixed,
  },
  chipText: {
    color: ed.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextSelected: {
    color: ed.primary,
  },

  uploadArea: {
    backgroundColor: ed.surfaceHigh,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  uploadText: {
    color: ed.primary,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  uploadHint: {
    color: ed.mutedText,
    fontSize: 12,
  },

  infoStrip: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  infoStripText: {
    color: ed.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },

  roomList: { gap: 10 },
  roomCardSimple: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  roomCardActive: {
    backgroundColor: ed.primaryFixed,
  },
  roomInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomTickSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ed.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  roomTickTextSmall: { color: ed.onPrimary, fontWeight: "800", fontSize: 13 },
  roomTitle: { color: ed.onSurface, fontWeight: "700", fontSize: 15 },
  roomMeta: { color: ed.mutedText, fontSize: 13 },
  emptyText: {
    color: ed.mutedText,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 24,
  },

  selectedStrip: {
    backgroundColor: ed.primaryFixed,
    borderRadius: 10,
    padding: 12,
  },
  selectedStripText: {
    color: ed.primary,
    fontWeight: "700",
    fontSize: 14,
  },

  roomDescCard: {
    backgroundColor: ed.primaryFixed,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: ed.primaryContainer,
  },
  roomDescIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roomDescIconBadge: {
    backgroundColor: ed.surfaceLowest,
    borderRadius: 10,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  roomDescIcon: {
    fontSize: 16,
  },
  roomDescTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: ed.primary,
  },
  roomDescText: {
    color: ed.mutedText,
    fontSize: 13,
    lineHeight: 20,
  },

  submitButton: {
    backgroundColor: ed.primaryContainer,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  submitText: {
    color: ed.onPrimary,
    fontWeight: "700",
    fontSize: 16,
  },

  messageStrip: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 12,
    padding: 14,
  },
  messageStripError: {
    backgroundColor: "rgba(178,58,58,0.08)",
  },
  messageText: {
    color: ed.onSurface,
    fontSize: 14,
  },

});
