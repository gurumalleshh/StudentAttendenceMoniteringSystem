import { Subject, AttendanceRecord, Semester, StudentProfile } from '../types';
import { getSubjectStats, overallWeightedPct } from './attendanceEngine';

export const exportAttendanceSummaryCSV = (
  student: StudentProfile,
  semester: Semester,
  subjects: Subject[],
  records: AttendanceRecord[]
): void => {
  const headers = [
    'Subject Code',
    'Subject Name',
    'Credits',
    'Present',
    'Absent',
    'No Class',
    'Total Held',
    'Attendance %',
    'Status',
    'Can Bunk',
    'Must Attend Next',
  ];

  const rows = subjects.map((sub) => {
    const stats = getSubjectStats(sub, records, semester.targetAttendancePct, semester.endDate);
    const pctStr = stats.pct !== null ? `${stats.pct}%` : 'N/A';
    return [
      `"${sub.code}"`,
      `"${sub.name}"`,
      sub.credits,
      stats.present,
      stats.absent,
      stats.noClass,
      stats.totalHeld,
      pctStr,
      stats.projection.status,
      stats.projection.canBunk,
      stats.projection.mustAttend > 0
        ? stats.projection.isMustAttendPossible
          ? stats.projection.mustAttend
          : `${stats.projection.mustAttend} (Impossible this sem)`
        : 0,
    ].join(',');
  });

  const weighted = overallWeightedPct(subjects, records);
  const summaryHeader = [
    `"STUDENT ATTENDANCE REPORT"`,
    `"Student: ${student.name} (${student.rollNo})"`,
    `"Semester: ${semester.name}"`,
    `"Target Threshold: ${semester.targetAttendancePct}%"`,
    `"Overall Weighted Attendance: ${weighted !== null ? `${weighted}%` : 'N/A'}"`,
    `"Generated On: ${new Date().toLocaleDateString()}"`,
    '',
  ].join('\n');

  const csvContent = `${summaryHeader}\n${headers.join(',')}\n${rows.join('\n')}`;
  downloadBlob(csvContent, `attendance_summary_${student.rollNo}_${semester.name.replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8;');
};

export const exportDetailedAttendanceLogsCSV = (
  student: StudentProfile,
  semester: Semester,
  subjects: Subject[],
  records: AttendanceRecord[]
): void => {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  const headers = [
    'Date',
    'Subject Code',
    'Subject Name',
    'Status',
    'Note',
  ];

  const rows = sortedRecords.map((r) => {
    const sub = subjectMap.get(r.subjectId);
    return [
      `"${r.date}"`,
      `"${sub ? sub.code : 'UNKNOWN'}"`,
      `"${sub ? sub.name : 'Unknown Subject'}"`,
      `"${r.status}"`,
      `"${(r.note || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const summaryHeader = [
    `"DETAILED ATTENDANCE LOG"`,
    `"Student: ${student.name} (${student.rollNo})"`,
    `"Semester: ${semester.name}"`,
    `"Generated On: ${new Date().toLocaleDateString()}"`,
    '',
  ].join('\n');

  const csvContent = `${summaryHeader}\n${headers.join(',')}\n${rows.join('\n')}`;
  downloadBlob(csvContent, `attendance_logs_${student.rollNo}_${semester.name.replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8;');
};

const downloadBlob = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
