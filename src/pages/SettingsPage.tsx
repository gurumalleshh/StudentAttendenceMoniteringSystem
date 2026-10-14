import React, { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Semester, StudentProfile } from '../types';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  Archive,
  Database,
  Shield,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    students,
    semesters,
    settings,
    switchStudent,
    updateStudent,
    deleteStudent,
    switchSemester,
    addSemester,
    updateSemester,
    deleteSemester,
    toggleArchiveSemester,
    setTheme,
    resetDemoData,
    exportBackupJSON,
    importBackupJSON,
    addToast,
  } = useAppStore();

  const currentStudent =
    students.find((s) => s.id === settings.currentStudentId) || students[0];
  const currentSemester =
    semesters.find((s) => s.id === settings.currentSemesterId) || semesters[0];

  const studentSemesters = semesters.filter(
    (s) => s.studentId === currentStudent?.id
  );

  // Profile Edit Modal
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoll, setEditRoll] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');

  // Semester Modal
  const [isSemModalOpen, setIsSemModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [semName, setSemName] = useState('');
  const [semStartDate, setSemStartDate] = useState('');
  const [semEndDate, setSemEndDate] = useState('');
  const [semTargetPct, setSemTargetPct] = useState(75);
  const [semRedThreshold, setSemRedThreshold] = useState(65);
  const [semYellowThreshold, setSemYellowThreshold] = useState(75);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    '#6366f1',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#3b82f6',
  ];

  const openEditStudent = (st: StudentProfile) => {
    setEditingStudent(st);
    setEditName(st.name);
    setEditRoll(st.rollNo);
    setEditEmail(st.email || '');
    setEditColor(st.avatarColor);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    updateStudent({
      ...editingStudent,
      name: editName.trim(),
      rollNo: editRoll.trim(),
      email: editEmail.trim() || undefined,
      avatarColor: editColor,
    });
    setEditingStudent(null);
  };

  const openCreateSemester = () => {
    setEditingSemester(null);
    setSemName('Spring 2027');
    setSemStartDate('2027-01-11');
    setSemEndDate('2027-05-21');
    setSemTargetPct(75);
    setSemRedThreshold(65);
    setSemYellowThreshold(75);
    setIsSemModalOpen(true);
  };

  const openEditSemester = (sem: Semester) => {
    setEditingSemester(sem);
    setSemName(sem.name);
    setSemStartDate(sem.startDate);
    setSemEndDate(sem.endDate);
    setSemTargetPct(sem.targetAttendancePct);
    setSemRedThreshold(sem.alertThresholds.red);
    setSemYellowThreshold(sem.alertThresholds.yellow);
    setIsSemModalOpen(true);
  };

  const handleSaveSemester = (e: React.FormEvent) => {
    e.preventDefault();
    if (!semName.trim() || !semStartDate || !semEndDate) return;

    if (editingSemester) {
      updateSemester({
        ...editingSemester,
        name: semName.trim(),
        startDate: semStartDate,
        endDate: semEndDate,
        targetAttendancePct: Number(semTargetPct),
        alertThresholds: {
          red: Number(semRedThreshold),
          yellow: Number(semYellowThreshold),
        },
      });
    } else {
      addSemester({
        studentId: currentStudent?.id || 'student-1',
        name: semName.trim(),
        startDate: semStartDate,
        endDate: semEndDate,
        targetAttendancePct: Number(semTargetPct),
        alertThresholds: {
          red: Number(semRedThreshold),
          yellow: Number(semYellowThreshold),
        },
        isArchived: false,
      });
    }
    setIsSemModalOpen(false);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendtrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addToast({
      title: 'Backup Downloaded',
      message: 'Full JSON backup downloaded to your machine.',
      type: 'success',
    });
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          System Settings & Data Management
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Manage multiple student profiles, semesters, attendance threshold policies, and backups.
        </p>
      </div>

      {/* Student Profiles Section */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Student Profiles ({students.length})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student) => {
            const isCurrent = student.id === currentStudent?.id;
            return (
              <div
                key={student.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                    style={{ backgroundColor: student.avatarColor }}
                  >
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {student.name}
                      </h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.2 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {student.rollNo}
                    </p>
                    {student.email && (
                      <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!isCurrent && (
                    <button
                      onClick={() => switchStudent(student.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      Switch
                    </button>
                  )}
                  <button
                    onClick={() => openEditStudent(student)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
                    title="Edit profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {students.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete profile for ${student.name}?`)) {
                          deleteStudent(student.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Delete profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Semester Management Section */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Semesters for {currentStudent?.name}
            </h2>
          </div>

          <button
            onClick={openCreateSemester}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Semester</span>
          </button>
        </div>

        <div className="space-y-3">
          {studentSemesters.map((sem) => {
            const isCurrent = sem.id === currentSemester?.id;
            return (
              <div
                key={sem.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500'
                    : sem.isArchived
                    ? 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-70'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {sem.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold bg-brand-600 text-white px-2 py-0.2 rounded-full">
                        Active
                      </span>
                    )}
                    {sem.isArchived && (
                      <span className="text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.2 rounded">
                        Archived
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Duration: {sem.startDate} to {sem.endDate} • Target:{' '}
                    <strong>{sem.targetAttendancePct}%</strong> • Alert thresholds: Red &lt;
                    {sem.alertThresholds.red}%, Yellow &lt;{sem.alertThresholds.yellow}%
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!isCurrent && (
                    <button
                      onClick={() => switchSemester(sem.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                    >
                      Make Active
                    </button>
                  )}
                  <button
                    onClick={() => toggleArchiveSemester(sem.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
                    title={sem.isArchived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditSemester(sem)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
                    title="Edit semester"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {studentSemesters.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${sem.name}?`)) {
                          deleteSemester(sem.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Delete semester"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme & Display Section */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
          Display Theme
        </h2>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              settings.theme === 'light'
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-600 ring-2 ring-brand-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold">Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              settings.theme === 'dark'
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-600 ring-2 ring-brand-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Moon className="w-5 h-5 text-brand-400" />
            <span className="text-xs font-bold">Dark</span>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
              settings.theme === 'system'
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-600 ring-2 ring-brand-500'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <Laptop className="w-5 h-5 text-slate-400" />
            <span className="text-xs font-bold">System</span>
          </button>
        </div>
      </div>

      {/* Storage Architecture & Data Backup */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Data Storage & Backup Layer
            </h2>
          </div>
          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold rounded-full">
            LocalStorageAdapter (Active)
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Persistence uses the clean <code>StorageAdapter</code> architecture pattern. All state is
          persisted client-side and can be exported as a portable JSON backup or swapped to an
          Express/MongoDB/Firebase backend without modifying any UI components.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/25 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Backup</span>
          </button>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Restore From Backup File</span>
          </button>

          <button
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to reset demo data? This will overwrite existing records with the 5 demo subjects and ~8 weeks of realistic attendance.'
                )
              ) {
                resetDemoData();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Edit Student Profile Modal */}
      <Modal
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Profile"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Roll Number *
            </label>
            <input
              type="text"
              required
              value={editRoll}
              onChange={(e) => setEditRoll(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Avatar Color
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setEditColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    editColor === c
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
              onClick={() => setEditingStudent(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/25"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Semester Modal */}
      <Modal
        isOpen={isSemModalOpen}
        onClose={() => setIsSemModalOpen(false)}
        title={editingSemester ? 'Edit Semester' : 'Add New Semester'}
      >
        <form onSubmit={handleSaveSemester} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Semester Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fall Semester 2026"
              value={semName}
              onChange={(e) => setSemName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={semStartDate}
                onChange={(e) => setSemStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={semEndDate}
                onChange={(e) => setSemEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target % *
              </label>
              <input
                type="number"
                required
                min={50}
                max={100}
                value={semTargetPct}
                onChange={(e) => setSemTargetPct(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Red Alert %
              </label>
              <input
                type="number"
                required
                min={1}
                max={semTargetPct}
                value={semRedThreshold}
                onChange={(e) => setSemRedThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Yellow Alert %
              </label>
              <input
                type="number"
                required
                min={semRedThreshold}
                max={100}
                value={semYellowThreshold}
                onChange={(e) => setSemYellowThreshold(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsSemModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/25"
            >
              Save Semester
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
