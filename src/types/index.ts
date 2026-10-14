export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'NO_CLASS';

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  color: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  semesterId: string;
  timeSlot?: string;
  room?: string;
  instructor?: string;
}

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  studentId: string;
  date: string; // ISO yyyy-mm-dd
  status: AttendanceStatus;
  note?: string;
  createdAt?: string;
}

export interface AlertThresholds {
  red: number;    // default 65
  yellow: number; // default 75
}

export interface Semester {
  id: string;
  studentId: string;
  name: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;   // ISO yyyy-mm-dd
  targetAttendancePct: number; // default 75
  alertThresholds: AlertThresholds;
  isArchived: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  rollNo: string;
  email?: string;
  avatarColor: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  currentStudentId: string;
  currentSemesterId: string;
  notificationsEnabled?: boolean;
}

export interface Assignment {
  id: string;
  studentId: string;
  subjectId: string;
  title: string;
  dueDate: string; // ISO yyyy-mm-dd
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  description?: string;
}

export interface ExamCountdown {
  id: string;
  studentId: string;
  subjectId: string;
  title: string;
  examDate: string; // ISO yyyy-mm-dd
  room?: string;
}

export interface StreakInfo {
  currentPresentStreak: number;
  currentAbsentStreak: number;
  longestPresentStreak: number;
  longestAbsentStreak: number;
}

export interface ProjectionResult {
  canBunk: number;
  mustAttend: number;
  isMustAttendPossible: boolean;
  status: 'CRITICAL' | 'WARNING' | 'SAFE';
}

export interface ProjectedFinalResult {
  bestCasePct: number | null;
  worstCasePct: number | null;
  remainingClasses: number;
}

export interface SubjectAttendanceStats {
  subjectId: string;
  totalHeld: number; // PRESENT + ABSENT
  present: number;
  absent: number;
  noClass: number;
  pct: number | null; // null if zero classes held
  streaks: StreakInfo;
  projection: ProjectionResult;
  projectedFinal: ProjectedFinalResult;
}

export interface OverallStats {
  weightedPct: number | null;
  unweightedPct: number | null;
  totalCredits: number;
  totalHeldClasses: number;
  totalPresent: number;
  totalAbsent: number;
  totalNoClass: number;
  subjectsBelowTarget: string[];
  status: 'CRITICAL' | 'WARNING' | 'SAFE';
}

export interface FullBackupData {
  version: string;
  timestamp: string;
  students: StudentProfile[];
  semesters: Semester[];
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  assignments: Assignment[];
  exams: ExamCountdown[];
  settings: Settings;
}
