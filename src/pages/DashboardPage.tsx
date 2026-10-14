import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  overallWeightedPct,
  getSubjectStats,
  getAttendanceCounts,
} from '../lib/attendanceEngine';
import { RadialProgressRing } from '../components/common/RadialProgressRing';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DashboardPage: React.FC = () => {
  const {
    students,
    semesters,
    subjects,
    attendanceRecords,
    assignments,
    exams,
    settings,
    selectedDate,
    setSelectedDate,
    markAttendance,
    setActiveTab,
  } = useAppStore();

  const currentStudent =
    students.find((s) => s.id === settings.currentStudentId) || students[0];
  const currentSemester =
    semesters.find((s) => s.id === settings.currentSemesterId) || semesters[0];

  const studentSubjects = subjects.filter((s) => s.semesterId === currentSemester?.id);
  const studentRecords = attendanceRecords.filter(
    (r) => r.studentId === currentStudent?.id
  );

  const overallPct = overallWeightedPct(studentSubjects, studentRecords);
  const targetPct = currentSemester?.targetAttendancePct || 75;

  // Selected date Day of Week: 0 = Sun .. 6 = Sat
  const selectedDateObj = new Date(selectedDate);
  const dayOfWeek = selectedDateObj.getDay();

  // ONLY today's scheduled subjects (derived from daysOfWeek + selected date)
  const todayScheduledSubjects = studentSubjects.filter((s) =>
    s.daysOfWeek.includes(dayOfWeek)
  );

  // Map of records for selected date: subjectId -> record
  const selectedDateRecords = new Map(
    studentRecords
      .filter((r) => r.date === selectedDate)
      .map((r) => [r.subjectId, r])
  );

  // Compute all subject stats
  const subjectStatsList = studentSubjects.map((sub) => {
    return {
      subject: sub,
      stats: getSubjectStats(sub, studentRecords, targetPct, currentSemester?.endDate),
    };
  });

  // Critical and Warning alerts
  const criticalSubjects = subjectStatsList.filter(
    (s) => s.stats.pct !== null && s.stats.pct < (currentSemester?.alertThresholds.red || 65)
  );
  const warningSubjects = subjectStatsList.filter(
    (s) =>
      s.stats.pct !== null &&
      s.stats.pct >= (currentSemester?.alertThresholds.red || 65) &&
      s.stats.pct < targetPct
  );
  const safeSubjects = subjectStatsList.filter(
    (s) => s.stats.pct !== null && s.stats.pct >= targetPct
  );

  // Trigger confetti when overall percentage is safely above target
  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#10b981', '#06b6d4', '#ec4899'],
    });
  };

  // Upcoming deadlines (next 7 days)
  const todayIso = new Date().toISOString().split('T')[0];
  const upcomingAssignments = assignments
    .filter((a) => a.studentId === currentStudent?.id && !a.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const upcomingExams = exams
    .filter((e) => e.studentId === currentStudent?.id && e.examDate >= todayIso)
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
    .slice(0, 2);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formattedDayName = dayNames[dayOfWeek];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-600/10 via-indigo-500/5 to-transparent p-5 sm:p-6 rounded-2xl border border-brand-500/15">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Hello, {currentStudent?.name.split(' ')[0]} 👋
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-brand-500/15 text-brand-700 dark:text-brand-300 rounded-full font-mono">
              {currentStudent?.rollNo}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {currentSemester?.name} • Target threshold:{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{targetPct}%</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/25 transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Alerts Banner (exact engine bunk/must-attend recommendation) */}
      {(criticalSubjects.length > 0 || warningSubjects.length > 0) && (
        <div className="space-y-3">
          {criticalSubjects.map(({ subject, stats }) => (
            <div
              key={subject.id}
              className="flex items-start gap-3 p-4 bg-rose-50/90 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    CRITICAL: {subject.name} ({stats.pct}%)
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.2 bg-rose-200/60 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 rounded font-semibold">
                    {subject.code}
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  Attendance has dropped below 65%!{' '}
                  {stats.projection.isMustAttendPossible ? (
                    <>
                      You must attend the next{' '}
                      <strong className="underline decoration-rose-500 decoration-2 font-bold">
                        {stats.projection.mustAttend} consecutive classes
                      </strong>{' '}
                      to restore your attendance to the {targetPct}% required benchmark.
                    </>
                  ) : (
                    <strong className="font-bold">
                      Recovery alert: The required attendances exceed the remaining classes this
                      semester. Consult your faculty immediately!
                    </strong>
                  )}
                </p>
              </div>
            </div>
          ))}

          {warningSubjects.map(({ subject, stats }) => (
            <div
              key={subject.id}
              className="flex items-start gap-3 p-4 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl shadow-sm"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    ATTENTION: {subject.name} ({stats.pct}%)
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.2 bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded font-semibold">
                    {subject.code}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Currently below target ({targetPct}%). Attend the next{' '}
                  <strong className="font-bold underline decoration-amber-500 decoration-2">
                    {stats.projection.mustAttend} classes
                  </strong>{' '}
                  without missing any to cross the safe zone.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall Weighted Gauge Card */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Overall Weighted Attendance
              </span>
              {overallPct !== null && overallPct >= targetPct && (
                <button
                  onClick={triggerCelebration}
                  title="Celebrate reaching target!"
                  className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                >
                  <Zap className="w-4 h-4 fill-emerald-500" />
                </button>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Credit-weighted formula Σ(pct × credits) / Σ(credits)
            </p>
          </div>

          <div className="my-4 flex items-center justify-center">
            <RadialProgressRing
              percentage={overallPct}
              targetPercentage={targetPct}
              size={160}
              strokeWidth={14}
              sublabel="Weighted"
              thresholds={currentSemester?.alertThresholds}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
              <p
                className={`text-xs font-bold mt-0.5 ${
                  overallPct === null
                    ? 'text-slate-500'
                    : overallPct >= targetPct
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : overallPct >= (currentSemester?.alertThresholds.red || 65)
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {overallPct === null
                  ? 'No Data'
                  : overallPct >= targetPct
                  ? 'Safe Zone'
                  : overallPct >= (currentSemester?.alertThresholds.red || 65)
                  ? 'Warning'
                  : 'Critical'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Credits</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {studentSubjects.reduce((acc, s) => acc + s.credits, 0)} Total
              </p>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Goal</span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                ≥ {targetPct}%
              </p>
            </div>
          </div>
        </div>

        {/* Quick Projection & Bunk Advisor */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Smart Bunk & Recovery Advisor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time mathematical simulations based on university regulations
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Target: {targetPct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {/* Top Bunkable Subject */}
            {safeSubjects.length > 0 ? (
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Safe to Bunk 🎉
                  </span>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {safeSubjects[0].stats.pct}%
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                  {safeSubjects[0].subject.name}
                </h4>
                <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {safeSubjects[0].stats.projection.canBunk}{' '}
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    classes skippable
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  You can miss up to {safeSubjects[0].stats.projection.canBunk} consecutive lectures
                  without dropping below {targetPct}%.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  No Bunk Margin
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  All subjects are currently at or below the target threshold. Maintain regular
                  attendance to build your buffer.
                </p>
              </div>
            )}

            {/* Most Critical Subject Needing Attendance */}
            {criticalSubjects.length > 0 || warningSubjects.length > 0 ? (
              (() => {
                const highestPriority =
                  criticalSubjects[0] || warningSubjects[0];
                return (
                  <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-800/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        Immediate Recovery Needed
                      </span>
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                        {highestPriority.stats.pct}%
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                      {highestPriority.subject.name}
                    </h4>
                    <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                      {highestPriority.stats.projection.mustAttend}{' '}
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        classes needed
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Attend the next {highestPriority.stats.projection.mustAttend} classes in a row
                      to restore {targetPct}% compliance.
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 rounded-xl">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All Subjects On Track!</span>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Every enrolled subject meets or exceeds your {targetPct}% target attendance
                  standard. Keep up the great consistency!
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Active enrolled subjects: {studentSubjects.length}
            </span>
            <button
              onClick={() => setActiveTab('analytics')}
              className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              <span>View full projections & charts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* TODAY'S SCHEDULED SUBJECTS (Derived from daysOfWeek + selected date) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Scheduled For Today ({formattedDayName}, {selectedDate})
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {todayScheduledSubjects.length} classes scheduled
          </span>
        </div>

        {todayScheduledSubjects.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              No Classes Scheduled for {formattedDayName}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Enjoy your lecture-free day, study for upcoming exams, or switch dates in the header
              to review or mark past attendance.
            </p>
            <button
              onClick={() => setActiveTab('attendance')}
              className="mt-4 px-4 py-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100 text-xs font-semibold rounded-xl transition-colors"
            >
              Go to Mark Attendance Page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayScheduledSubjects.map((subject) => {
              const currentRecord = selectedDateRecords.get(subject.id);
              const counts = getAttendanceCounts(studentRecords, subject.id);
              const stats = getSubjectStats(
                subject,
                studentRecords,
                targetPct,
                currentSemester?.endDate
              );

              return (
                <div
                  key={subject.id}
                  className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: subject.color }}
                  />

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                          {subject.code}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {subject.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm font-black ${
                            stats.pct === null
                              ? 'text-slate-400'
                              : stats.pct >= targetPct
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : stats.pct >= (currentSemester?.alertThresholds.red || 65)
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {stats.pct !== null ? `${stats.pct}%` : 'N/A'}
                        </span>
                        <p className="text-[10px] text-slate-400">{subject.credits} Credits</p>
                      </div>
                    </div>

                    {/* Time Slot & Room */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {subject.timeSlot && (
                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{subject.timeSlot}</span>
                        </span>
                      )}
                      {subject.room && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {subject.room}
                        </span>
                      )}
                    </div>

                    {/* Attendance quick breakdown */}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span>
                        Held: <strong>{counts.totalHeld}</strong> (P: {counts.present}, A:{' '}
                        {counts.absent})
                      </span>
                      {currentRecord ? (
                        <StatusBadge status={currentRecord.status} size="sm" />
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Unmarked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Quick Marking Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => markAttendance(subject.id, 'PRESENT', selectedDate)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                        currentRecord?.status === 'PRESENT'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                      }`}
                    >
                      <span>Present</span>
                    </button>

                    <button
                      onClick={() => markAttendance(subject.id, 'ABSENT', selectedDate)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                        currentRecord?.status === 'ABSENT'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                      }`}
                    >
                      <span>Absent</span>
                    </button>

                    <button
                      onClick={() =>
                        markAttendance(
                          subject.id,
                          'NO_CLASS',
                          selectedDate,
                          'No lecture held'
                        )
                      }
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                        currentRecord?.status === 'NO_CLASS'
                          ? 'bg-slate-700 text-white dark:bg-slate-600'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>No Class</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deadlines & Exams Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assignments Preview */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Pending Assignments
            </h3>
            <button
              onClick={() => setActiveTab('assignments')}
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              View All
            </button>
          </div>

          {upcomingAssignments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No pending assignments! All caught up.
            </p>
          ) : (
            <div className="space-y-2.5">
              {upcomingAssignments.map((asg) => {
                const sub = subjects.find((s) => s.id === asg.subjectId);
                const isOverdue = asg.dueDate < todayIso;
                return (
                  <div
                    key={asg.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {sub?.code || 'GEN'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {asg.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Due: {asg.dueDate}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOverdue
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          : 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                      }`}
                    >
                      {isOverdue ? 'Overdue' : 'Due Soon'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Exams Countdown Preview */}
        <div className="glass-panel p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Upcoming Exams Countdown
            </h3>
            <button
              onClick={() => setActiveTab('assignments')}
              className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              View Schedule
            </button>
          </div>

          {upcomingExams.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No exams scheduled in this semester yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {upcomingExams.map((exam) => {
                const sub = subjects.find((s) => s.id === exam.subjectId);
                const examDateObj = new Date(exam.examDate);
                const diffTime = examDateObj.getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={exam.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-brand-500/10 to-indigo-500/5 rounded-xl border border-brand-500/20"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-[10px] font-mono font-bold text-brand-600 dark:text-brand-400">
                        {sub?.code} • {exam.room || 'TBD'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {exam.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Date: {exam.examDate}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-base font-black text-brand-600 dark:text-brand-400">
                        {diffDays > 0 ? `${diffDays}d` : 'Today'}
                      </span>
                      <p className="text-[10px] text-slate-400">remaining</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
