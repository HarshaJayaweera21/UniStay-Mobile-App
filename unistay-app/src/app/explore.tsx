import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, Text } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { deleteRoomRequest, getRoomRequests, RoomRequest, updateRoomRequest } from "@/lib/roomRequestsApi";

/* ── Editorial Palette ── */
const ed = {
  surface: "#faf8ff",
  surfaceLow: "#f3f3fe",
  surfaceLowest: "#ffffff",
  surfaceHigh: "#e7e7f3",
  primary: "#004ac6",
  primaryContainer: "#2563eb",
  primaryFixed: "#dbe1ff",
  onSurface: "#191b23",
  mutedText: "#4e5364",
  approved: "#0f8a47",
  approvedBg: "rgba(15,138,71,0.08)",
  rejected: "#b23a3a",
  rejectedBg: "rgba(178,58,58,0.08)",
  pending: "#6a6f80",
  pendingBg: "rgba(106,111,128,0.08)",
  onPrimary: "#ffffff",
} as const;

/* ── Room photos (same assets as student screen) ── */
const defaultRoomPhotos = []; // Removed images as per request

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStudentName = (req: RoomRequest) => {
  if (req.studentName) return req.studentName;
  if (typeof req.studentId === "object" && req.studentId) {
    const n = `${req.studentId.firstName ?? ""} ${req.studentId.lastName ?? ""}`.trim();
    return n || "—";
  }
  return "—";
};

const getRoomNumber = (req: RoomRequest) => {
  if (typeof req.roomId === "object" && req.roomId?.roomNumber) return req.roomId.roomNumber;
  return String(req.roomId);
};

const getRoomCapacity = (req: RoomRequest) => {
  if (typeof req.roomId === "object" && req.roomId?.capacity) return req.roomId.capacity;
  return null;
};

const getRoomPrice = (req: RoomRequest) => {
  if (typeof req.roomId === "object" && req.roomId?.price) return req.roomId.price;
  return null;
};

const paymentLabel = (m?: string) => {
  if (m === "bank-transfer") return "Bank Transfer";
  if (m === "cash") return "Cash";
  if (m === "other") return "Other";
  return m ?? "—";
};

const API_BASE = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

