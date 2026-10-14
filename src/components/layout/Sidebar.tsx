import React from 'react';
import { useAppStore, NavTab } from '../../store/useAppStore';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Clock,
  BookOpen,
  BarChart3,
  CheckSquare,
  Settings as SettingsIcon,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { overallWeightedPct } from '../../lib/attendanceEngine';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    students,
    semesters,
    subjects,
    attendanceRecords,
    settings,
  } = useAppStore();

  const currentStudent = students.find((s) => s.id === settings.currentStudentId) || students[0];
  const currentSemester =
    semesters.find((s) => s.id === settings.currentSemesterId) || semesters[0];

  const studentSubjects = subjects.filter((s) => s.semesterId === currentSemester?.id);
  const studentRecords = attendanceRecords.filter(
    (r) => r.studentId === currentStudent?.id
  );
  const overallPct = overallWeightedPct(studentSubjects, studentRecords);

  const navItems: Array<{ id: NavTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Mark Attendance', icon: CalendarCheck },
    { id: 'calendar', label: 'Calendar View', icon: CalendarDays },
    { id: 'timetable', label: 'Timetable Grid', icon: Clock },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, badge: `${studentSubjects.length}` },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'assignments', label: 'Assignments & Exams', icon: CheckSquare },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base">
                  AttendTrack
                </span>
                <span className="px-1.5 py-0.2 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold rounded">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Attendance Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Student Profile Quick View */}
        <div className="p-4 mx-3 my-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-750">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm"
              style={{ backgroundColor: currentStudent?.avatarColor || '#6366f1' }}
            >
              {currentStudent?.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'ST'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentStudent?.name || 'Active Student'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {currentStudent?.rollNo || 'Roll #'}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
              {currentSemester?.name || 'Current Term'}
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                overallPct === null
                  ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  : overallPct >= (currentSemester?.targetAttendancePct || 75)
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : overallPct >= (currentSemester?.alertThresholds.red || 65)
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              {overallPct !== null ? `${overallPct}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Banner */}
        <div className="p-4 m-3 bg-gradient-to-br from-indigo-500/10 via-brand-500/5 to-purple-500/10 border border-brand-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Bunk Engine</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Calculates exact skippable classes & recovery schedules in real-time.
          </p>
        </div>
      </aside>
    </>
  );
};
