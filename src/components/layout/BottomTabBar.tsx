import React from 'react';
import { useAppStore, NavTab } from '../../store/useAppStore';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Clock,
  Menu,
} from 'lucide-react';

interface BottomTabBarProps {
  onOpenSidebar: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ onOpenSidebar }) => {
  const { activeTab, setActiveTab } = useAppStore();

  const primaryTabs: Array<{ id: NavTab; label: string; icon: React.ElementType }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'Mark', icon: CalendarCheck },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'timetable', label: 'Timetable', icon: Clock },
  ];

  return (
    <nav
      className="bottom-nav fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 lg:hidden shadow-lg"
      aria-label="Mobile Navigation Bar"
    >
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isActive
                ? 'text-brand-600 dark:text-brand-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1">{tab.label}</span>
          </button>
        );
      })}

      {/* More / Menu Drawer button */}
      <button
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center flex-1 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
        aria-label="Open navigation drawer"
      >
        <Menu className="w-5 h-5 stroke-2" />
        <span className="text-[10px] mt-1">Menu</span>
      </button>
    </nav>
  );
};
