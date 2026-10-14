import {
  AttendanceRecord,
  Subject,
  StreakInfo,
  ProjectionResult,
  ProjectedFinalResult,
  SubjectAttendanceStats,
  OverallStats,
} from '../types';

/**
 * Filter attendance records for a specific subject, excluding NO_CLASS from denominator
 */
export const getSubjectRecords = (
  records: AttendanceRecord[],
  subjectId: string
): AttendanceRecord[] => {
  return records.filter((r) => r.subjectId === subjectId);
};

/**
 * Counts the occurrences of each attendance status for a subject
 */
export const getAttendanceCounts = (
  records: AttendanceRecord[],
  subjectId: string
): { present: number; absent: number; noClass: number; totalHeld: number } => {
  const subjectRecords = getSubjectRecords(records, subjectId);
  let present = 0;
  let absent = 0;
  let noClass = 0;

  for (const r of subjectRecords) {
    if (r.status === 'PRESENT') present++;
    else if (r.status === 'ABSENT') absent++;
    else if (r.status === 'NO_CLASS') noClass++;
  }

  return {
    present,
    absent,
    noClass,
    totalHeld: present + absent,
  };
};

/**
 * Calculates attendance percentage for a single subject.
 * Returns null if no classes have been held (present + absent = 0).
 * NO_CLASS records are excluded from the denominator.
 */
export const subjectAttendancePct = (
  records: AttendanceRecord[],
  subjectId: string
): number | null => {
  const { present, totalHeld } = getAttendanceCounts(records, subjectId);
  if (totalHeld === 0) {
    return null;
  }
  const rawPct = (present / totalHeld) * 100;
  return Math.round(rawPct * 10) / 10;
};

/**
 * Calculates overall credit-weighted attendance percentage across all subjects.
 * Formula: Σ(pct_i * credits_i) / Σ(credits_i) for subjects with at least 1 held class.
 * Returns null if no subjects have held classes or if total credits are 0.
 */
export const overallWeightedPct = (
  subjects: Subject[],
  records: AttendanceRecord[]
): number | null => {
  if (subjects.length === 0) return null;

  let totalWeightedScore = 0;
  let totalCreditsWithHeldClasses = 0;

  for (const subject of subjects) {
    const pct = subjectAttendancePct(records, subject.id);
    if (pct !== null && subject.credits > 0) {
      totalWeightedScore += pct * subject.credits;
      totalCreditsWithHeldClasses += subject.credits;
    }
  }

  if (totalCreditsWithHeldClasses === 0) {
    return null;
  }

  const result = totalWeightedScore / totalCreditsWithHeldClasses;
  return Math.round(result * 10) / 10;
};

/**
 * Calculates unweighted overall attendance percentage:
 * (Total Present Across All Subjects) / (Total Held Classes Across All Subjects) * 100
 */
export const overallUnweightedPct = (
  subjects: Subject[],
  records: AttendanceRecord[]
): number | null => {
  const subjectIds = new Set(subjects.map((s) => s.id));
  let totalPresent = 0;
  let totalHeld = 0;

  for (const r of records) {
    if (subjectIds.has(r.subjectId)) {
      if (r.status === 'PRESENT') {
        totalPresent++;
        totalHeld++;
      } else if (r.status === 'ABSENT') {
        totalHeld++;
      }
    }
  }

  if (totalHeld === 0) return null;
  return Math.round((totalPresent / totalHeld) * 1000) / 10;
};

/**
 * Calculates max consecutive future classes skippable while staying >= targetPct.
 * Formula:
 * P / (P + A + B) >= targetPct / 100
 * B <= (P * 100 / targetPct) - (P + A)
 */
export const projectionCanBunk = (
  records: AttendanceRecord[],
  subjectId: string,
  targetPct: number = 75
): number => {
  if (targetPct <= 0) return 999;
  const { present, totalHeld } = getAttendanceCounts(records, subjectId);

  if (totalHeld === 0) return 0;

  const currentPct = (present / totalHeld) * 100;
  if (currentPct < targetPct) {
    return 0;
  }

  // If targetPct is 100%, any bunk drops it below 100%
  if (targetPct >= 100) {
    return 0;
  }

  const maxAllowedHeld = Math.floor((present * 100) / targetPct);
  const canBunk = maxAllowedHeld - totalHeld;

  return Math.max(0, canBunk);
};