export default function ManagerApprovalScreen() {
  // Auto-filled for development as per user request
  const token = process.env.EXPO_PUBLIC_MANAGER_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWQxMTM2YWUzZWU2MjRmYmYwMWRlZDciLCJpYXQiOjE3NzY2OTc5OTksImV4cCI6MTc3Njc4NDM5OX0.xSpe7m7eEUKbSxotFebqrog4v5ogdqR1f_7ByCe2snA";

  const [requests, setRequests] = useState<RoomRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      // Bypassing auth: Token is optional on backend
      const data = await getRoomRequests(token || "DEVELOPMENT");
      setRequests(data);
      if (!data.length) setMessage("No room requests found.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateStatus = useCallback(
    async (id: string, status: "approved" | "rejected") => {
      try {
        setLoading(true);
        const res = await updateRoomRequest(token, id, { status });
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: res.status || status } : r))
        );
        setMessage("Status updated successfully");
        setTimeout(() => setMessage(""), 2000);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to update");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const deleteRequest = useCallback(
    async (id: string) => {
      try {
        await deleteRoomRequest(token, id);
        setRequests((prev) => prev.filter((r) => r._id !== id));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to delete");
      }
    },
    [token]
  );

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests]
  );

  const filtered = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <ThemedText style={styles.display}>
              Room Requests
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Review student room allocation requests and manage approvals.
            </ThemedText>
            <View style={{ marginTop: 8 }}>
              <Pressable onPress={loadRequests} style={styles.refreshChip}>
                <ThemedText style={styles.refreshChipText}>Refresh Submissions</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* ── SUMMARY TABLE ── */}
          <View style={styles.tableContainer}>
            <ThemedText style={styles.subHeader}>REQUEST SUMMARY</ThemedText>
            <View style={styles.tableHeader}>
              <ThemedText style={[styles.tableHeaderText, { flex: 0.5 }]}>#</ThemedText>
              <ThemedText style={[styles.tableHeaderText, { flex: 2 }]}>STUDENT</ThemedText>
              <ThemedText style={[styles.tableHeaderText, { flex: 1.5 }]}>TYPE</ThemedText>
              <ThemedText style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>STATUS</ThemedText>
            </View>
            {requests.map((req, idx) => (
              <View key={`row-${req._id}`} style={styles.tableRow}>
                <ThemedText style={[styles.tableRowText, { flex: 0.5 }]}>{idx + 1}</ThemedText>
                <ThemedText style={[styles.tableRowText, { flex: 2 }]} numberOfLines={1}>
                  {getStudentName(req).split(' ')[0]}
                </ThemedText>
                <ThemedText style={[styles.tableRowText, { flex: 1.5 }]}>
                  {req.roomType || "—"}
                </ThemedText>
                <View style={[styles.tableStatus, { flex: 1.5, alignItems: 'flex-end' }]}>
                  <ThemedText style={[
                    styles.statusText,
                    { color: req.status === 'approved' ? ed.approved : req.status === 'rejected' ? ed.rejected : ed.pending }
                  ]}>
                    {req.status.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* ── DETAILED REQUESTS ── */}
          <ThemedText style={styles.subHeader}>DETAILED REQUESTS</ThemedText>
          {requests.length > 0 ? (
            <View style={styles.statsRow}>
              <Pressable 
                onPress={() => setStatusFilter("all")}
                style={[styles.statCard, { backgroundColor: ed.surfaceLow }, statusFilter === "all" && { borderColor: ed.primary, borderWidth: 1 }]}>
                <ThemedText style={[styles.statNumber, { color: ed.onSurface }]}>{requests.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Total</ThemedText>
              </Pressable>
              <Pressable 
                onPress={() => setStatusFilter("pending")}
                style={[styles.statCard, { backgroundColor: ed.pendingBg }, statusFilter === "pending" && { borderColor: ed.pending, borderWidth: 1 }]}>
                <ThemedText style={[styles.statNumber, { color: ed.pending }]}>{counts.pending}</ThemedText>
                <ThemedText style={styles.statLabel}>Pending</ThemedText>
              </Pressable>
              <Pressable 
                onPress={() => setStatusFilter("approved")}
                style={[styles.statCard, { backgroundColor: ed.approvedBg }, statusFilter === "approved" && { borderColor: ed.approved, borderWidth: 1 }]}>
                <ThemedText style={[styles.statNumber, { color: ed.approved }]}>{counts.approved}</ThemedText>
                <ThemedText style={styles.statLabel}>Approved</ThemedText>
              </Pressable>
              <Pressable 
                onPress={() => setStatusFilter("rejected")}
                style={[styles.statCard, { backgroundColor: ed.rejectedBg }, statusFilter === "rejected" && { borderColor: ed.rejected, borderWidth: 1 }]}>
                <ThemedText style={[styles.statNumber, { color: ed.rejected }]}>{counts.rejected}</ThemedText>
                <ThemedText style={styles.statLabel}>Rejected</ThemedText>
              </Pressable>
            </View>
          ) : null}

          {/* ── Filter ── */}
          {requests.length > 0 ? (
            <View style={styles.filterRow}>
              {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setStatusFilter(f)}
                  style={[styles.filterChip, statusFilter === f && styles.filterChipActive]}>
                  <ThemedText
                    style={[styles.filterText, statusFilter === f && styles.filterTextActive]}>
                    {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
                  </ThemedText>
                </Pressable>
              ))}
              <View style={{ flex: 1 }} />
              <Pressable onPress={loadRequests} style={styles.refreshChip}>
                <ThemedText style={styles.refreshChipText}>Refresh</ThemedText>
              </Pressable>
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator color={ed.primary} size="large" style={{ marginTop: 20 }} />
          ) : null}

          {/* ── Request Cards ── */}
          {filtered.map((req) => {
            const capacity = getRoomCapacity(req);
            const price = getRoomPrice(req);

            return (
              <View key={req._id} style={styles.requestCard}>
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadgeInline,
                    req.status === "approved" && { backgroundColor: ed.approvedBg },
                    req.status === "rejected" && { backgroundColor: ed.rejectedBg },
                    req.status === "pending" && { backgroundColor: ed.pendingBg },
                  ]}>
                  <ThemedText
                    style={[
                      styles.statusText,
                      req.status === "approved" && { color: ed.approved },
                      req.status === "rejected" && { color: ed.rejected },
                      req.status === "pending" && { color: ed.pending },
                    ]}>
                    {req.status.toUpperCase()}
                  </ThemedText>
                </View>

                {/* Details */}
                <View style={styles.requestBody}>
                  <ThemedText style={styles.requestRoomTitle}>
                    Room {getRoomNumber(req)}
                  </ThemedText>

                  {/* Info Grid */}
                  <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>STUDENT NAME</ThemedText>
                        <ThemedText style={styles.infoValue}>{getStudentName(req)}</ThemedText>
                      </View>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>IT NUMBER & GENDER</ThemedText>
                        <ThemedText style={styles.infoValue}>
                          {req.studentItNumber ?? "—"} ({req.gender ? req.gender[0].toUpperCase() + req.gender.slice(1) : "—"})
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>YEAR OF STUDY</ThemedText>
                        <ThemedText style={styles.infoValue}>{req.yearOfStudy ?? "—"}</ThemedText>
                      </View>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>FACULTY</ThemedText>
                        <ThemedText style={styles.infoValue}>{req.faculty ?? "—"}</ThemedText>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>PAYMENT METHOD</ThemedText>
                        <ThemedText style={styles.infoValue}>{paymentLabel(req.paymentMethod)}</ThemedText>
                      </View>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>ROOM INFO</ThemedText>
                        <ThemedText style={styles.infoValue}>
                          {capacity ? `Cap: ${capacity}` : "—"}
                          {price ? `  ·  LKR ${price.toLocaleString()}` : ""}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>SUBMITTED</ThemedText>
                        <ThemedText style={styles.infoValue}>{formatDate(req.createdAt)}</ThemedText>
                      </View>
                    </View>

                    {/* NEW: Guardian Info */}
                    <ThemedText style={styles.subHeader}>GUARDIAN & EMERGENCY</ThemedText>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>GUARDIAN</ThemedText>
                        <ThemedText style={styles.infoValue}>{req.guardianName || "—"} ({req.guardianContact || "—"})</ThemedText>
                      </View>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>EMERGENCY</ThemedText>
                        <ThemedText style={styles.infoValue}>{req.emergencyName || "—"} ({req.emergencyPhone || "—"})</ThemedText>
                      </View>
                    </View>

                    {/* NEW: Medical Info */}
                    <ThemedText style={styles.subHeader}>MEDICAL INFORMATION</ThemedText>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>CONDITIONS</ThemedText>
                        <ThemedText style={styles.infoValue}>{req.medicalConditions || "—"}</ThemedText>
                      </View>
                      <View style={styles.infoItem}>
                        <ThemedText style={styles.infoLabel}>ALLERGIES / MEDS</ThemedText>
                        <ThemedText style={styles.infoValue}>
                          {req.allergies || "None"} / {req.medications || "None"}
                        </ThemedText>
                      </View>
                    </View>

                    {/* NEW: Payment Proof Image */}
                    {req.paymentProof && (
                      <View style={{ marginTop: 12 }}>
                        <ThemedText style={styles.subHeader}>PAYMENT PROOF</ThemedText>
                        <Image
                          source={{ 
                            uri: req.paymentProof.startsWith('http') 
                              ? req.paymentProof 
                              : `${API_BASE}${req.paymentProof.startsWith('/') ? '' : '/'}${req.paymentProof}` 
                          }}
                          style={styles.paymentImage}
                          contentFit="contain"
                          cachePolicy="none"
                        />
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => updateStatus(req._id, "approved")}
                      style={[
                        styles.approveBtn,
                        req.status === "approved" && { backgroundColor: ed.approved, borderWidth: 0 }
                      ]}>
                      <ThemedText style={[
                        styles.approveBtnText,
                        req.status === "approved" && { color: "#fff" }
                      ]}>
                        Approve
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => updateStatus(req._id, "rejected")}
                      style={[
                        styles.rejectBtn,
                        req.status === "rejected" && { backgroundColor: ed.rejected, borderWidth: 0 }
                      ]}>
                      <ThemedText style={[
                        styles.rejectBtnText,
                        req.status === "rejected" && { color: "#fff" }
                      ]}>
                        Reject
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteRequest(req._id)}
                      style={styles.deleteBtn}>
                      <ThemedText style={styles.deleteBtnText}>Delete</ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}

          {message ? (
            <ThemedText style={styles.message}>{message}</ThemedText>
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
  content: { padding: 20, gap: 12 },

  hero: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 16,
    padding: 24,
    gap: 10,
  },
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    color: ed.onSurface,
  },
  subtitle: {
    color: ed.mutedText,
    fontSize: 15,
    lineHeight: 22,
  },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    color: ed.mutedText,
    fontSize: 12,
    fontWeight: "600",
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterChip: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: ed.primaryFixed,
  },
  filterText: {
    color: ed.mutedText,
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: ed.primary,
  },
  refreshChip: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshChipText: {
    color: ed.primary,
    fontSize: 13,
    fontWeight: "600",
  },

  requestCard: {
    backgroundColor: ed.surfaceLowest,
    borderRadius: 16,
    overflow: "hidden",
    paddingTop: 16,
    position: "relative",
    borderWidth: 1,
    borderColor: ed.surfaceHigh,
  },
  statusBadgeInline: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  requestBody: {
    padding: 16,
    gap: 12,
  },
  requestRoomTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: ed.onSurface,
  },

  infoGrid: {
    backgroundColor: ed.surfaceLow,
    borderRadius: 12,
    padding: 14,
    gap: 14,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoItem: {
    flex: 1,
    gap: 3,
  },
  infoLabel: {
    color: ed.mutedText,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  infoValue: {
    color: ed.onSurface,
    fontSize: 14,
    fontWeight: "500",
  },

  subHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: ed.primary,
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  approveBtn: {
    flex: 2,
    backgroundColor: ed.approvedBg,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtnText: {
    color: ed.approved,
    fontWeight: "700",
    fontSize: 14,
  },
  rejectBtn: {
    flex: 2,
    backgroundColor: ed.rejectedBg,
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    color: ed.rejected,
    fontWeight: "700",
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },

  message: {
    color: ed.mutedText,
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
  },

  /* Summary Table */
  tableContainer: {
    backgroundColor: ed.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ed.surfaceHigh,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ed.surfaceHigh,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: ed.mutedText,
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ed.surfaceLow,
    alignItems: 'center',
  },
  tableRowText: {
    fontSize: 13,
    fontWeight: '500',
    color: ed.onSurface,
  },
  tableStatus: {
    justifyContent: 'center',
  },

  paymentImage: {
    width: '100%',
    height: 350,
    borderRadius: 16,
    backgroundColor: ed.surfaceLow,
    marginTop: 10,
    borderWidth: 1,
    borderColor: ed.surfaceHigh,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
