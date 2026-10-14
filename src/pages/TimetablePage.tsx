import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Clock, Printer, MapPin, User, BookOpen } from 'lucide-react';

export const TimetablePage: React.FC = () => {
  const { students, semesters, subjects, settings } = useAppStore();

  const currentStudent =
    students.find((s) => s.id === settings.currentStudentId) || students[0];
  const currentSemester =
    semesters.find((s) => s.id === settings.currentSemesterId) || semesters[0];

  const studentSubjects = subjects.filter((s) => s.semesterId === currentSemester?.id);

  const days = [
    { index: 1, name: 'Monday', short: 'Mon' },
    { index: 2, name: 'Tuesday', short: 'Tue' },
    { index: 3, name: 'Wednesday', short: 'Wed' },
    { index: 4, name: 'Thursday', short: 'Thu' },
    { index: 5, name: 'Friday', short: 'Fri' },
    { index: 6, name: 'Saturday', short: 'Sat' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Weekly Timetable
            </h1>
            <span className="text-xs px-2.5 py-0.5 bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-full font-semibold">
              {currentSemester?.name}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Auto-generated weekly schedule for {currentStudent?.name} ({currentStudent?.rollNo}).
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="no-print inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Timetable</span>
        </button>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {days.map((day) => {
          const daySubjects = studentSubjects
            .filter((s) => s.daysOfWeek.includes(day.index))
            .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

          return (
            <div
              key={day.name}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Day Column Header */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {day.name}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                  {daySubjects.length} classes
                </span>
              </div>

              {/* Class Cards */}
              <div className="p-3 space-y-3 flex-1 min-h-[160px]">
                {daySubjects.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-4 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-600 italic">
                      No lectures scheduled
                    </p>
                  </div>
                ) : (
                  daySubjects.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow transition-shadow relative overflow-hidden bg-slate-50/50 dark:bg-slate-850/50"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: sub.color }}
                      />

                      <div className="pl-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                            {sub.code}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/70 dark:bg-slate-750 text-slate-600 dark:text-slate-300 rounded font-semibold">
                            {sub.credits} Cr
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 leading-snug">
                          {sub.name}
                        </h4>

                        <div className="mt-2.5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {sub.timeSlot && (
                            <div className="flex items-center gap-1.5 font-medium text-brand-600 dark:text-brand-400">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{sub.timeSlot}</span>
                            </div>
                          )}
                          {sub.room && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{sub.room}</span>
                            </div>
                          )}
                          {sub.instructor && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{sub.instructor}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