/**
 * Calculates min consecutive future attendances needed to reach targetPct.
 * Handles impossible scenarios safely (e.g. target 100% with absents, or required > remaining).
 */
export const projectionMustAttend = (
  records: AttendanceRecord[],
  subjectId: string,
  targetPct: number = 75,
  remainingClassesInSemester?: number
): { count: number; isPossible: boolean } => {
  const { present, absent, totalHeld } = getAttendanceCounts(records, subjectId);

  // If no classes held yet, 0 needed to "recover" (student hasn't missed any)
  if (totalHeld === 0) {
    return { count: 0, isPossible: true };
  }

  const currentPct = (present / totalHeld) * 100;
  if (currentPct >= targetPct) {
    return { count: 0, isPossible: true };
  }

  // If target is 100% and student was absent even once, 100% is mathematically impossible
  if (targetPct >= 100) {
    if (absent > 0) {
      return { count: Infinity, isPossible: false };
    }
    return { count: 0, isPossible: true };
  }

  // Formula: (targetPct * (P + A) - 100 * P) / (100 - targetPct)
  const numerator = targetPct * totalHeld - 100 * present;
  const denominator = 100 - targetPct;

  if (denominator <= 0) {
    return { count: Infinity, isPossible: false };
  }

  const rawMustAttend = Math.ceil(numerator / denominator);
  const count = Math.max(0, rawMustAttend);

  if (
    typeof remainingClassesInSemester === 'number' &&
    count > remainingClassesInSemester
  ) {
    return { count, isPossible: false };
  }

  return { count, isPossible: true };
};

/**
 * Computes present and absent streaks for a subject.
 * Sorts records chronologically and ignores NO_CLASS.
 */
