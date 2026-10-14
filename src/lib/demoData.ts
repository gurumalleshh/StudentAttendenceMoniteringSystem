import {
  StudentProfile,
  Semester,
  Subject,
  AttendanceRecord,
  Assignment,
  ExamCountdown,
  Settings,
  FullBackupData,
} from '../types';

export const DEMO_STUDENTS: StudentProfile[] = [
  {
    id: 'student-1',
    name: 'Loki',
    rollNo: 'CS23B1042',
    email: 'loki@campus.edu',
    avatarColor: '#6366f1',
  },
  {
    id: 'student-2',
    name: 'Madhu',
    rollNo: 'CS23B1089',
    email: 'madhu@campus.edu',
    avatarColor: '#10b981',
  },
];

export const DEMO_SEMESTERS: Semester[] = [
  {
    id: 'sem-fall-2026',
    studentId: 'student-1',
    name: 'Fall Semester 2026',
    startDate: '2026-08-17',
    endDate: '2026-12-18',
    targetAttendancePct: 75,
    alertThresholds: { red: 65, yellow: 75 },
    isArchived: false,
  },
  {
    id: 'sem-spring-2026',
    studentId: 'student-1',
    name: 'Spring Semester 2026 (Archived)',
    startDate: '2026-01-12',
    endDate: '2026-05-22',
    targetAttendancePct: 75,
    alertThresholds: { red: 65, yellow: 75 },
    isArchived: true,
  },
];

export const DEMO_SUBJECTS: Subject[] = [
  {
    id: 'sub-dsa',
    name: 'Data Structures & Algorithms',
    code: 'CS301',
    credits: 4,
    color: '#6366f1', // Indigo
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    semesterId: 'sem-fall-2026',
    timeSlot: '09:00 - 10:00 AM',
    room: 'Hall A-101',
    instructor: 'Dr. Aris Thorne',
  },
  {
    id: 'sub-os',
    name: 'Operating Systems & Kernels',
    code: 'CS302',
    credits: 4,
    color: '#06b6d4', // Cyan
    daysOfWeek: [2, 4], // Tue, Thu
    semesterId: 'sem-fall-2026',
    timeSlot: '10:15 - 11:45 AM',
    room: 'Hall B-204',
    instructor: 'Prof. Elena Rostova',
  },
  {
    id: 'sub-dbms',
    name: 'Database Management Systems',
    code: 'CS303',
    credits: 3,
    color: '#10b981', // Emerald
    daysOfWeek: [1, 3], // Mon, Wed
    semesterId: 'sem-fall-2026',
    timeSlot: '11:15 - 12:45 PM',
    room: 'Lab 2',
    instructor: 'Dr. Marcus Vance',
  },
  {
    id: 'sub-networks',
    name: 'Computer Networks & Protocols',
    code: 'CS304',
    credits: 3,
    color: '#f59e0b', // Amber
    daysOfWeek: [2, 4], // Tue, Thu
    semesterId: 'sem-fall-2026',
    timeSlot: '02:00 - 03:30 PM',
    room: 'Hall C-302',
    instructor: 'Prof. Sarah Jenkins',
  },
  {
    id: 'sub-math',
    name: 'Linear Algebra & Optimization',
    code: 'MA301',
    credits: 3,
    color: '#ec4899', // Pink
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    semesterId: 'sem-fall-2026',
    timeSlot: '02:00 - 03:00 PM',
    room: 'Hall A-201',
    instructor: 'Dr. Rajan Patel',
  },
];

/**
 * Deterministically generates ~8 weeks of realistic attendance records
 * for student-1 up through 2026-10-13.
 */
