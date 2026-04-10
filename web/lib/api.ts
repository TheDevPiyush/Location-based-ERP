"use client";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// ---------------------------------------------------------------------------
// Token / user storage
// ---------------------------------------------------------------------------

function getStored<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function setStored(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function setToken(token: string) {
  setStored("token", token);
}

export function getToken(): string | null {
  return getStored<string>("token");
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("currentUser");
}

export function setCurrentUser(user: unknown) {
  setStored("currentUser", user);
}

export function getCurrentUserStored<T = any>(): T | null {
  return getStored<T>("currentUser");
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function parseErrorMessage(res: Response): Promise<string> {
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (!data) return "";
      if (typeof data === "string") return data;
      if (typeof data.error === "string") return data.error;
      if (typeof data.detail === "string") return data.detail;
      if (typeof data.message === "string") return data.message;
      return JSON.stringify(data);
    }
    return await res.text();
  } catch {
    return "";
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const method = options.method || "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function apiFormFetch<T = any>(
  path: string,
  formData: FormData
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

async function apiPatchForm<T = any>(
  path: string,
  formData: FormData
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const msg = await parseErrorMessage(res);
    throw new Error(msg || `Request failed with status ${res.status}`);
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Auth (OTP-based)
// ---------------------------------------------------------------------------

export async function sendLoginCode(email: string) {
  return apiFetch<{ success: boolean; message: string; data: { email: string } }>(
    "/auth/send-code",
    { method: "POST", body: { email } }
  );
}

export async function verifyLoginCode(email: string, code: string) {
  const res = await apiFetch<{
    success: boolean;
    message: string;
    data: { token: string };
  }>("/auth/verify-code", { method: "POST", body: { email, code } });

  setToken(res.data.token);
  return res;
}

// ---------------------------------------------------------------------------
// Current user
// ---------------------------------------------------------------------------

export async function fetchMe() {
  return apiFetch("/users/me");
}

export async function updateMyLocation(latitude: number, longitude: number) {
  return apiFetch("/users/location", {
    method: "PATCH",
    body: { latitude, longitude },
  });
}

export async function updateProfile(payload: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_picture?: File;
}) {
  const formData = new FormData();
  if (payload.profile_picture)
    formData.append("profile_picture", payload.profile_picture);
  if (payload.name !== undefined) formData.append("name", payload.name ?? "");
  if (payload.email !== undefined)
    formData.append("email", payload.email ?? "");
  if (payload.phone !== undefined)
    formData.append("phone", payload.phone ?? "");

  return apiPatchForm("/users/me", formData);
}

// ---------------------------------------------------------------------------
// Org hierarchy
// ---------------------------------------------------------------------------

export async function fetchUniversities() {
  return apiFetch("/university/");
}

export async function createUniversity(payload: {
  name: string;
  code?: string | null;
  address?: string | null;
}) {
  return apiFetch("/university/", { method: "POST", body: payload });
}

export async function fetchCourses() {
  return apiFetch("/course/");
}

export async function createCourse(payload: {
  university: string;
  code?: string | null;
}) {
  return apiFetch("/course/", { method: "POST", body: payload });
}

export async function fetchBatches() {
  return apiFetch("/batch/");
}

export async function createBatch(payload: {
  course: string;
  code?: string | null;
  start_year?: number | null;
  end_year?: number | null;
}) {
  return apiFetch("/batch/", { method: "POST", body: payload });
}

export async function fetchSubjects() {
  return apiFetch("/subject/");
}

export async function createSubject(payload: {
  batch: string;
  code: string;
  faculty?: string | null;
}) {
  return apiFetch("/subject/", { method: "POST", body: payload });
}

// ---------------------------------------------------------------------------
// Users (admin)
// ---------------------------------------------------------------------------

export async function fetchUsersAll() {
  return apiFetch("/users/");
}

export async function createUser(payload: {
  name?: string | null;
  email: string;
  password: string;
  role: string;
  batch?: string | null;
}) {
  return apiFetch("/users/", { method: "POST", body: payload });
}

export async function createMultipleUsers(
  payload: Array<{
    name?: string | null;
    email: string;
    password: string;
    role?: string | null;
    batch?: string | null;
  }>
) {
  return apiFetch("/users/", { method: "POST", body: payload });
}

export async function fetchStudentsByBatch(batchId: string) {
  return apiFetch(`/users/batch/${batchId}`);
}

// ---------------------------------------------------------------------------
// Attendance windows
// ---------------------------------------------------------------------------

export async function getWindow(
  target_batch: string,
  target_subject: string
) {
  const query = new URLSearchParams({
    target_batch: String(target_batch),
    target_subject: String(target_subject),
  });
  return apiFetch(`/attendance/window?${query.toString()}`);
}

export async function upsertWindow(params: {
  target_batch: string;
  target_subject: string;
  duration?: number;
  is_active?: boolean;
}) {
  return apiFetch("/attendance/window", { method: "POST", body: params });
}

export async function markAttendance(
  attendance_window: string,
  student_picture: File,
  user?: string
) {
  const formData = new FormData();
  formData.append("student_picture", student_picture);
  formData.append("attendance_window", String(attendance_window));
  if (user) formData.append("user", String(user));
  return apiFormFetch("/attendance/record", formData);
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export async function fetchAttendanceAnalytics(params: {
  batch_id?: string;
  subject_id?: string;
  student_id?: string;
  start_date?: string;
  end_date?: string;
  month?: string;
}) {
  const query = new URLSearchParams();
  if (params.batch_id) query.append("batch_id", String(params.batch_id));
  if (params.subject_id)
    query.append("subject_id", String(params.subject_id));
  if (params.student_id)
    query.append("student_id", String(params.student_id));
  if (params.start_date) query.append("start_date", params.start_date);
  if (params.end_date) query.append("end_date", params.end_date);
  if (params.month) query.append("month", params.month);
  return apiFetch(`/analytics/?${query.toString()}`);
}

export async function fetchMonthlyPercentage(params: {
  batch_id?: string;
  subject_id?: string;
  student_id?: string;
  month?: string;
}) {
  const query = new URLSearchParams();
  if (params.batch_id) query.append("batch_id", String(params.batch_id));
  if (params.subject_id)
    query.append("subject_id", String(params.subject_id));
  if (params.student_id)
    query.append("student_id", String(params.student_id));
  if (params.month) query.append("month", params.month);
  return apiFetch(`/analytics/monthly-percentage?${query.toString()}`);
}

export async function fetchStudentCalendar(params: {
  month?: string;
  batch_id?: string;
}) {
  const query = new URLSearchParams();
  if (params.month) query.append("month", params.month);
  if (params.batch_id) query.append("batch_id", String(params.batch_id));
  return apiFetch(`/analytics/student-calendar?${query.toString()}`);
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export async function getAnnouncements() {
  return apiFetch("/announcement/");
}

export async function getAnnouncementById(id: string) {
  return apiFetch(`/announcement/${id}`);
}

export async function searchAnnouncements(query: string) {
  return apiFetch(
    `/announcement/search?q=${encodeURIComponent(query)}`
  );
}

export async function createAnnouncement(payload: any) {
  return apiFetch("/announcement/", { method: "POST", body: payload });
}

export async function updateAnnouncement(id: string, payload: any) {
  return apiFetch(`/announcement/${id}`, { method: "PATCH", body: payload });
}

export async function deleteAnnouncement(id: string) {
  return apiFetch(`/announcement/${id}`, { method: "DELETE" });
}

export async function uploadAnnouncementMedia(
  file: File
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return apiFormFetch("/announcement/upload-media", formData);
}
