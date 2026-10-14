# AttendTrack — Advanced Student Attendance Management System

A production-grade, interactive, and mobile-first student attendance tracking and projection engine built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Zustand**. Designed for college students and faculty to track attendance compliance, simulate skippable classes, calculate recovery targets, and manage timetables and assignments.

---

## 🌟 Key Features

### 1. Advanced Attendance Engine (`src/lib/attendanceEngine.ts`)
- **Pure Functions & Complete Division-by-Zero Guards**: 100% test-covered calculation functions.
- **Credit-Weighted Overall Attendance**: Formula $\frac{\sum (\text{pct}_i \times \text{credits}_i)}{\sum \text{credits}_i}$ across active subjects.
- **Exclusion of `NO_CLASS`**: Classes marked as cancelled or no-class are excluded from denominators but preserved in logs.
- **Smart Bunk Simulator (`projectionCanBunk`)**: Calculates the maximum consecutive upcoming classes you can skip while remaining above your semester target percentage.
- **Recovery Advisor (`projectionMustAttend`)**: Calculates the minimum consecutive classes needed to return above the threshold (with graceful handling for impossible scenarios such as $100\%$ target after absences).
- **Streak Tracker (`streaks`)**: Tracks current and longest consecutive present and absent streaks.
- **Final Semester Projections (`projectedFinalPct`)**: Best-case and worst-case projections based on remaining timetable days until the semester end date.

### 2. Manual & Bulk Attendance Marking
- **Day-by-Day Scheduler**: Automatically filters to only subjects scheduled on the selected day of the week.
- **Keyboard Shortcuts**:
  - `P` / `p`: Mark currently focused subject **Present**
  - `A` / `a`: Mark currently focused subject **Absent**
  - `N` / `n`: Mark currently focused subject **No Class**
  - `↑` / `↓`: Navigate and switch subject focus
- **Bulk Action**: Single-click "Mark All Present for Today".
- **Date Safety Guards**: Informative warnings when logging dates before the semester start date or scheduling future cancellations.
- **Extra Classes**: Toggle "Show Unscheduled Subjects" to record makeup or bonus classes held on off-days.

### 3. Interactive Analytics & Visualizations
- **Radial Progress Rings**: Per-subject SVG rings colored by university alert thresholds:
  - 🔴 **Critical (<65%)**: Immediate alert and recovery calculation.
  - 🟡 **Warning (65%–75%)**: Buffer warning.
  - 🟢 **Safe (≥75%)**: Safe zone indicator.
- **Chart.js Monthly Trend Line Chart**: Tracks attendance percentage trajectory month-by-month against the target benchmark.
- **Chart.js Comparison Bar Chart**: Breakdown of Present vs Absent vs Cancelled lectures.
- **Outcome Heatmap**: GitHub-style 6-week daily intensity grid.
- **Exports**:
  - Download summary CSV report.
  - Download detailed date-by-date attendance logs CSV.
  - Clean printable / PDF report view (`window.print()`).

### 4. Curriculum & Timetable
- **Subject Management**: Full CRUD with code uniqueness check, credit weights (1–10), color picker, and multi-select day chips.
- **Auto-Generated Weekly Timetable**: Clean Monday–Sunday grid populated by subject time slots, lecture halls, and instructor details.

### 5. Multi-Student Profiles & Semesters
- **Student Profile Switcher**: Switch between students with isolated subject catalogs, semesters, and records.
- **Semester Manager**: Manage start/end dates, target thresholds (default 75%), red/yellow alert cutoffs, and archival.
- **Assignment & Exam Countdown Tracker**: Priority tags (high/medium/low), completion checkboxes, and live countdown badges.
- **Portable JSON Backup**: Full database backup export and JSON file restore.
- **PWA Ready**: Offline caching with service worker (`vite-plugin-pwa`).

---

## 🏗️ Storage Adapter Architecture (Pluggable Persistence)

Persistence is decoupled from the UI using the **`StorageAdapter`** interface pattern located in `src/adapters/storage/`:

```ts
export interface StorageAdapter {
  getItem<T>(key: string, defaultValue: T): Promise<T>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  exportAll(): Promise<string>;
  importAll(jsonData: string): Promise<boolean>;
  clear(): Promise<void>;
}
```

### Swapping `localStorage` for a Backend (Express / MongoDB / Firebase)

To transition from the default `LocalStorageAdapter` to an API or database backend:

1. Create a new adapter class implementing `StorageAdapter`:
   ```ts
   // src/adapters/storage/RestApiAdapter.ts
   import { StorageAdapter } from './StorageAdapter';

   export class RestApiAdapter implements StorageAdapter {
     constructor(private baseUrl: string) {}

     async getItem<T>(key: string, defaultValue: T): Promise<T> {
       const res = await fetch(`${this.baseUrl}/storage/${key}`);
       if (!res.ok) return defaultValue;
       return res.json();
     }

     async setItem<T>(key: string, value: T): Promise<void> {
       await fetch(`${this.baseUrl}/storage/${key}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(value),
       });
     }
     // ...implement removeItem, exportAll, importAll, clear
   }
   ```

2. Register the adapter in `src/adapters/storage/index.ts`:
   ```ts
   import { RestApiAdapter } from './RestApiAdapter';
   import { setStorageAdapter } from './index';

   setStorageAdapter(new RestApiAdapter(import.meta.env.VITE_API_BASE_URL));
   ```
   **Zero UI or Zustand store modifications are required!**

---

## 📁 Project Structure

```
studentattendencemanagmentsystem/
├── public/
│   └── favicon.svg               # SVG application icon
├── src/
│   ├── adapters/
│   │   └── storage/
│   │       ├── StorageAdapter.ts       # Storage interface
│   │       ├── LocalStorageAdapter.ts  # LocalStorage implementation
│   │       └── index.ts                # Adapter factory/singleton
│   ├── components/
│   │   ├── common/
│   │   │   ├── Modal.tsx               # Accessible dialog container
│   │   │   ├── RadialProgressRing.tsx  # SVG circular progress with thresholds
│   │   │   ├── StatusBadge.tsx         # Pill badge for Present/Absent/NoClass
│   │   │   └── ToastContainer.tsx      # Floating reactive notifications
│   │   └── layout/
│   │       ├── BottomTabBar.tsx        # Mobile navigation bar
│   │       ├── Sidebar.tsx             # Desktop navigation drawer
│   │       └── TopBar.tsx              # Student switcher & date selector
│   ├── lib/
│   │   ├── attendanceEngine.ts         # Pure attendance & bunk calculation functions
│   │   ├── attendanceEngine.test.ts    # Complete Vitest test suite
│   │   ├── csv.ts                      # CSV export utilities
│   │   └── demoData.ts                 # Realistic initial seed data (~8 weeks)
│   ├── pages/
│   │   ├── AnalyticsPage.tsx           # Charts, heatmap, projections table
│   │   ├── AssignmentsPage.tsx         # Deliverables & exam countdowns
│   │   ├── CalendarPage.tsx            # Interactive retroactive calendar grid
│   │   ├── DashboardPage.tsx           # Today's classes, alerts, smart bunk advisor
│   │   ├── MarkAttendancePage.tsx      # Manual marking, keyboard shortcuts
│   │   ├── SettingsPage.tsx            # Multi-student, semester, theme, JSON backup
│   │   ├── SubjectsPage.tsx            # Subject CRUD with duplicate code check
│   │   └── TimetablePage.tsx           # Auto-generated weekly schedule
│   ├── store/
│   │   └── useAppStore.ts              # Zustand store with persistence
│   ├── types/
│   │   └── index.ts                    # TypeScript domain definitions
│   ├── App.tsx                         # Root layout and view router
│   ├── index.css                       # Tailwind design tokens and print styles
│   └── main.tsx                        # React 18 bootstrap
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Unit Tests
```bash
npm test
```
Executes all unit tests with **Vitest**.

### Production Build
```bash
npm run build
```
Generates an optimized, type-checked production bundle in `dist/`.

---

## 🧪 Testing Coverage
Run `npm test` to verify the mathematical calculation logic:
- `subjectAttendancePct`: Standard calculations, zero-denominator safeguards, and strict `NO_CLASS` exclusion.
- `overallWeightedPct`: Multi-subject credit weighting ($\sum (\text{pct}_i \times \text{credits}_i) / \sum \text{credits}_i$) and exclusion of subjects with zero held classes.
- `projectionCanBunk`: Maximum skippable classes staying $\ge$ target.
- `projectionMustAttend`: Recovery attendances needed, boundary conditions, and impossible target detection ($100\%$ target after absences).
- `streaks`: Chronological present/absent streaks ignoring cancellations.
- `projectedFinalPct`: Best-case and worst-case final semester projections.