export const generateDemoAttendance = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const startDate = new Date('2026-08-17');
  const endDate = new Date('2026-10-13'); // Yesterday

  // Pattern profiles for subjects to achieve realistic percentages
  // sub-dsa: ~88% (present mostly)
  // sub-os: ~71% (borderline)
  // sub-dbms: ~93% (high)
  // sub-networks: ~62% (low / critical)
  // sub-math: ~80% (solid)

  let dsaIndex = 0;
  let osIndex = 0;
  let dbmsIndex = 0;
  let netIndex = 0;
  let mathIndex = 0;

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const dayOfWeek = cur.getDay(); // 0..6
    const isoDate = cur.toISOString().split('T')[0];

    // DSA (Mon, Wed, Fri)
    if (DEMO_SUBJECTS[0].daysOfWeek.includes(dayOfWeek)) {
      dsaIndex++;
      let status: 'PRESENT' | 'ABSENT' | 'NO_CLASS' = 'PRESENT';
      let note: string | undefined = undefined;
      if (dsaIndex === 8) {
        status = 'NO_CLASS';
        note = 'Campus Hackathon Day';
      } else if (dsaIndex === 5 || dsaIndex === 14 || dsaIndex === 21) {
        status = 'ABSENT';
        note = 'Transit delay';
      }
      records.push({
        id: `rec-dsa-${isoDate}`,
        subjectId: 'sub-dsa',
        studentId: 'student-1',
        date: isoDate,
        status,
        note,
      });
    }

    // OS (Tue, Thu)
    if (DEMO_SUBJECTS[1].daysOfWeek.includes(dayOfWeek)) {
      osIndex++;
      let status: 'PRESENT' | 'ABSENT' | 'NO_CLASS' = 'PRESENT';
      let note: string | undefined = undefined;
      if (osIndex === 6) {
        status = 'NO_CLASS';
        note = 'Faculty on institutional review';
      } else if ([3, 7, 11, 13].includes(osIndex)) {
        status = 'ABSENT';
        note = 'Cold & fever';
      }
      records.push({
        id: `rec-os-${isoDate}`,
        subjectId: 'sub-os',
        studentId: 'student-1',
        date: isoDate,
        status,
        note,
      });
    }

    // DBMS (Mon, Wed)
    if (DEMO_SUBJECTS[2].daysOfWeek.includes(dayOfWeek)) {
      dbmsIndex++;
      let status: 'PRESENT' | 'ABSENT' | 'NO_CLASS' = 'PRESENT';
      let note: string | undefined = undefined;
      if (dbmsIndex === 7) {
        status = 'ABSENT';
        note = 'Doctor consultation';
      }
      records.push({
        id: `rec-dbms-${isoDate}`,
        subjectId: 'sub-dbms',
        studentId: 'student-1',
        date: isoDate,
        status,
        note,
      });
    }

    // Networks (Tue, Thu)
    if (DEMO_SUBJECTS[3].daysOfWeek.includes(dayOfWeek)) {
      netIndex++;
      let status: 'PRESENT' | 'ABSENT' | 'NO_CLASS' = 'PRESENT';
      let note: string | undefined = undefined;
      if (netIndex === 4) {
        status = 'NO_CLASS';
        note = 'Network lab maintenance';
      } else if ([2, 5, 8, 10, 12, 14].includes(netIndex)) {
        status = 'ABSENT';
        note = netIndex === 2 ? 'Missed bus' : 'Sick leave';
      }
      records.push({
        id: `rec-networks-${isoDate}`,
        subjectId: 'sub-networks',
        studentId: 'student-1',
        date: isoDate,
        status,
        note,
      });
    }

    // Math (Mon, Wed, Fri)
    if (DEMO_SUBJECTS[4].daysOfWeek.includes(dayOfWeek)) {
      mathIndex++;
      let status: 'PRESENT' | 'ABSENT' | 'NO_CLASS' = 'PRESENT';
      let note: string | undefined = undefined;
      if ([4, 9, 15, 19].includes(mathIndex)) {
        status = 'ABSENT';
        note = 'Preparing project submission';
      } else if (mathIndex === 12) {
        status = 'NO_CLASS';
        note = 'Department guest seminar';
      }
      records.push({
        id: `rec-math-${isoDate}`,
        subjectId: 'sub-math',
        studentId: 'student-1',
        date: isoDate,
        status,
        note,
      });
    }

    cur.setDate(cur.getDate() + 1);
  }

  return records;
};

export const DEMO_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-1',
    studentId: 'student-1',
    subjectId: 'sub-dsa',
    title: 'Red-Black Tree & AVL Benchmark Suite',
    dueDate: '2026-10-18',
    completed: false,
    priority: 'high',
    description: 'Implement self-balancing search trees and plot search latency across 100k items.',
  },
  {
    id: 'asg-2',
    studentId: 'student-1',
    subjectId: 'sub-os',
    title: 'Multi-threaded Producer-Consumer Semaphore',
    dueDate: '2026-10-22',
    completed: false,
    priority: 'medium',
    description: 'POSIX mutex and condition variables with bounded circular buffer.',
  },
  {
    id: 'asg-3',
    studentId: 'student-1',
    subjectId: 'sub-dbms',
    title: 'B+ Tree Index Simulation & Query Execution Plan',
    dueDate: '2026-10-12',
    completed: true,
    priority: 'medium',
    description: 'Cost-based query optimizer comparison.',
  },
  {
    id: 'asg-4',
    studentId: 'student-1',
    subjectId: 'sub-networks',
    title: 'Packet Sniffer & TCP Handshake Analyzer',
    dueDate: '2026-10-25',
    completed: false,
    priority: 'high',
    description: 'Raw socket dissection of IP headers, TCP flags, and packet loss simulation.',
  },
];

export const DEMO_EXAMS: ExamCountdown[] = [
  {
    id: 'exam-1',
    studentId: 'student-1',
    subjectId: 'sub-os',
    title: 'Operating Systems Mid-Semester Exam',
    examDate: '2026-10-28',
    room: 'Auditorium West',
  },
  {
    id: 'exam-2',
    studentId: 'student-1',
    subjectId: 'sub-dsa',
    title: 'Data Structures Practical & Coding Assessment',
    examDate: '2026-11-04',
    room: 'Main Lab 102',
  },
  {
    id: 'exam-3',
    studentId: 'student-1',
    subjectId: 'sub-networks',
    title: 'Computer Networks Theoretical Exam',
    examDate: '2026-11-12',
    room: 'Hall B-105',
  },
];

export const DEMO_SETTINGS: Settings = {
  theme: 'system',
  currentStudentId: 'student-1',
  currentSemesterId: 'sem-fall-2026',
  notificationsEnabled: true,
};

export const getFullDemoBackup = (): FullBackupData => ({
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  students: DEMO_STUDENTS,
  semesters: DEMO_SEMESTERS,
  subjects: DEMO_SUBJECTS,
  attendanceRecords: generateDemoAttendance(),
  assignments: DEMO_ASSIGNMENTS,
  exams: DEMO_EXAMS,
  settings: DEMO_SETTINGS,
});
