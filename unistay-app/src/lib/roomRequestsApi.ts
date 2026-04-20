import { Platform } from "react-native";

export type RoomRequestStatus = "pending" | "approved" | "rejected";
export type RoomStatus = "available" | "taken";
export type PaymentMethod = "bank-transfer" | "cash" | "other";
export type YearOfStudy = "1st Year" | "2nd Year" | "3rd Year" | "4th Year";
export type Faculty = "Faculty of Computing" | "Faculty of Business Management" | "Other";
export type Gender = "male" | "female";

export type RoomSummary = {
  _id: string;
  roomNumber: string;
  status: RoomStatus;
  capacity: number;
  price: number;
  roomType?: "single" | "double";
  wing?: "boys" | "girls" | "unassigned";
};

export type RoomRequest = {
  _id: string;
  studentName?: string;
  studentItNumber?: string;
  gender?: Gender;
  yearOfStudy?: YearOfStudy;
  faculty?: Faculty;
  studentId:
    | string
    | {
        _id: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        username?: string;
      };
  roomId:
    | string
    | {
        _id: string;
        roomNumber?: string;
        status?: RoomStatus;
        capacity?: number;
        price?: number;
      };
  roomType?: "single" | "double";
  status: RoomRequestStatus;
  paymentProof: string | null;
  paymentMethod?: PaymentMethod;
  // Guardian & Emergency Info
  guardianName?: string;
  guardianContact?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  // Medical Information
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  createdAt: string;
  updatedAt: string;
};

const BASE_URL = Platform.select({
  android: "http://10.0.2.2:3000",
  default: "http://localhost:3000",
});

const getErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    return payload.message ?? "Request failed";
  } catch {
    return "Request failed";
  }
};

const request = async <T>(endpoint: string, options: RequestInit, token: string) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as T;
};

export const getRoomRequests = (token: string) =>
  request<RoomRequest[]>("/requests", { method: "GET" }, token);

export const getStudentRoomDashboard = (token: string) =>
  request<{ requests: RoomRequest[]; availableRooms: RoomSummary[] }>(
    "/requests",
    { method: "GET" },
    token
  );

export const createRoomRequest = async (
  token: string,
  payload: {
    roomId?: string;
    studentName: string;
    studentItNumber: string;
    gender: Gender;
    yearOfStudy: YearOfStudy;
    faculty: Faculty;
    paymentMethod: PaymentMethod;
    paymentProofUri?: string;
    paymentProofName?: string;
    paymentProofType?: string;
    roomType: "single" | "double";
    guardianName?: string;
    guardianContact?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    medicalConditions?: string;
    allergies?: string;
    medications?: string;
  }
) => {
  const formData = new FormData();
  formData.append("studentName", payload.studentName);
  formData.append("studentItNumber", payload.studentItNumber);
  formData.append("gender", payload.gender);
  formData.append("yearOfStudy", payload.yearOfStudy);
  formData.append("faculty", payload.faculty);
  formData.append("paymentMethod", payload.paymentMethod);
  formData.append("roomType", payload.roomType);

  if (payload.roomId && payload.roomId !== "undefined") formData.append("roomId", payload.roomId);
  if (payload.guardianContact) formData.append("guardianContact", payload.guardianContact);
  if (payload.emergencyName) formData.append("emergencyName", payload.emergencyName);
  if (payload.emergencyPhone) formData.append("emergencyPhone", payload.emergencyPhone);
  if (payload.medicalConditions) formData.append("medicalConditions", payload.medicalConditions);
  if (payload.allergies) formData.append("allergies", payload.allergies);
  if (payload.medications) formData.append("medications", payload.medications);

  if (payload.paymentProofUri) {
    formData.append("paymentProof", {
      uri: payload.paymentProofUri,
      name: payload.paymentProofName ?? `proof-${Date.now()}.jpg`,
      type: payload.paymentProofType ?? "image/jpeg",
    } as unknown as Blob);
  }

  return request<RoomRequest>("/requests", { method: "POST", body: formData }, token);
};

export const updateRoomRequest = (
  token: string,
  requestId: string,
  payload: Partial<{ roomId: string; status: RoomRequestStatus }>
) => {
  const formData = new FormData();
  if (payload.status) formData.append("status", payload.status);
  if (payload.roomId && payload.roomId !== "undefined") formData.append("roomId", payload.roomId);

  return request<RoomRequest>(
    `/requests/${requestId}`,
    {
      method: "PUT",
      body: formData,
    },
    token
  );
};

export const deleteRoomRequest = (token: string, requestId: string) =>
  request<{ message: string }>(`/requests/${requestId}`, { method: "DELETE" }, token);