export const streaks = (
  records: AttendanceRecord[],
  subjectId: string
): StreakInfo => {
  const subjectRecords = getSubjectRecords(records, subjectId)
    .filter((r) => r.status === 'PRESENT' || r.status === 'ABSENT')
    .sort((a, b) => a.date.localeCompare(b.date));

  if (subjectRecords.length === 0) {
    return {
      currentPresentStreak: 0,
      currentAbsentStreak: 0,
      longestPresentStreak: 0,
      longestAbsentStreak: 0,
    };
  }

  let longestPresentStreak = 0;
  let longestAbsentStreak = 0;
  let tempPresent = 0;
  let tempAbsent = 0;

  for (const rec of subjectRecords) {
    if (rec.status === 'PRESENT') {
      tempPresent++;
      tempAbsent = 0;
      if (tempPresent > longestPresentStreak) {
        longestPresentStreak = tempPresent;
      }
    } else {
      tempAbsent++;
      tempPresent = 0;
      if (tempAbsent > longestAbsentStreak) {
        longestAbsentStreak = tempAbsent;
      }
    }
  }

  // Calculate current streak from the tail
  let currentPresentStreak = 0;
  let currentAbsentStreak = 0;
  const lastRecord = subjectRecords[subjectRecords.length - 1];

  if (lastRecord.status === 'PRESENT') {
    for (let i = subjectRecords.length - 1; i >= 0; i--) {
      if (subjectRecords[i].status === 'PRESENT') {
        currentPresentStreak++;
      } else {
        break;
      }
    }
  } else if (lastRecord.status === 'ABSENT') {
    for (let i = subjectRecords.length - 1; i >= 0; i--) {
      if (subjectRecords[i].status === 'ABSENT') {
        currentAbsentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentPresentStreak,
    currentAbsentStreak,
    longestPresentStreak,
    longestAbsentStreak,
  };
};

/**
 * Computes remaining scheduled classes for a subject between fromDate and semesterEndDate.
 */
export const calculateRemainingClasses = (
  subject: Subject,
  semesterEndDate: string,
  fromDate?: string
): number => {
  if (!subject.daysOfWeek || subject.daysOfWeek.length === 0) return 0;
  if (!semesterEndDate) return 0;

  const start = fromDate ? new Date(fromDate) : new Date();
  const end = new Date(semesterEndDate);

  if (start > end) return 0;

  let count = 0;
  const current = new Date(start);
  // move to next day so we count upcoming future classes
  current.setDate(current.getDate() + 1);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sun .. 6 = Sat
    if (subject.daysOfWeek.includes(dayOfWeek)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Calculates projected final percentage assuming remaining classes are all attended or all missed.
 */
export const projectedFinalPct = (
  subject: Subject,
  records: AttendanceRecord[],
  semesterEndDate: string,
  fromDate?: string
): ProjectedFinalResult => {
  const { present, absent, totalHeld } = getAttendanceCounts(records, subject.id);
  const remaining = calculateRemainingClasses(subject, semesterEndDate, fromDate);

  const totalPossible = totalHeld + remaining;
  if (totalPossible === 0) {
    return {
      bestCasePct: null,
      worstCasePct: null,
      remainingClasses: 0,
    };
  }

  const bestCasePct = Math.round(((present + remaining) / totalPossible) * 1000) / 10;
  const worstCasePct = Math.round((present / totalPossible) * 1000) / 10;

  return {
    bestCasePct,
    worstCasePct,
    remainingClasses: remaining,
  };
};

/**
 * Generates comprehensive stats for a single subject
 */
export const getSubjectStats = (
  subject: Subject,
  records: AttendanceRecord[],
  targetPct: number = 75,
  semesterEndDate?: string
): SubjectAttendanceStats => {
  const counts = getAttendanceCounts(records, subject.id);
  const pct = subjectAttendancePct(records, subject.id);
  const streakInfo = streaks(records, subject.id);

  const remaining = semesterEndDate
    ? calculateRemainingClasses(subject, semesterEndDate)
    : undefined;

  const canBunk = projectionCanBunk(records, subject.id, targetPct);
  const mustAttendResult = projectionMustAttend(
    records,
    subject.id,
    targetPct,
    remaining
  );

  let status: 'CRITICAL' | 'WARNING' | 'SAFE' = 'SAFE';
  if (pct === null) {
    status = 'SAFE';
  } else if (pct < 65) {
    status = 'CRITICAL';
  } else if (pct < targetPct) {
    status = 'WARNING';
  }

  const projectedFinal = semesterEndDate
    ? projectedFinalPct(subject, records, semesterEndDate)
    : { bestCasePct: pct, worstCasePct: pct, remainingClasses: 0 };

  return {
    subjectId: subject.id,
    totalHeld: counts.totalHeld,
    present: counts.present,
    absent: counts.absent,
    noClass: counts.noClass,
    pct,
    streaks: streakInfo,
    projection: {
      canBunk,
      mustAttend: mustAttendResult.count,
      isMustAttendPossible: mustAttendResult.isPossible,
      status,
    },
    projectedFinal,
  };
};

/**
 * Aggregates overall attendance health across all active subjects
 */
export const getOverallStats = (
  subjects: Subject[],
  records: AttendanceRecord[],
  targetPct: number = 75
): OverallStats => {
  const weighted = overallWeightedPct(subjects, records);
  const unweighted = overallUnweightedPct(subjects, records);

  let totalCredits = 0;
  let totalHeldClasses = 0;
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalNoClass = 0;
  const subjectsBelowTarget: string[] = [];

  for (const sub of subjects) {
    totalCredits += sub.credits;
    const counts = getAttendanceCounts(records, sub.id);
    totalHeldClasses += counts.totalHeld;
    totalPresent += counts.present;
    totalAbsent += counts.absent;
    totalNoClass += counts.noClass;

    const pct = subjectAttendancePct(records, sub.id);
    if (pct !== null && pct < targetPct) {
      subjectsBelowTarget.push(sub.id);
    }
  }

  let status: 'CRITICAL' | 'WARNING' | 'SAFE' = 'SAFE';
  if (weighted !== null) {
    if (weighted < 65) {
      status = 'CRITICAL';
    } else if (weighted < targetPct) {
      status = 'WARNING';
    }
  }

  return {
    weightedPct: weighted,
    unweightedPct: unweighted,
    totalCredits,
    totalHeldClasses,
    totalPresent,
    totalAbsent,
    totalNoClass,
    subjectsBelowTarget,
    status,
  };
};
