import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Assignment, ExamCountdown } from '../types';
import { Modal } from '../components/common/Modal';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  CalendarDays,
} from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const {
    students,
    semesters,
    subjects,
    assignments,
    exams,
    settings,
    addAssignment,
    toggleAssignment,
    deleteAssignment,
    addExam,
    deleteExam,
  } = useAppStore();

  const currentStudent =
    students.find((s) => s.id === settings.currentStudentId) || students[0];
  const currentSemester =
    semesters.find((s) => s.id === settings.currentSemesterId) || semesters[0];

  const studentSubjects = subjects.filter((s) => s.semesterId === currentSemester?.id);
  const studentAssignments = assignments.filter((a) => a.studentId === currentStudent?.id);
  const studentExams = exams.filter((e) => e.studentId === currentStudent?.id);

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Add Assignment Modal State
  const [isAsgModalOpen, setIsAsgModalOpen] = useState(false);
  const [asgTitle, setAsgTitle] = useState('');
  const [asgSubjectId, setAsgSubjectId] = useState(studentSubjects[0]?.id || '');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgPriority, setAsgPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [asgDesc, setAsgDesc] = useState('');

  // Add Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examSubjectId, setExamSubjectId] = useState(studentSubjects[0]?.id || '');
  const [examDate, setExamDate] = useState('');
  const [examRoom, setExamRoom] = useState('');

  const todayIso = new Date().toISOString().split('T')[0];

  const filteredAssignments = studentAssignments.filter((a) => {
    if (activeFilter === 'pending') return !a.completed;
    if (activeFilter === 'completed') return a.completed;
    return true;
  });

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim() || !asgDueDate) return;

    addAssignment({
      studentId: currentStudent?.id || 'student-1',
      subjectId: asgSubjectId || studentSubjects[0]?.id || '',
      title: asgTitle.trim(),
      dueDate: asgDueDate,
      completed: false,
      priority: asgPriority,
      description: asgDesc.trim() || undefined,
    });

    setAsgTitle('');
    setAsgDesc('');
    setIsAsgModalOpen(false);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) return;

    addExam({
      studentId: currentStudent?.id || 'student-1',
      subjectId: examSubjectId || studentSubjects[0]?.id || '',
      title: examTitle.trim(),
      examDate,
      room: examRoom.trim() || undefined,
    });

    setExamTitle('');
    setExamRoom('');
    setIsExamModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Assignments & Exam Schedule
            </h1>
            <span className="text-xs px-2.5 py-0.5 bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-full font-semibold">
              {currentSemester?.name}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Track project deliverables, homework deadlines, and countdown to midterms & finals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (studentSubjects.length > 0) setAsgSubjectId(studentSubjects[0].id);
              setIsAsgModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assignment</span>
          </button>
          <button
            onClick={() => {
              if (studentSubjects.length > 0) setExamSubjectId(studentSubjects[0].id);
              setIsExamModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Add Exam</span>
          </button>
        </div>
      </div>

      {/* Exam Countdown Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Upcoming Exams Countdown</span>
          </h2>
          <span className="text-xs text-slate-500">{studentExams.length} Scheduled</span>
        </div>

        {studentExams.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">No exams registered for this semester yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentExams.map((exam) => {
              const sub = subjects.find((s) => s.id === exam.subjectId);
              const examDateObj = new Date(exam.examDate);
              const diffTime = examDateObj.getTime() - new Date().getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isPast = diffDays < 0;

              return (
                <div
                  key={exam.id}
                  className="p-5 rounded-2xl border bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-850 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: sub?.color || '#6366f1' }}
                  />

                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        {sub?.code}
                      </span>
                      <button
                        onClick={() => deleteExam(exam.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete exam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {exam.title}
                    </h3>

                    <div className="mt-2.5 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Date: {exam.examDate}</span>
                      </div>
                      {exam.room && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>Venue: {exam.room}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Countdown</span>
                    <span
                      className={`text-base font-black ${
                        isPast
                          ? 'text-slate-400'
                          : diffDays <= 3
                          ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                          : 'text-brand-600 dark:text-brand-400'
                      }`}
                    >
                      {isPast ? 'Concluded' : diffDays === 0 ? 'Today!' : `${diffDays} days left`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Deliverables Tracker Section */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Assignments & Deliverables
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {(['all', 'pending', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeFilter === filter
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-500">No assignments match the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map((asg) => {
              const sub = subjects.find((s) => s.id === asg.subjectId);
              const isOverdue = !asg.completed && asg.dueDate < todayIso;

              return (
                <div
                  key={asg.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    asg.completed
                      ? 'bg-slate-50/70 dark:bg-slate-850/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : isOverdue
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => toggleAssignment(asg.id)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
                        asg.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'
                      }`}
                      aria-label="Toggle completed"
                    >
                      {asg.completed && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {sub?.code || 'GEN'}
                        </span>
                        <h4
                          className={`text-sm font-bold text-slate-900 dark:text-white ${
                            asg.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {asg.title}
                        </h4>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.2 rounded uppercase ${
                            asg.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : asg.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {asg.priority}
                        </span>
                      </div>

                      {asg.description && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {asg.description}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Due: {asg.dueDate}</span>
                        </span>
                        {isOverdue && (
                          <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAssignment(asg.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                    title="Delete assignment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      <Modal
        isOpen={isAsgModalOpen}
        onClose={() => setIsAsgModalOpen(false)}
        title="Add Assignment Deliverable"
        description="Track upcoming lab submissions, project milestones, and homework."
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course Subject *
            </label>
            <select
              value={asgSubjectId}
              onChange={(e) => setAsgSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {studentSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Red-Black Tree Implementation"
              value={asgTitle}
              onChange={(e) => setAsgTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={asgDueDate}
                onChange={(e) => setAsgDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Priority
              </label>
              <select
                value={asgPriority}
                onChange={(e) => setAsgPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Include benchmark plots and time complexity proof..."
              value={asgDesc}
              onChange={(e) => setAsgDesc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAsgModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/25"
            >
              Track Deliverable
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Exam Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title="Schedule Exam"
        description="Add midterms, practical coding assessments, or final exams."
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Course Subject *
            </label>
            <select
              value={examSubjectId}
              onChange={(e) => setExamSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {studentSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operating Systems Midterm Exam"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exam Date *
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exam Hall / Room
              </label>
              <input
                type="text"
                placeholder="e.g. Auditorium West"
                value={examRoom}
                onChange={(e) => setExamRoom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/25"
            >
              Save Exam
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
