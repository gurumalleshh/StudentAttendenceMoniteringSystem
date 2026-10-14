import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { AttendanceStatus, Subject } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  FileText,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
  Command,
  Trash2,
} from 'lucide-react';

export const MarkAttendancePage: React.FC = () => {
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
    markAllPresentForDate,
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

  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Note Modal state
  const [activeNoteSubject, setActiveNoteSubject] = useState<Subject | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteStatus, setNoteStatus] = useState<AttendanceStatus>('NO_CLASS');

  const selectedDateObj = new Date(selectedDate);
  const dayOfWeek = selectedDateObj.getDay(); // 0 = Sun .. 6 = Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formattedDay = dayNames[dayOfWeek];

  // Scheduled vs All subjects
  const scheduledSubjects = studentSubjects.filter((s) =>
    s.daysOfWeek.includes(dayOfWeek)
  );
  const displayedSubjects = showAllSubjects ? studentSubjects : scheduledSubjects;

  // Selected date records mapped: subjectId -> record
  const dateRecordsMap = new Map(
    studentRecords
      .filter((r) => r.date === selectedDate)
      .map((r) => [r.subjectId, r])
  );

  // Date validation guards
  const semesterStart = currentSemester?.startDate || '2026-08-17';
  const isBeforeSemesterStart = selectedDate < semesterStart;
  const todayIso = new Date().toISOString().split('T')[0];
  const isFutureDate = selectedDate > todayIso;

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Keyboard Shortcuts (P, A, N, ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (displayedSubjects.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % displayedSubjects.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + displayedSubjects.length) % displayedSubjects.length);
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        const currentSub = displayedSubjects[focusedIndex];
        if (currentSub) {
          handleMark(currentSub.id, 'PRESENT');
        }
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        const currentSub = displayedSubjects[focusedIndex];
        if (currentSub) {
          handleMark(currentSub.id, 'ABSENT');
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const currentSub = displayedSubjects[focusedIndex];
        if (currentSub) {
          handleMark(currentSub.id, 'NO_CLASS');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedSubjects, focusedIndex, selectedDate]);

  // Ensure focused index stays within bounds
  useEffect(() => {
    if (focusedIndex >= displayedSubjects.length) {
      setFocusedIndex(Math.max(0, displayedSubjects.length - 1));
    }
  }, [displayedSubjects.length, focusedIndex]);

  const handleMark = (subjectId: string, status: AttendanceStatus, note?: string) => {
    if (isBeforeSemesterStart) {
      addToast({
        title: 'Pre-Semester Date',
        message: `Date is prior to semester start (${semesterStart}). Marking recorded retroactively.`,
        type: 'warning',
      });
    }

    if (isFutureDate && status === 'NO_CLASS') {
      addToast({
        title: 'Future No-Class Warning',
        message: 'Marking a future date as NO_CLASS ahead of time.',
        type: 'info',
      });
    }

    markAttendance(subjectId, status, selectedDate, note);
  };

  const openNoteDialog = (subject: Subject) => {
    const rec = dateRecordsMap.get(subject.id);
    setActiveNoteSubject(subject);
    setNoteStatus(rec?.status || 'NO_CLASS');
    setNoteText(rec?.note || '');
  };

  const handleSaveNote = () => {
    if (!activeNoteSubject) return;
    markAttendance(activeNoteSubject.id, noteStatus, selectedDate, noteText);
    setActiveNoteSubject(null);
    addToast({
      title: 'Note Saved',
      message: `Updated record for ${activeNoteSubject.code}`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Date Selector Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Mark Attendance
              </h1>
              <span className="text-xs px-2.5 py-0.5 bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-full font-semibold">
                {currentStudent?.name}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Record present, absent, or no-class logs with notes and keyboard shortcuts.
            </p>
          </div>

          {/* Quick Date Switcher Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                aria-label="Selected date"
              />
            </div>

            <button
              onClick={() => shiftDate(1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-2 text-xs font-semibold bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 hover:bg-brand-100 rounded-xl transition-colors"
            >
              Jump to Today
            </button>
          </div>
        </div>

        {/* Date Validation Warnings */}
        {isBeforeSemesterStart && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Pre-Semester Date Notice:</strong> {selectedDate} is before the semester start
              date ({semesterStart}). Attendance logged here will still be counted.
            </span>
          </div>
        )}

        {isFutureDate && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-xl text-xs text-indigo-800 dark:text-indigo-300">
            <Info className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <span>
              <strong>Future Date:</strong> You are viewing or scheduling attendance for an upcoming
              date ({selectedDate}).
            </span>
          </div>
        )}
      </div>

      {/* Action Toolbar & Keyboard Shortcut Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAllPresentForDate(selectedDate)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Present for Today</span>
          </button>

          <button
            onClick={() => setShowAllSubjects(!showAllSubjects)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              showAllSubjects
                ? 'bg-brand-50 text-brand-600 border-brand-300 dark:bg-brand-950/50 dark:text-brand-400 dark:border-brand-800'
                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}
          >
            {showAllSubjects ? 'Showing All Subjects' : 'Show Unscheduled Subjects'}
          </button>
        </div>

        {/* Keyboard shortcut badges */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Command className="w-3.5 h-3.5" />
          <span>Keyboard:</span>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-mono">
            P = Present
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-mono">
            A = Absent
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-mono">
            N = No Class
          </kbd>
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-mono">
            ↑ / ↓ = Select
          </kbd>
        </div>
      </div>

      {/* Subjects List */}
      <div className="space-y-3">
        {displayedSubjects.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              No classes scheduled on {formattedDay}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are no timetable classes for this day. Click &quot;Show Unscheduled
              Subjects&quot; if an extra lecture or makeup class was conducted.
            </p>
            <button
              onClick={() => setShowAllSubjects(true)}
              className="mt-4 px-4 py-2 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 hover:bg-brand-100 text-xs font-semibold rounded-xl"
            >
              Show All Subjects for Extra Class
            </button>
          </div>
        ) : (
          displayedSubjects.map((subject, index) => {
            const currentRecord = dateRecordsMap.get(subject.id);
            const isFocused = index === focusedIndex;
            const isScheduledToday = subject.daysOfWeek.includes(dayOfWeek);

            return (
              <div
                key={subject.id}
                onClick={() => setFocusedIndex(index)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative ${
                  isFocused
                    ? 'ring-2 ring-brand-500 bg-white dark:bg-slate-900 shadow-md border-brand-500/50'
                    : 'bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Visual focus pill indicator */}
                {isFocused && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.2 bg-brand-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                    Focused (P / A / N)
                  </span>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className="w-3.5 h-12 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                          {subject.code}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {subject.name}
                        </h3>
                        {!isScheduledToday && (
                          <span className="px-2 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold rounded">
                            Extra Class
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {subject.timeSlot && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{subject.timeSlot}</span>
                          </span>
                        )}
                        {subject.room && <span>• {subject.room}</span>}
                        <span>• {subject.credits} Credits</span>
                        {subject.instructor && <span>• {subject.instructor}</span>}
                      </div>

                      {/* Note display if exists */}
                      {currentRecord?.note && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>Note: &quot;{currentRecord.note}&quot;</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Present / Absent / No Class + Note */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMark(subject.id, 'PRESENT');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentRecord?.status === 'PRESENT'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                      }`}
                    >
                      <span>Present</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMark(subject.id, 'ABSENT');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentRecord?.status === 'ABSENT'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-900'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                      }`}
                    >
                      <span>Absent</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMark(subject.id, 'NO_CLASS', currentRecord?.note || 'Class cancelled');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        currentRecord?.status === 'NO_CLASS'
                          ? 'bg-slate-700 text-white dark:bg-slate-600 shadow-md ring-2 ring-slate-500 ring-offset-2 dark:ring-offset-slate-900'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>No Class</span>
                    </button>

                    {/* Note Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNoteDialog(subject);
                      }}
                      title="Add or edit note for this record"
                      className={`p-2 rounded-xl border transition-colors ${
                        currentRecord?.note
                          ? 'bg-brand-50 border-brand-300 text-brand-600 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-400'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Clear button if record exists */}
                    {currentRecord && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttendanceRecord(subject.id, selectedDate);
                        }}
                        title="Clear record for this date"
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Note Edit Modal */}
      <Modal
        isOpen={Boolean(activeNoteSubject)}
        onClose={() => setActiveNoteSubject(null)}
        title={activeNoteSubject ? `Add Attendance Note — ${activeNoteSubject.code}` : 'Add Note'}
        description={`Record notes for ${selectedDate} (e.g. "Professor conference", "Sick leave")`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Status for Date
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['PRESENT', 'ABSENT', 'NO_CLASS'] as AttendanceStatus[]).map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setNoteStatus(status)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    noteStatus === status
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 ring-2 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {status === 'PRESENT' ? 'Present' : status === 'ABSENT' ? 'Absent' : 'No Class'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note Description
            </label>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Faculty on conference leave, guest lecture by Dr. Alan, sick with flu..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveNoteSubject(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/25"
            >
              Save Attendance Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
