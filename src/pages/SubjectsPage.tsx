import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Subject } from '../types';
import { getSubjectStats } from '../lib/attendanceEngine';
import { Modal } from '../components/common/Modal';
import {
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  User,
  AlertCircle,
} from 'lucide-react';

export const SubjectsPage: React.FC = () => {
  const {
    students,
    semesters,
    subjects,
    attendanceRecords,
    settings,
    addSubject,
    updateSubject,
    deleteSubject,
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState(4);
  const [color, setColor] = useState('#6366f1');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [timeSlot, setTimeSlot] = useState('');
  const [room, setRoom] = useState('');
  const [instructor, setInstructor] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const daysList = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' },
  ];

  const curatedColors = [
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#f43f5e', // Rose
    '#14b8a6', // Teal
  ];

  const openCreateModal = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setCredits(4);
    setColor('#6366f1');
    setDaysOfWeek([1, 3, 5]);
    setTimeSlot('09:00 - 10:00 AM');
    setRoom('Hall A-101');
    setInstructor('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setCredits(sub.credits);
    setColor(sub.color);
    setDaysOfWeek([...sub.daysOfWeek]);
    setTimeSlot(sub.timeSlot || '');
    setRoom(sub.room || '');
    setInstructor(sub.instructor || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation 1: Required Name and Code
    if (!name.trim()) {
      setFormError('Subject name is required.');
      return;
    }
    if (!code.trim()) {
      setFormError('Subject code is required.');
      return;
    }

    // Validation 2: Duplicate Code Check (case-insensitive across active semester)
    const normalizedCode = code.trim().toUpperCase();
    const isDuplicate = studentSubjects.some(
      (s) =>
        s.id !== editingSubject?.id &&
        s.code.trim().toUpperCase() === normalizedCode
    );

    if (isDuplicate) {
      setFormError(`Subject code "${normalizedCode}" already exists in this semester.`);
      return;
    }

    // Validation 3: At least one day required
    if (daysOfWeek.length === 0) {
      setFormError('Please select at least one day of the week for classes.');
      return;
    }

    // Validation 4: Credits > 0
    if (credits <= 0) {
      setFormError('Credits must be at least 1.');
      return;
    }

    if (editingSubject) {
      updateSubject({
        ...editingSubject,
        name: name.trim(),
        code: normalizedCode,
        credits: Number(credits),
        color,
        daysOfWeek,
        timeSlot: timeSlot.trim() || undefined,
        room: room.trim() || undefined,
        instructor: instructor.trim() || undefined,
      });
    } else {
      addSubject({
        name: name.trim(),
        code: normalizedCode,
        credits: Number(credits),
        color,
        daysOfWeek,
        semesterId: currentSemester?.id || 'sem-fall-2026',
        timeSlot: timeSlot.trim() || undefined,
        room: room.trim() || undefined,
        instructor: instructor.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (subject: Subject) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${subject.code} (${subject.name})? This will also remove its associated attendance records.`
      )
    ) {
      deleteSubject(subject.id);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Card */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Subject Management
            </h1>
            <span className="text-xs px-2.5 py-0.5 bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-full font-semibold">
              {studentSubjects.length} Active Courses
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Configure curriculum, credit weights, weekly days, lecture halls, and faculty details.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {studentSubjects.map((sub) => {
          const stats = getSubjectStats(
            sub,
            studentRecords,
            currentSemester?.targetAttendancePct || 75,
            currentSemester?.endDate
          );

          return (
            <div
              key={sub.id}
              className="glass-panel p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: sub.color }}
              />

              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {sub.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                      {sub.name}
                    </h3>
                  </div>

                  <span
                    className={`text-sm font-black px-2.5 py-1 rounded-xl ${
                      stats.pct === null
                        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        : stats.pct >= (currentSemester?.targetAttendancePct || 75)
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : stats.pct >= (currentSemester?.alertThresholds.red || 65)
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {stats.pct !== null ? `${stats.pct}%` : 'N/A'}
                  </span>
                </div>

                {/* Days of Week Chips */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {daysList.map((d) => {
                    const isDaySelected = sub.daysOfWeek.includes(d.value);
                    return (
                      <span
                        key={d.label}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isDaySelected
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                        }`}
                      >
                        {d.label}
                      </span>
                    );
                  })}
                </div>

                {/* Info Metadata */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Course Credits:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {sub.credits} Credits
                    </strong>
                  </div>
                  {sub.timeSlot && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Slot:</span>
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {sub.timeSlot}
                      </strong>
                    </div>
                  )}
                  {sub.room && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Location:</span>
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">{sub.room}</strong>
                    </div>
                  )}
                  {sub.instructor && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Faculty:</span>
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {sub.instructor}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Attendance Summary Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Held: <strong>{stats.totalHeld}</strong> (P: {stats.present}, A: {stats.absent}
                    )
                  </span>
                  <span className="text-slate-500">
                    No Class: <strong>{stats.noClass}</strong>
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(sub)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(sub)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? `Edit ${editingSubject.code}` : 'Add New Subject'}
        description="Configure academic subject details, schedule days, credit weights, and visual tags."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS301"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Credits (Weight) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures & Algorithms"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Days of Week Multi-Select Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Scheduled Days of Week * (At least 1 required)
            </label>
            <div className="flex flex-wrap gap-2">
              {daysList.map((d) => {
                const isSelected = daysOfWeek.includes(d.value);
                return (
                  <button
                    type="button"
                    key={d.label}
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time Slot
              </label>
              <input
                type="text"
                placeholder="e.g. 09:00 - 10:00 AM"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Classroom / Lab
              </label>
              <input
                type="text"
                placeholder="e.g. Hall A-101"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Faculty / Instructor Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Aris Thorne"
              value={instructor}
              onChange={(e) => setInstructor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Color Tag Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject Color Accent
            </label>
            <div className="flex items-center gap-2">
              {curatedColors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c
                      ? 'scale-110 border-white dark:border-slate-900 ring-2 ring-brand-500 shadow-sm'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/25"
            >
              {editingSubject ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
