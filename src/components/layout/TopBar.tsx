import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Menu,
  Sun,
  Moon,
  Laptop,
  Calendar,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface TopBarProps {
  onOpenSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSidebar }) => {
  const {
    selectedDate,
    setSelectedDate,
    students,
    settings,
    switchStudent,
    addStudent,
    setTheme,
    resetDemoData,
    addToast,
  } = useAppStore();

  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // New Student Form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentColor, setNewStudentColor] = useState('#6366f1');

  const currentStudent =
    students.find((s) => s.id === settings.currentStudentId) || students[0];

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentRoll.trim()) {
      addToast({
        title: 'Missing Fields',
        message: 'Name and Roll Number are required.',
        type: 'warning',
      });
      return;
    }

    addStudent({
      name: newStudentName.trim(),
      rollNo: newStudentRoll.trim(),
      email: newStudentEmail.trim() || undefined,
      avatarColor: newStudentColor,
    });

    setNewStudentName('');
    setNewStudentRoll('');
    setNewStudentEmail('');
    setIsAddStudentModalOpen(false);
  };

  const colors = [
    '#6366f1',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#8b5cf6',
    '#3b82f6',
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Selected Date:
            </span>
          </div>

          {/* Quick Date Picker */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Select active date"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs px-2.5 py-1.5 font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors border border-transparent hover:border-brand-200 dark:hover:border-brand-800"
            >
              Today
            </button>
          </div>
        </div>

        {/* Right Actions: Student Switcher, Theme, Reset Demo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Reset Demo Data button */}
          <button
            onClick={resetDemoData}
            title="Reset demo data to initial state"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700/60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          {/* Student Profile Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsStudentMenuOpen(!isStudentMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl text-xs sm:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-haspopup="true"
              aria-expanded={isStudentMenuOpen}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: currentStudent?.avatarColor || '#6366f1' }}
              >
                {currentStudent?.name.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] sm:max-w-[130px] truncate font-semibold text-slate-800 dark:text-slate-200">
                {currentStudent?.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isStudentMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-slide-up"
                onClick={() => setIsStudentMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Student Profile
                  </p>
                </div>
                {students.map((student) => {
                  const isSelected = student.id === currentStudent?.id;
                  return (
                    <button
                      key={student.id}
                      onClick={() => switchStudent(student.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: student.avatarColor }}
                        >
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{student.rollNo}</p>
                        </div>
                      </div>
                      {isSelected && <UserCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                    </button>
                  );
                })}

                <div className="p-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                  <button
                    onClick={() => {
                      setIsStudentMenuOpen(false);
                      setIsAddStudentModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Student</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Toggle display theme"
              aria-haspopup="true"
              aria-expanded={isThemeMenuOpen}
            >
              {settings.theme === 'dark' ? (
                <Moon className="w-4 h-4 text-brand-400" />
              ) : settings.theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Laptop className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isThemeMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-slide-up"
                onClick={() => setIsThemeMenuOpen(false)}
              >
                <button
                  onClick={() => setTheme('light')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium ${
                    settings.theme === 'light'
                      ? 'text-brand-600 dark:text-brand-400 font-bold bg-brand-50/50 dark:bg-brand-950/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium ${
                    settings.theme === 'dark'
                      ? 'text-brand-600 dark:text-brand-400 font-bold bg-brand-50/50 dark:bg-brand-950/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-brand-400" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium ${
                    settings.theme === 'system'
                      ? 'text-brand-600 dark:text-brand-400 font-bold bg-brand-50/50 dark:bg-brand-950/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  <span>System</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Add Student Profile Modal */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        title="Add Student Profile"
        description="Create a separate academic profile with isolated subjects and attendance records."
      >
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Maya Lin"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Roll / Registration Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS24B1001"
              value={newStudentRoll}
              onChange={(e) => setNewStudentRoll(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. maya@university.edu"
              value={newStudentEmail}
              onChange={(e) => setNewStudentEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Profile Avatar Color
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewStudentColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    newStudentColor === c
                      ? 'scale-110 border-white dark:border-slate-900 shadow-md ring-2 ring-brand-500'
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
              onClick={() => setIsAddStudentModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-md shadow-brand-500/25 transition-colors"
            >
              Create Profile
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
