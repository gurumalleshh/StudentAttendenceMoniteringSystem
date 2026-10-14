import { create } from 'zustand';
import {
  StudentProfile,
  Semester,
  Subject,
  AttendanceRecord,
  AttendanceStatus,
  Assignment,
  ExamCountdown,
  Settings,
  FullBackupData,
} from '../types';
import { getStorageAdapter } from '../adapters/storage';
import {
  DEMO_STUDENTS,
  DEMO_SEMESTERS,
  DEMO_SUBJECTS,
  generateDemoAttendance,
  DEMO_ASSIGNMENTS,
  DEMO_EXAMS,
  DEMO_SETTINGS,
} from '../lib/demoData';

export type NavTab =
  | 'dashboard'
  | 'attendance'
  | 'calendar'
  | 'timetable'
  | 'subjects'
  | 'analytics'
  | 'assignments'
  | 'settings';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}

interface AppState {
  isInitialized: boolean;
  activeTab: NavTab;
  selectedDate: string; // ISO yyyy-mm-dd
  students: StudentProfile[];
  semesters: Semester[];
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  assignments: Assignment[];
  exams: ExamCountdown[];
  settings: Settings;
  toasts: ToastItem[];

  // Navigation
  setActiveTab: (tab: NavTab) => void;
  setSelectedDate: (date: string) => void;

  // Student Profile
  switchStudent: (studentId: string) => void;
  addStudent: (student: Omit<StudentProfile, 'id'>) => string;
  updateStudent: (student: StudentProfile) => void;
  deleteStudent: (studentId: string) => void;

  // Semester Management
  switchSemester: (semesterId: string) => void;
  addSemester: (semester: Omit<Semester, 'id'>) => string;
  updateSemester: (semester: Semester) => void;
  deleteSemester: (semesterId: string) => void;
  toggleArchiveSemester: (semesterId: string) => void;

  // Subject Management
  addSubject: (subject: Omit<Subject, 'id'>) => string;
  updateSubject: (subject: Subject) => void;
  deleteSubject: (subjectId: string) => void;

  // Attendance Records
  markAttendance: (
    subjectId: string,
    status: AttendanceStatus,
    date?: string,
    note?: string
  ) => void;
  removeAttendanceRecord: (subjectId: string, date: string) => void;
  markAllPresentForDate: (date: string) => void;

  // Assignments & Exams
  addAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  updateAssignment: (assignment: Assignment) => void;
  toggleAssignment: (id: string) => void;
  deleteAssignment: (id: string) => void;

  addExam: (exam: Omit<ExamCountdown, 'id'>) => void;
  updateExam: (exam: ExamCountdown) => void;
  deleteExam: (id: string) => void;

  // Settings & System
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  addToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  resetDemoData: () => void;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => boolean;
  initStore: () => Promise<void>;
}

const STORAGE_KEYS = {
  STUDENTS: 'students',
  SEMESTERS: 'semesters',
  SUBJECTS: 'subjects',
  RECORDS: 'attendance_records',
  ASSIGNMENTS: 'assignments',
  EXAMS: 'exams',
  SETTINGS: 'settings',
};

