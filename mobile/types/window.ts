/**
 * Types for attendance window APIs
 */

export interface AttendanceWindow {
  id: string;
  target_batch?: string;
  target_subject?: string;
  targetBatchId?: string;
  targetSubjectId?: string;
  /** ISO datetime (API may use camelCase or snake_case) */
  start_time?: string;
  startTime?: string;
  duration: number; // seconds
  is_active: boolean;
  /** API camelCase (Drizzle); normalized alongside is_active */
  isActive?: boolean;
  last_interacted_by?: number | null;
  created_at?: string;
}
