import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { ToastContainer } from './components/common/ToastContainer';
import { DashboardPage } from './pages/DashboardPage';
import { MarkAttendancePage } from './pages/MarkAttendancePage';
import { CalendarPage } from './pages/CalendarPage';
import { TimetablePage } from './pages/TimetablePage';
import { SubjectsPage } from './pages/SubjectsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GraduationCap } from 'lucide-react';

export function App() {
  const { isInitialized, initStore, activeTab } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    initStore();
  }, [initStore]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 animate-bounce">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-base font-bold text-white tracking-tight">
          AttendTrack
        </h2>
        <p className="mt-1 text-xs text-slate-400 animate-pulse">
          Loading student intelligence data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 transition-all">
        {/* Top Header Bar */}
        <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} />

        {/* Page View Container */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12 focus:outline-none"
        >
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'attendance' && <MarkAttendancePage />}
          {activeTab === 'calendar' && <CalendarPage />}
          {activeTab === 'timetable' && <TimetablePage />}
          {activeTab === 'subjects' && <SubjectsPage />}
          {activeTab === 'analytics' && <AnalyticsPage />}
          {activeTab === 'assignments' && <AssignmentsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar onOpenSidebar={() => setIsSidebarOpen(true)} />
    </div>
  );
}

export default App;
