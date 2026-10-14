import { describe, it, expect } from 'vitest';
import {
  subjectAttendancePct,
  overallWeightedPct,
  projectionCanBunk,
  projectionMustAttend,
  streaks,
  projectedFinalPct,
  getAttendanceCounts,
} from './attendanceEngine';
import { AttendanceRecord, Subject } from '../types';

describe('attendanceEngine', () => {
  const dummySubject: Subject = {
    id: 'sub-1',
    name: 'Data Structures',
    code: 'CS201',
    credits: 4,
    color: '#6366f1',
    daysOfWeek: [1, 3, 5],
    semesterId: 'sem-1',
  };

  const createRecord = (
    date: string,
    status: 'PRESENT' | 'ABSENT' | 'NO_CLASS',
    subjectId: string = 'sub-1'
  ): AttendanceRecord => ({
    id: `rec-${date}-${subjectId}`,
    subjectId,
    studentId: 'student-1',
    date,
    status,
  });

  describe('subjectAttendancePct & NO_CLASS exclusion', () => {
    it('calculates correct percentage for standard records', () => {
      const records: AttendanceRecord[] = [
        createRecord('2026-09-01', 'PRESENT'),
        createRecord('2026-09-02', 'PRESENT'),
        createRecord('2026-09-03', 'PRESENT'),
        createRecord('2026-09-04', 'ABSENT'),
      ];
      // 3 present / 4 held = 75.0%
      expect(subjectAttendancePct(records, 'sub-1')).toBe(75);
    });

    it('strictly excludes NO_CLASS from the denominator', () => {
      const records: AttendanceRecord[] = [
        createRecord('2026-09-01', 'PRESENT'),
        createRecord('2026-09-02', 'PRESENT'),
        createRecord('2026-09-03', 'PRESENT'),
        createRecord('2026-09-04', 'ABSENT'),
        createRecord('2026-09-05', 'NO_CLASS'),
        createRecord('2026-09-06', 'NO_CLASS'),
      ];
      // Denominator should still be 4 (3 present + 1 absent), not 6
      expect(subjectAttendancePct(records, 'sub-1')).toBe(75);
      const counts = getAttendanceCounts(records, 'sub-1');
      expect(counts.noClass).toBe(2);
      expect(counts.totalHeld).toBe(4);
    });

    it('returns null when no classes were held (division by zero guard)', () => {
      expect(subjectAttendancePct([], 'sub-1')).toBeNull();

      const onlyNoClass = [
        createRecord('2026-09-01', 'NO_CLASS'),
        createRecord('2026-09-02', 'NO_CLASS'),
      ];
      expect(subjectAttendancePct(onlyNoClass, 'sub-1')).toBeNull();
    });
  });

  describe('overallWeightedPct', () => {
    it('correctly weights subject attendance by credits', () => {
      const subA: Subject = { ...dummySubject, id: 'sub-A', credits: 4 };
      const subB: Subject = { ...dummySubject, id: 'sub-B', credits: 2 };

      // Sub A: 4 credits, 8/10 = 80%
      const recordsA: AttendanceRecord[] = [
        ...Array.from({ length: 8 }, (_, i) =>
          createRecord(`2026-09-${10 + i}`, 'PRESENT', 'sub-A')
        ),
        ...Array.from({ length: 2 }, (_, i) =>
          createRecord(`2026-09-${20 + i}`, 'ABSENT', 'sub-A')
        ),
      ];

      // Sub B: 2 credits, 1/2 = 50%
      const recordsB: AttendanceRecord[] = [
        createRecord('2026-09-10', 'PRESENT', 'sub-B'),
        createRecord('2026-09-11', 'ABSENT', 'sub-B'),
      ];

      const allRecords = [...recordsA, ...recordsB];

      // Weighted calculation:
      // (80 * 4 + 50 * 2) / (4 + 2) = (320 + 100) / 6 = 420 / 6 = 70.0%
      const weighted = overallWeightedPct([subA, subB], allRecords);
      expect(weighted).toBe(70);
    });

    it('excludes subjects with zero held classes from the weight denominator', () => {
      const subA: Subject = { ...dummySubject, id: 'sub-A', credits: 4 };
      const subB: Subject = { ...dummySubject, id: 'sub-B', credits: 3 };

      // Only subA has held classes: 100%
      const records = [createRecord('2026-09-01', 'PRESENT', 'sub-A')];

      // Should be 100%, not scaled down by subB's unused credits
      expect(overallWeightedPct([subA, subB], records)).toBe(100);
    });

    it('returns null when no subjects have held classes', () => {
      expect(overallWeightedPct([dummySubject], [])).toBeNull();
    });
  });

  describe('projectionCanBunk', () => {
    it('calculates max consecutive bunkable classes staying >= 75%', () => {
      // 10 present, 0 absent = 100%
      // 10 / (10 + B) >= 0.75 => 10 >= 7.5 + 0.75B => 2.5 >= 0.75B => B <= 3.33 => 3 classes
      // If bunk 3: 10 / 13 = 76.9% (>=75%)
      // If bunk 4: 10 / 14 = 71.4% (<75%)
      const records: AttendanceRecord[] = Array.from({ length: 10 }, (_, i) =>
        createRecord(`2026-09-${10 + i}`, 'PRESENT')
      );

      expect(projectionCanBunk(records, 'sub-1', 75)).toBe(3);
    });

    it('returns 0 if currently below target', () => {
      // 5 present, 5 absent = 50% (< 75%)
      const records: AttendanceRecord[] = [
        ...Array.from({ length: 5 }, (_, i) =>
          createRecord(`2026-09-${10 + i}`, 'PRESENT')
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createRecord(`2026-09-${20 + i}`, 'ABSENT')
        ),
      ];

      expect(projectionCanBunk(records, 'sub-1', 75)).toBe(0);
    });

    it('returns 0 when target is 100% or zero classes held', () => {
      const records = [createRecord('2026-09-01', 'PRESENT')];
      expect(projectionCanBunk(records, 'sub-1', 100)).toBe(0);
      expect(projectionCanBunk([], 'sub-1', 75)).toBe(0);
    });
  });

  describe('projectionMustAttend', () => {
    it('calculates consecutive attendances needed to reach target', () => {
      // 5 present, 5 absent (50%). Target: 75%
      // (5 + M) / (10 + M) >= 0.75
      // 5 + M >= 7.5 + 0.75M
      // 0.25M >= 2.5 => M >= 10
      // Check: (5 + 10) / (10 + 10) = 15/20 = 75%
      const records: AttendanceRecord[] = [
        ...Array.from({ length: 5 }, (_, i) =>
          createRecord(`2026-09-${10 + i}`, 'PRESENT')
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createRecord(`2026-09-${20 + i}`, 'ABSENT')
        ),
      ];

      const result = projectionMustAttend(records, 'sub-1', 75);
      expect(result.count).toBe(10);
      expect(result.isPossible).toBe(true);
    });

    it('returns 0 needed when already at or above target', () => {
      const records = [
        createRecord('2026-09-01', 'PRESENT'),
        createRecord('2026-09-02', 'PRESENT'),
      ];
      const result = projectionMustAttend(records, 'sub-1', 75);
      expect(result.count).toBe(0);
      expect(result.isPossible).toBe(true);
    });

    it('handles impossible 100% target safely when absents exist', () => {
      const records = [
        createRecord('2026-09-01', 'PRESENT'),
        createRecord('2026-09-02', 'ABSENT'),
      ];
      const result = projectionMustAttend(records, 'sub-1', 100);
      expect(result.count).toBe(Infinity);
      expect(result.isPossible).toBe(false);
    });

    it('flags isPossible as false if required classes exceed remaining semester classes', () => {
      // 5 present, 5 absent -> needs 10 classes
      const records: AttendanceRecord[] = [
        ...Array.from({ length: 5 }, (_, i) =>
          createRecord(`2026-09-${10 + i}`, 'PRESENT')
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createRecord(`2026-09-${20 + i}`, 'ABSENT')
        ),
      ];

      // Only 6 classes left in semester!
      const result = projectionMustAttend(records, 'sub-1', 75, 6);
      expect(result.count).toBe(10);
      expect(result.isPossible).toBe(false);
    });
  });

  describe('streaks', () => {
    it('computes current and longest streaks ignoring NO_CLASS', () => {
      const records: AttendanceRecord[] = [
        createRecord('2026-09-01', 'PRESENT'),
        createRecord('2026-09-02', 'PRESENT'),
        createRecord('2026-09-03', 'PRESENT'),
        createRecord('2026-09-04', 'NO_CLASS'), // ignored
        createRecord('2026-09-05', 'ABSENT'),
        createRecord('2026-09-06', 'ABSENT'),
        createRecord('2026-09-07', 'PRESENT'),
        createRecord('2026-09-08', 'PRESENT'),
      ];

      const s = streaks(records, 'sub-1');
      expect(s.longestPresentStreak).toBe(3);
      expect(s.longestAbsentStreak).toBe(2);
      expect(s.currentPresentStreak).toBe(2);
      expect(s.currentAbsentStreak).toBe(0);
    });

    it('handles zero records gracefully', () => {
      const s = streaks([], 'sub-1');
      expect(s.currentPresentStreak).toBe(0);
      expect(s.currentAbsentStreak).toBe(0);
      expect(s.longestPresentStreak).toBe(0);
      expect(s.longestAbsentStreak).toBe(0);
    });
  });

  describe('projectedFinalPct', () => {
    it('computes best and worst case final percentage', () => {
      // 8 present, 2 absent = 80%.
      const records: AttendanceRecord[] = [
        ...Array.from({ length: 8 }, (_, i) =>
          createRecord(`2026-09-${10 + i}`, 'PRESENT')
        ),
        ...Array.from({ length: 2 }, (_, i) =>
          createRecord(`2026-09-${20 + i}`, 'ABSENT')
        ),
      ];

      // If semester has future classes
      const result = projectedFinalPct(
        dummySubject,
        records,
        '2026-12-31',
        '2026-09-25'
      );
      expect(result.remainingClasses).toBeGreaterThan(0);
      expect(result.bestCasePct).toBeGreaterThan(result.worstCasePct!);
    });
  });
});
