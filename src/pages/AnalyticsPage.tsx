import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  overallWeightedPct,
  getSubjectStats,
} from '../lib/attendanceEngine';
import { RadialProgressRing } from '../components/common/RadialProgressRing';
import { exportAttendanceSummaryCSV, exportDetailedAttendanceLogsCSV } from '../lib/csv';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  Flame,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsPage: React.FC = () => {
  const { students, semesters, subjects, attendanceRecords, settings } = useAppStore();

  const currentStudent =
    students.find((s) => s.id === settings.currentStudentId) || students[0];
  const currentSemester =
    semesters.find((s) => s.id === settings.currentSemesterId) || semesters[0];

  const studentSubjects = subjects.filter((s) => s.semesterId === currentSemester?.id);
  const studentRecords = attendanceRecords.filter(
    (r) => r.studentId === currentStudent?.id
  );

  const targetPct = currentSemester?.targetAttendancePct || 75;
  const weightedOverall = overallWeightedPct(studentSubjects, studentRecords);

  // Compute stats for all subjects
  const subjectStatsList = studentSubjects.map((sub) => ({
    subject: sub,
    stats: getSubjectStats(sub, studentRecords, targetPct, currentSemester?.endDate),
  }));

  // Build Monthly Trend Data for Line Chart
  // Extract unique months from attendance records
  const monthMap = new Map<string, { present: number; absent: number }>();
  const sortedRecords = [...studentRecords].sort((a, b) => a.date.localeCompare(b.date));

  sortedRecords.forEach((r) => {
    if (r.status === 'NO_CLASS') return;
    const monthKey = r.date.slice(0, 7); // yyyy-mm
    const current = monthMap.get(monthKey) || { present: 0, absent: 0 };
    if (r.status === 'PRESENT') current.present++;
    else if (r.status === 'ABSENT') current.absent++;
    monthMap.set(monthKey, current);
  });

  const monthLabels = Array.from(monthMap.keys()).map((m) => {
    const [y, month] = m.split('-');
    const dateObj = new Date(Number(y), Number(month) - 1, 1);
    return dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
  });

  const monthlyPctData = Array.from(monthMap.values()).map((m) => {
    const total = m.present + m.absent;
    return total > 0 ? Math.round((m.present / total) * 1000) / 10 : 0;
  });

  const isDarkMode =
    typeof window !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  const textColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';

  // Line Chart Data
  const lineChartData = {
    labels: monthLabels.length > 0 ? monthLabels : ['Aug', 'Sep', 'Oct'],
    datasets: [
      {
        label: 'Monthly Attendance %',
        data: monthlyPctData.length > 0 ? monthlyPctData : [85, 78, 81],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
      {
        label: `Target (${targetPct}%)`,
        data: (monthLabels.length > 0 ? monthLabels : ['Aug', 'Sep', 'Oct']).map(
          () => targetPct
        ),
        borderColor: '#10b981',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  // Bar Chart Data (Present vs Absent Counts per subject)
  const barChartData = {
    labels: studentSubjects.map((s) => s.code),
    datasets: [
      {
        label: 'Present Classes',
        data: subjectStatsList.map((s) => s.stats.present),
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Absent Classes',
        data: subjectStatsList.map((s) => s.stats.absent),
        backgroundColor: '#f43f5e',
        borderRadius: 6,
      },
      {
        label: 'No Class (Cancelled)',
        data: subjectStatsList.map((s) => s.stats.noClass),
        backgroundColor: '#94a3b8',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { family: 'Inter', size: 11 },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Inter', size: 11 } },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Inter', size: 11 } },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { family: 'Inter', size: 11 },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Inter', size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Inter', size: 11 } },
      },
    },
  };

  // Heatmap generation: last 60 days outcome
  const heatmapDays: Array<{ date: string; status: 'ALL_PRESENT' | 'MIXED' | 'ABSENT_ONLY' | 'NO_CLASS' | 'EMPTY' }> = [];
  const today = new Date();
  for (let i = 41; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const recs = studentRecords.filter((r) => r.date === dateStr);

    let status: 'ALL_PRESENT' | 'MIXED' | 'ABSENT_ONLY' | 'NO_CLASS' | 'EMPTY' = 'EMPTY';
    if (recs.length > 0) {
      const p = recs.filter((r) => r.status === 'PRESENT').length;
      const a = recs.filter((r) => r.status === 'ABSENT').length;
      const n = recs.filter((r) => r.status === 'NO_CLASS').length;

      if (p > 0 && a === 0) status = 'ALL_PRESENT';
      else if (p > 0 && a > 0) status = 'MIXED';
      else if (a > 0 && p === 0) status = 'ABSENT_ONLY';
      else if (n > 0) status = 'NO_CLASS';
    }
    heatmapDays.push({ date: dateStr, status });
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Export Actions */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Attendance Intelligence & Analytics
            </h1>
            <span className="text-xs px-2.5 py-0.5 bg-brand-500/10 text-brand-700 dark:text-brand-300 rounded-full font-semibold">
              {currentSemester?.name}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Comprehensive statistical simulations, trend charts, streaks, and university export reports.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="no-print flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              exportAttendanceSummaryCSV(
                currentStudent,
                currentSemester,
                studentSubjects,
                studentRecords
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Summary CSV</span>
          </button>

          <button
            onClick={() =>
              exportDetailedAttendanceLogsCSV(
                currentStudent,
                currentSemester,
                studentSubjects,
                studentRecords
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Logs CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-sm shadow-brand-500/25 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL HEADER */}
      <div className="hidden print:block p-4 border-b-2 border-slate-900 mb-6">
        <h1 className="text-2xl font-black text-slate-900">STUDENT ATTENDANCE PERFORMANCE REPORT</h1>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-800">
          <p><strong>Student Name:</strong> {currentStudent?.name}</p>
          <p><strong>Registration Roll No:</strong> {currentStudent?.rollNo}</p>
          <p><strong>Semester:</strong> {currentSemester?.name}</p>
          <p><strong>Overall Weighted Attendance:</strong> {weightedOverall !== null ? `${weightedOverall}%` : 'N/A'}</p>
        </div>
      </div>

      {/* Radial Progress Rings Grid (Per-Subject) */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Per-Subject Attendance Radial Health Rings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Color coded: <span className="text-rose-500 font-bold">&lt;65% Red</span> •{' '}
              <span className="text-amber-500 font-bold">65-75% Yellow</span> •{' '}
              <span className="text-emerald-500 font-bold">≥75% Green</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center">
          {subjectStatsList.map(({ subject, stats }) => (
            <div
              key={subject.id}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors w-full"
            >
              <RadialProgressRing
                percentage={stats.pct}
                targetPercentage={targetPct}
                size={110}
                strokeWidth={10}
                thresholds={currentSemester?.alertThresholds}
              />
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-2">
                {subject.code}
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-white text-center truncate max-w-[120px]">
                {subject.name}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {stats.present} / {stats.totalHeld} held
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section: Line Trend & Bar Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Monthly Attendance Trend
              </h3>
              <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Trajectory against institutional {targetPct}% compliance line
            </p>
          </div>

          <div className="h-64 sm:h-72 mt-4">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Present vs Absent vs Cancelled
              </h3>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Per-subject breakdown of all registered classes
            </p>
          </div>

          <div className="h-64 sm:h-72 mt-4">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Monthly Heatmap Activity Grid */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Attendance Outcome Heatmap (Last 6 Weeks)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Color intensity by day outcome across all scheduled lectures
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> All Present
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 ml-2" /> Partial
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 ml-2" /> Absent
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-700 ml-2" /> Off
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-21 gap-2 pt-2">
          {heatmapDays.map((item) => {
            let bg = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-750';
            let title = `${item.date}: No classes`;

            if (item.status === 'ALL_PRESENT') {
              bg = 'bg-emerald-500 text-white shadow-xs';
              title = `${item.date}: 100% Present`;
            } else if (item.status === 'MIXED') {
              bg = 'bg-amber-500 text-white shadow-xs';
              title = `${item.date}: Mixed attendance`;
            } else if (item.status === 'ABSENT_ONLY') {
              bg = 'bg-rose-500 text-white shadow-xs';
              title = `${item.date}: Absent in scheduled classes`;
            } else if (item.status === 'NO_CLASS') {
              bg = 'bg-slate-400 text-white';
              title = `${item.date}: No class conducted`;
            }

            return (
              <div
                key={item.date}
                title={title}
                className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border transition-transform hover:scale-110 cursor-pointer ${bg}`}
              >
                {item.date.split('-')[2]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Projections & Streaks Audit Table */}
      <div className="glass-panel rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Smart Attendance Audit & Mathematical Projections
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Engine calculations for bunking leeway, required recovery attendance, and streaks
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-3">Credits</th>
                <th className="py-3 px-3">Held</th>
                <th className="py-3 px-3">Current %</th>
                <th className="py-3 px-3">Leeway (Can Bunk)</th>
                <th className="py-3 px-3">Must Attend Next</th>
                <th className="py-3 px-3">Streaks (Cur / Long)</th>
                <th className="py-3 px-3">Projected Final (Best/Worst)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {subjectStatsList.map(({ subject, stats }) => (
                <tr
                  key={subject.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {subject.code}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {subject.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-semibold">{subject.credits}</td>

                  <td className="py-3 px-3">
                    {stats.totalHeld} (P:{stats.present}, A:{stats.absent})
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`font-black text-sm ${
                        stats.pct === null
                          ? 'text-slate-400'
                          : stats.pct >= targetPct
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : stats.pct >= (currentSemester?.alertThresholds.red || 65)
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {stats.pct !== null ? `${stats.pct}%` : 'N/A'}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {stats.projection.canBunk > 0 ? (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {stats.projection.canBunk} classes
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    {stats.projection.mustAttend > 0 ? (
                      stats.projection.isMustAttendPossible ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {stats.projection.mustAttend} classes
                        </span>
                      ) : (
                        <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Not possible this sem</span>
                        </span>
                      )
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        On Track
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px]">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        P: {stats.streaks.currentPresentStreak} / {stats.streaks.longestPresentStreak}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px]">
                    {stats.projectedFinal.bestCasePct !== null ? (
                      <span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {stats.projectedFinal.bestCasePct}%
                        </strong>{' '}
                        /{' '}
                        <span className="text-rose-600 dark:text-rose-400">
                          {stats.projectedFinal.worstCasePct}%
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
