import React from 'react';

interface RadialProgressRingProps {
  percentage: number | null;
  targetPercentage?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  thresholds?: { red: number; yellow: number };
  showTargetMarker?: boolean;
  className?: string;
}

export const RadialProgressRing: React.FC<RadialProgressRingProps> = ({
  percentage,
  targetPercentage = 75,
  size = 140,
  strokeWidth = 12,
  label,
  sublabel,
  thresholds = { red: 65, yellow: 75 },
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Safe percentage clamp
  const validPct = percentage !== null ? Math.min(Math.max(percentage, 0), 100) : 0;
  const strokeDashoffset = circumference - (validPct / 100) * circumference;

  // Determine threshold color
  let strokeColor = '#10b981'; // green / safe
  let textColor = 'text-emerald-600 dark:text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';

  if (percentage === null) {
    strokeColor = '#94a3b8'; // slate
    textColor = 'text-slate-500 dark:text-slate-400';
    badgeBg = 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  } else if (percentage < thresholds.red) {
    strokeColor = '#ef4444'; // red
    textColor = 'text-rose-600 dark:text-rose-400';
    badgeBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
  } else if (percentage < thresholds.yellow) {
    strokeColor = '#f59e0b'; // yellow/amber
    textColor = 'text-amber-600 dark:text-amber-400';
    badgeBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90 transition-all duration-700 ease-out"
          width={size}
          height={size}
        >
          {/* Background track */}
          <circle
            className="text-slate-200 dark:text-slate-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Active Progress */}
          {percentage !== null && (
            <circle
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
              className="transition-all duration-1000 ease-out"
            />
          )}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          {percentage !== null ? (
            <>
              <span className={`text-2xl font-bold tracking-tight ${textColor}`}>
                {percentage}%
              </span>
              {sublabel && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                  {sublabel}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-slate-400 dark:text-slate-500">
                N/A
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                No classes
              </span>
            </>
          )}
        </div>
      </div>

      {label && (
        <div className="mt-2 text-center">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded-full border ${badgeBg}`}
          >
            Target: {targetPercentage}%
          </span>
        </div>
      )}
    </div>
  );
};
