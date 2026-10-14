import React from 'react';
import { AttendanceStatus } from '../../types';
import { CheckCircle2, XCircle, Slash } from 'lucide-react';

interface StatusBadgeProps {
  status: AttendanceStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  let config = {
    label: 'Present',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  };

  if (status === 'ABSENT') {
    config = {
      label: 'Absent',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
      icon: XCircle,
      iconColor: 'text-rose-500',
    };
  } else if (status === 'NO_CLASS') {
    config = {
      label: 'No Class',
      bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
      icon: Slash,
      iconColor: 'text-slate-400',
    };
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium transition-colors ${config.bg} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} />}
      {config.label}
    </span>
  );
};
