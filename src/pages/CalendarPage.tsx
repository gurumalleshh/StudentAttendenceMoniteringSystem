import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AttendanceStatus, Subject } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  Plus,
  FileText,
  Clock,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const {
    students,
    semesters,
    subjects,
    attendanceRecords,
    settings,
    selectedDate,
    setSelectedDate,
    markAttendance,
    removeAttendanceRecord,
    addToast,
  } = useAppStore();

  const currentStudent =
    students.find((s) => s.id === settings.currentStudentId) || students[0];
  const currentSemester =
    semesters.find((s) => s.id === settings.currentSemesterId) || semesters[0];

  const studentSubjects = subjects.filter((s) => s.semesterId === currentSemester?.id);
  const studentRecords = attendanceRecords.filter(
    (r) => r.studentId === currentStudent?.id
  );

  // Current calendar view month/year
  const [currentYear, setCurrentYear] = useState(() =>
    new Date(selectedDate).getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(() =>
    new Date(selectedDate).getMonth()
  ); // 0 = Jan .. 11 = Dec

  // Inspection drawer / modal for clicked date
  const [inspectDate, setInspectDate] = useState<string | null>(selectedDate);
  const [noteModalSubject, setNoteModalSubject] = useState<Subject | null>(null);
  const [noteText, setNoteText] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const iso = now.toISOString().split('T')[0];
    setSelectedDate(iso);
    setInspectDate(iso);
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Create date cells
  const calendarCells: Array<{
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateStr: string;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ day, month: m, year: y, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ day, month: currentMonth, year: currentYear, isCurrentMonth: true, dateStr });
  }

  // Next month leading days to complete grid (42 cells: 6 weeks)
  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ day, month: m, year: y, isCurrentMonth: false, dateStr });
  }

  // Map attendance records by date for fast lookup
  const recordsByDate = new Map<string, typeof studentRecords>();
  for (const r of studentRecords) {
    const list = recordsByDate.get(r.date) || [];
    list.push(r);
    recordsByDate.set(r.date, list);
  }

  const todayIso = new Date().toISOString().split('T')[0];

  // Inspected Date info
  const inspectedDateObj = inspectDate ? new Date(inspectDate) : new Date();
  const inspectedDayOfWeek = inspectedDateObj.getDay();
  const inspectedScheduledSubjects = studentSubjects.filter((s) =>
    s.daysOfWeek.includes(inspectedDayOfWeek)
  );
  const inspectedRecords = inspectDate ? recordsByDate.get(inspectDate) || [] : [];
  const inspectedRecordsMap = new Map(inspectedRecords.map((r) => [r.subjectId, r]));

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Calendar Header Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Attendance Calendar
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Click any past or upcoming date to inspect, mark, or retroactively edit attendance logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white min-w-[130px] text-center">
              {months[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={jumpToToday}
            className="px-3 py-2 text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 hover:bg-brand-100 rounded-xl transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Grid View */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl shadow-sm overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <span
                key={d}
                className={`text-[11px] font-bold py-1 uppercase tracking-wider ${
                  i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell) => {
              const dayRecords = recordsByDate.get(cell.dateStr) || [];
              const isSelected = cell.dateStr === inspectDate;
              const isToday = cell.dateStr === todayIso;

              const presentCount = dayRecords.filter((r) => r.status === 'PRESENT').length;
              const absentCount = dayRecords.filter((r) => r.status === 'ABSENT').length;
              const noClassCount = dayRecords.filter((r) => r.status === 'NO_CLASS').length;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => {
                    setInspectDate(cell.dateStr);
                    setSelectedDate(cell.dateStr);
                  }}
                  className={`min-h-[64px] sm:min-h-[76px] p-1.5 rounded-xl text-left transition-all flex flex-col justify-between border relative ${
                    isSelected
                      ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500 shadow-sm'
                      : cell.isCurrentMonth
                      ? 'bg-white/60 dark:bg-slate-850/60 border-slate-200/80 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]'
                          : isSelected
                          ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                          : cell.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {dayRecords.length > 0 && (
                      <span className="text-[9px] font-mono text-slate-400">
                        {dayRecords.length}
                      </span>
                    )}
                  </div>

                  {/* Attendance Indicators */}
                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                    {presentCount > 0 && (
                      <span
                        title={`${presentCount} Present`}
                        className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"
                      />
                    )}
                    {absentCount > 0 && (
                      <span
                        title={`${absentCount} Absent`}
                        className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"
                      />
                    )}
                    {noClassCount > 0 && (
                      <span
                        title={`${noClassCount} No Class`}
                        className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>No Class</span>
            </div>
          </div>
        </div>

        {/* Date Inspection & Retroactive Edit Drawer */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  Inspecting Date
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {inspectDate || 'No date selected'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDate(inspectDate || todayIso)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold"
              >
                Set as Active Date
              </button>
            </div>

            {/* List of Subjects for this date */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Timetable Classes ({inspectedScheduledSubjects.length})
                </span>
              </div>

              {studentSubjects.map((sub) => {
                const isScheduled = sub.daysOfWeek.includes(inspectedDayOfWeek);
                const rec = inspectedRecordsMap.get(sub.id);

                return (
                  <div
                    key={sub.id}
                    className={`p-3 rounded-xl border transition-all ${
                      rec
                        ? 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        : isScheduled
                        ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
                        : 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-500">
                            {sub.code}
                          </span>
                          {!isScheduled && (
                            <span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-300">
                              Unscheduled
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {sub.name}
                        </h4>
                      </div>

                      {rec ? (
                        <StatusBadge status={rec.status} size="sm" />
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Unmarked</span>
                      )}
                    </div>

                    {rec?.note && (
                      <p className="mt-1 text-[11px] text-slate-500 italic truncate">
                        &quot;{rec.note}&quot;
                      </p>
                    )}

                    {/* Quick Retroactive Buttons */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-3 gap-1">
                      <button
                        onClick={() => inspectDate && markAttendance(sub.id, 'PRESENT', inspectDate)}
                        className={`py-1 text-[11px] font-bold rounded-lg transition-colors ${
                          rec?.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => inspectDate && markAttendance(sub.id, 'ABSENT', inspectDate)}
                        className={`py-1 text-[11px] font-bold rounded-lg transition-colors ${
                          rec?.status === 'ABSENT'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() =>
                          inspectDate && markAttendance(sub.id, 'NO_CLASS', inspectDate, 'Cancelled')
                        }
                        className={`py-1 text-[11px] font-bold rounded-lg transition-colors ${
                          rec?.status === 'NO_CLASS'
                            ? 'bg-slate-700 text-white dark:bg-slate-600'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        No Class
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Changes reflect immediately across all projection engines.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