const applyThemeToDOM = (theme: 'light' | 'dark' | 'system') => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  isInitialized: false,
  activeTab: 'dashboard',
  selectedDate: '2026-10-14',
  students: DEMO_STUDENTS,
  semesters: DEMO_SEMESTERS,
  subjects: DEMO_SUBJECTS,
  attendanceRecords: [],
  assignments: DEMO_ASSIGNMENTS,
  exams: DEMO_EXAMS,
  settings: DEMO_SETTINGS,
  toasts: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  switchStudent: (studentId) => {
    const student = get().students.find((s) => s.id === studentId);
    if (!student) return;

    // Pick their first active semester if current belongs to another student
    const studentSemesters = get().semesters.filter((s) => s.studentId === studentId);
    let activeSemId = get().settings.currentSemesterId;
    if (!studentSemesters.some((s) => s.id === activeSemId)) {
      const firstActive = studentSemesters.find((s) => !s.isArchived) || studentSemesters[0];
      if (firstActive) activeSemId = firstActive.id;
    }

    const newSettings: Settings = {
      ...get().settings,
      currentStudentId: studentId,
      currentSemesterId: activeSemId,
    };

    set({ settings: newSettings });
    getStorageAdapter().setItem(STORAGE_KEYS.SETTINGS, newSettings);
    get().addToast({
      title: 'Profile Switched',
      message: `Active student: ${student.name}`,
      type: 'info',
    });
  },

  addStudent: (studentData) => {
    const newId = `student-${Date.now()}`;
    const newStudent: StudentProfile = { ...studentData, id: newId };
    const updated = [...get().students, newStudent];
    set({ students: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.STUDENTS, updated);

    // Also auto-create a default semester for them
    const newSem: Semester = {
      id: `sem-${Date.now()}`,
      studentId: newId,
      name: 'Semester 1',
      startDate: '2026-08-17',
      endDate: '2026-12-18',
      targetAttendancePct: 75,
      alertThresholds: { red: 65, yellow: 75 },
      isArchived: false,
    };
    const updatedSemesters = [...get().semesters, newSem];
    set({ semesters: updatedSemesters });
    getStorageAdapter().setItem(STORAGE_KEYS.SEMESTERS, updatedSemesters);

    get().switchStudent(newId);
    get().addToast({
      title: 'Student Profile Created',
      message: `${newStudent.name} is now registered.`,
      type: 'success',
    });
    return newId;
  },

  updateStudent: (student) => {
    const updated = get().students.map((s) => (s.id === student.id ? student : s));
    set({ students: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.STUDENTS, updated);
    get().addToast({
      title: 'Profile Updated',
      message: 'Student details saved successfully.',
      type: 'success',
    });
  },

  deleteStudent: (studentId) => {
    if (get().students.length <= 1) {
      get().addToast({
        title: 'Cannot Delete Profile',
        message: 'At least one student profile is required.',
        type: 'warning',
      });
      return;
    }
    const updatedStudents = get().students.filter((s) => s.id !== studentId);
    const updatedSemesters = get().semesters.filter((s) => s.studentId !== studentId);
    const updatedRecords = get().attendanceRecords.filter((r) => r.studentId !== studentId);

    const nextStudent = updatedStudents[0];
    const nextSem = updatedSemesters.find((s) => s.studentId === nextStudent.id) || updatedSemesters[0];

    const newSettings: Settings = {
      ...get().settings,
      currentStudentId: nextStudent.id,
      currentSemesterId: nextSem ? nextSem.id : '',
    };

    set({
      students: updatedStudents,
      semesters: updatedSemesters,
      attendanceRecords: updatedRecords,
      settings: newSettings,
    });

    getStorageAdapter().setItem(STORAGE_KEYS.STUDENTS, updatedStudents);
    getStorageAdapter().setItem(STORAGE_KEYS.SEMESTERS, updatedSemesters);
    getStorageAdapter().setItem(STORAGE_KEYS.RECORDS, updatedRecords);
    getStorageAdapter().setItem(STORAGE_KEYS.SETTINGS, newSettings);

    get().addToast({
      title: 'Profile Deleted',
      message: 'Student data removed.',
      type: 'info',
    });
  },

  switchSemester: (semesterId) => {
    const sem = get().semesters.find((s) => s.id === semesterId);
    if (!sem) return;

    const newSettings: Settings = {
      ...get().settings,
      currentSemesterId: semesterId,
    };
    set({ settings: newSettings });
    getStorageAdapter().setItem(STORAGE_KEYS.SETTINGS, newSettings);
    get().addToast({
      title: 'Semester Changed',
      message: `Active semester: ${sem.name}`,
      type: 'info',
    });
  },

  addSemester: (semData) => {
    const newId = `sem-${Date.now()}`;
    const newSem: Semester = { ...semData, id: newId };
    const updated = [...get().semesters, newSem];
    set({ semesters: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.SEMESTERS, updated);
    get().switchSemester(newId);
    get().addToast({
      title: 'Semester Created',
      message: `${newSem.name} added.`,
      type: 'success',
    });
    return newId;
  },

  updateSemester: (semester) => {
    const updated = get().semesters.map((s) => (s.id === semester.id ? semester : s));
    set({ semesters: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.SEMESTERS, updated);
    get().addToast({
      title: 'Semester Updated',
      message: `${semester.name} configuration saved.`,
      type: 'success',
    });
  },

  deleteSemester: (semesterId) => {
    const curStudentSemesters = get().semesters.filter(
      (s) => s.studentId === get().settings.currentStudentId
    );
    if (curStudentSemesters.length <= 1) {
      get().addToast({
        title: 'Cannot Delete Semester',
        message: 'Must keep at least one semester for this student.',
        type: 'warning',
      });
      return;
    }

    const updated = get().semesters.filter((s) => s.id !== semesterId);
    const updatedSubjects = get().subjects.filter((sub) => sub.semesterId !== semesterId);
    const remainingForStudent = updated.filter(
      (s) => s.studentId === get().settings.currentStudentId
    );
    const nextSem = remainingForStudent[0];

    const newSettings: Settings = {
      ...get().settings,
      currentSemesterId: nextSem ? nextSem.id : '',
    };

    set({
      semesters: updated,
      subjects: updatedSubjects,
      settings: newSettings,
    });

    getStorageAdapter().setItem(STORAGE_KEYS.SEMESTERS, updated);
    getStorageAdapter().setItem(STORAGE_KEYS.SUBJECTS, updatedSubjects);
    getStorageAdapter().setItem(STORAGE_KEYS.SETTINGS, newSettings);

    get().addToast({
      title: 'Semester Removed',
      message: 'Semester and associated subjects removed.',
      type: 'info',
    });
  },

  toggleArchiveSemester: (semesterId) => {
    const updated = get().semesters.map((s) =>
      s.id === semesterId ? { ...s, isArchived: !s.isArchived } : s
    );
    set({ semesters: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.SEMESTERS, updated);
    get().addToast({
      title: 'Archive Status Updated',
      message: 'Semester status changed.',
      type: 'info',
    });
  },

  addSubject: (subData) => {
    const newId = `sub-${Date.now()}`;
    const newSub: Subject = { ...subData, id: newId };
    const updated = [...get().subjects, newSub];
    set({ subjects: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.SUBJECTS, updated);
    get().addToast({
      title: 'Subject Added',
      message: `${newSub.code} - ${newSub.name} added to curriculum.`,
      type: 'success',
    });
    return newId;
  },

  updateSubject: (subject) => {
    const updated = get().subjects.map((s) => (s.id === subject.id ? subject : s));
    set({ subjects: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.SUBJECTS, updated);
    get().addToast({
      title: 'Subject Updated',
      message: `${subject.code} modified successfully.`,
      type: 'success',
    });
  },

  deleteSubject: (subjectId) => {
    const sub = get().subjects.find((s) => s.id === subjectId);
    const updatedSubjects = get().subjects.filter((s) => s.id !== subjectId);
    const updatedRecords = get().attendanceRecords.filter((r) => r.subjectId !== subjectId);
    const updatedAssignments = get().assignments.filter((a) => a.subjectId !== subjectId);
    const updatedExams = get().exams.filter((e) => e.subjectId !== subjectId);

    set({
      subjects: updatedSubjects,
      attendanceRecords: updatedRecords,
      assignments: updatedAssignments,
      exams: updatedExams,
    });

    getStorageAdapter().setItem(STORAGE_KEYS.SUBJECTS, updatedSubjects);
    getStorageAdapter().setItem(STORAGE_KEYS.RECORDS, updatedRecords);
    getStorageAdapter().setItem(STORAGE_KEYS.ASSIGNMENTS, updatedAssignments);
    getStorageAdapter().setItem(STORAGE_KEYS.EXAMS, updatedExams);

    get().addToast({
      title: 'Subject Deleted',
      message: sub ? `${sub.code} deleted.` : 'Subject removed.',
      type: 'info',
    });
  },

  markAttendance: (subjectId, status, dateOverride, note) => {
    const state = get();
    const date = dateOverride || state.selectedDate;
    const studentId = state.settings.currentStudentId;

    // Check if record already exists for (subjectId, studentId, date)
    const existingIndex = state.attendanceRecords.findIndex(
      (r) => r.subjectId === subjectId && r.date === date && r.studentId === studentId
    );

    let updatedRecords: AttendanceRecord[];
    if (existingIndex >= 0) {
      updatedRecords = [...state.attendanceRecords];
      updatedRecords[existingIndex] = {
        ...updatedRecords[existingIndex],
        status,
        note: note !== undefined ? note : updatedRecords[existingIndex].note,
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: `rec-${subjectId}-${date}-${Date.now()}`,
        subjectId,
        studentId,
        date,
        status,
        note,
        createdAt: new Date().toISOString(),
      };
      updatedRecords = [...state.attendanceRecords, newRecord];
    }

    set({ attendanceRecords: updatedRecords });
    getStorageAdapter().setItem(STORAGE_KEYS.RECORDS, updatedRecords);
  },

  removeAttendanceRecord: (subjectId, date) => {
    const state = get();
    const studentId = state.settings.currentStudentId;
    const updated = state.attendanceRecords.filter(
      (r) => !(r.subjectId === subjectId && r.date === date && r.studentId === studentId)
    );
    set({ attendanceRecords: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.RECORDS, updated);
  },

  markAllPresentForDate: (date) => {
    const state = get();
    const studentId = state.settings.currentStudentId;
    const curSemester = state.semesters.find((s) => s.id === state.settings.currentSemesterId);
    if (!curSemester) return;

    const subjectsInSem = state.subjects.filter((s) => s.semesterId === curSemester.id);
    const dayOfWeek = new Date(date).getDay();
    const scheduledSubjects = subjectsInSem.filter((s) => s.daysOfWeek.includes(dayOfWeek));

    if (scheduledSubjects.length === 0) {
      state.addToast({
        title: 'No Classes Scheduled',
        message: 'No classes are scheduled on this day of the week.',
        type: 'info',
      });
      return;
    }

    const recordsMap = new Map(
      state.attendanceRecords
        .filter((r) => r.studentId === studentId && r.date === date)
        .map((r) => [r.subjectId, r])
    );

    const otherRecords = state.attendanceRecords.filter(
      (r) => !(r.studentId === studentId && r.date === date)
    );

    const newDateRecords: AttendanceRecord[] = scheduledSubjects.map((sub) => {
      const existing = recordsMap.get(sub.id);
      return {
        id: existing ? existing.id : `rec-${sub.id}-${date}-${Date.now()}`,
        subjectId: sub.id,
        studentId,
        date,
        status: 'PRESENT',
        note: existing?.note,
      };
    });

    const combined = [...otherRecords, ...newDateRecords];
    set({ attendanceRecords: combined });
    getStorageAdapter().setItem(STORAGE_KEYS.RECORDS, combined);

    state.addToast({
      title: 'Bulk Marked Present',
      message: `Marked all ${scheduledSubjects.length} scheduled classes present for ${date}.`,
      type: 'success',
    });
  },

  addAssignment: (asg) => {
    const newId = `asg-${Date.now()}`;
    const newAsg: Assignment = { ...asg, id: newId };
    const updated = [...get().assignments, newAsg];
    set({ assignments: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.ASSIGNMENTS, updated);
    get().addToast({
      title: 'Assignment Added',
      message: `${newAsg.title} tracked.`,
      type: 'success',
    });
  },

  updateAssignment: (asg) => {
    const updated = get().assignments.map((a) => (a.id === asg.id ? asg : a));
    set({ assignments: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.ASSIGNMENTS, updated);
  },

  toggleAssignment: (id) => {
    const updated = get().assignments.map((a) =>
      a.id === id ? { ...a, completed: !a.completed } : a
    );
    set({ assignments: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.ASSIGNMENTS, updated);
  },

  deleteAssignment: (id) => {
    const updated = get().assignments.filter((a) => a.id !== id);
    set({ assignments: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.ASSIGNMENTS, updated);
  },

  addExam: (exam) => {
    const newId = `exam-${Date.now()}`;
    const newExam: ExamCountdown = { ...exam, id: newId };
    const updated = [...get().exams, newExam];
    set({ exams: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.EXAMS, updated);
    get().addToast({
      title: 'Exam Scheduled',
      message: `${newExam.title} added to countdown.`,
      type: 'success',
    });
  },

  updateExam: (exam) => {
    const updated = get().exams.map((e) => (e.id === exam.id ? exam : e));
    set({ exams: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.EXAMS, updated);
  },

  deleteExam: (id) => {
    const updated = get().exams.filter((e) => e.id !== id);
    set({ exams: updated });
    getStorageAdapter().setItem(STORAGE_KEYS.EXAMS, updated);
  },

  setTheme: (theme) => {
    const newSettings = { ...get().settings, theme };
    set({ settings: newSettings });
    getStorageAdapter().setItem(STORAGE_KEYS.SETTINGS, newSettings);
    applyThemeToDOM(theme);
  },

  addToast: ({ title, message, type }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const item: ToastItem = { id, title, message, type, timestamp: Date.now() };
    set((state) => ({ toasts: [...state.toasts.slice(-4), item] }));

    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  resetDemoData: () => {
    const demoRecords = generateDemoAttendance();
    set({
      students: DEMO_STUDENTS,
      semesters: DEMO_SEMESTERS,
      subjects: DEMO_SUBJECTS,
      attendanceRecords: demoRecords,
      assignments: DEMO_ASSIGNMENTS,
      exams: DEMO_EXAMS,
      settings: DEMO_SETTINGS,
      selectedDate: '2026-10-14',
    });

    const storage = getStorageAdapter();
    storage.setItem(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS);
    storage.setItem(STORAGE_KEYS.SEMESTERS, DEMO_SEMESTERS);
    storage.setItem(STORAGE_KEYS.SUBJECTS, DEMO_SUBJECTS);
    storage.setItem(STORAGE_KEYS.RECORDS, demoRecords);
    storage.setItem(STORAGE_KEYS.ASSIGNMENTS, DEMO_ASSIGNMENTS);
    storage.setItem(STORAGE_KEYS.EXAMS, DEMO_EXAMS);
    storage.setItem(STORAGE_KEYS.SETTINGS, DEMO_SETTINGS);

    applyThemeToDOM(DEMO_SETTINGS.theme);

    get().addToast({
      title: 'Demo Data Reset',
      message: 'Restored 5 subjects, ~8 weeks of realistic attendance records, and exams.',
      type: 'info',
    });
  },

  exportBackupJSON: () => {
    const state = get();
    const backup: FullBackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      students: state.students,
      semesters: state.semesters,
      subjects: state.subjects,
      attendanceRecords: state.attendanceRecords,
      assignments: state.assignments,
      exams: state.exams,
      settings: state.settings,
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJSON: (jsonStr) => {
    try {
      const parsed: FullBackupData = JSON.parse(jsonStr);
      if (!parsed.students || !parsed.subjects || !parsed.attendanceRecords) {
        throw new Error('Invalid backup schema: missing core collections');
      }

      set({
        students: parsed.students,
        semesters: parsed.semesters || DEMO_SEMESTERS,
        subjects: parsed.subjects,
        attendanceRecords: parsed.attendanceRecords,
        assignments: parsed.assignments || [],
        exams: parsed.exams || [],
        settings: parsed.settings || DEMO_SETTINGS,
      });

      const storage = getStorageAdapter();
      storage.setItem(STORAGE_KEYS.STUDENTS, parsed.students);
      storage.setItem(STORAGE_KEYS.SEMESTERS, parsed.semesters);
      storage.setItem(STORAGE_KEYS.SUBJECTS, parsed.subjects);
      storage.setItem(STORAGE_KEYS.RECORDS, parsed.attendanceRecords);
      storage.setItem(STORAGE_KEYS.ASSIGNMENTS, parsed.assignments);
      storage.setItem(STORAGE_KEYS.EXAMS, parsed.exams);
      storage.setItem(STORAGE_KEYS.SETTINGS, parsed.settings);

      if (parsed.settings?.theme) {
        applyThemeToDOM(parsed.settings.theme);
      }

      get().addToast({
        title: 'Backup Imported',
        message: `Successfully loaded ${parsed.subjects.length} subjects & ${parsed.attendanceRecords.length} records.`,
        type: 'success',
      });
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      get().addToast({
        title: 'Import Failed',
        message: 'The selected backup file is corrupt or invalid JSON.',
        type: 'error',
      });
      return false;
    }
  },

  initStore: async () => {
    if (get().isInitialized) return;

    const storage = getStorageAdapter();
    const [
      storedStudents,
      storedSemesters,
      storedSubjects,
      storedRecords,
      storedAssignments,
      storedExams,
      storedSettings,
    ] = await Promise.all([
      storage.getItem<StudentProfile[] | null>(STORAGE_KEYS.STUDENTS, null),
      storage.getItem<Semester[] | null>(STORAGE_KEYS.SEMESTERS, null),
      storage.getItem<Subject[] | null>(STORAGE_KEYS.SUBJECTS, null),
      storage.getItem<AttendanceRecord[] | null>(STORAGE_KEYS.RECORDS, null),
      storage.getItem<Assignment[] | null>(STORAGE_KEYS.ASSIGNMENTS, null),
      storage.getItem<ExamCountdown[] | null>(STORAGE_KEYS.EXAMS, null),
      storage.getItem<Settings | null>(STORAGE_KEYS.SETTINGS, null),
    ]);

    // If completely new visit with no stored data, initialize with demo dataset
    const isFirstRun = !storedStudents || !storedRecords;

    // Load students and ensure Loki and Madhu are used
    let students = storedStudents || DEMO_STUDENTS;
    let studentsUpdated = false;
    students = students.map((s) => {
      if (s.id === 'student-1' && (s.name === 'Alex Rivera' || s.name === 'Alex')) {
        studentsUpdated = true;
        return { ...s, name: 'Loki', email: 'loki@campus.edu' };
      }
      if (s.id === 'student-2' && (s.name === 'Samantha Chen' || s.name === 'Samantha')) {
        studentsUpdated = true;
        return { ...s, name: 'Madhu', email: 'madhu@campus.edu' };
      }
      return s;
    });

    const semesters = storedSemesters || DEMO_SEMESTERS;
    const subjects = storedSubjects || DEMO_SUBJECTS;
    const attendanceRecords = isFirstRun ? generateDemoAttendance() : storedRecords || [];
    const assignments = storedAssignments || DEMO_ASSIGNMENTS;
    const exams = storedExams || DEMO_EXAMS;
    const settings = storedSettings || DEMO_SETTINGS;

    if (isFirstRun || studentsUpdated) {
      await Promise.all([
        storage.setItem(STORAGE_KEYS.STUDENTS, students),
        storage.setItem(STORAGE_KEYS.SEMESTERS, semesters),
        storage.setItem(STORAGE_KEYS.SUBJECTS, subjects),
        storage.setItem(STORAGE_KEYS.RECORDS, attendanceRecords),
        storage.setItem(STORAGE_KEYS.ASSIGNMENTS, assignments),
        storage.setItem(STORAGE_KEYS.EXAMS, exams),
        storage.setItem(STORAGE_KEYS.SETTINGS, settings),
      ]);
    }

    applyThemeToDOM(settings.theme);

    set({
      isInitialized: true,
      students,
      semesters,
      subjects,
      attendanceRecords,
      assignments,
      exams,
      settings,
    });
  },
}));
