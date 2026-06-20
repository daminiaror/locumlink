import {
  parseClockTimeHm,
  utcDateTimePartsToMs,
  browseShiftStartActiveSql,
} from './job-schedule.util';

describe('job-schedule.util', () => {
  describe('parseClockTimeHm', () => {
    it('parses HH:mm stored in the DB', () => {
      expect(parseClockTimeHm('17:30')).toEqual({ hours: 17, minutes: 30 });
      expect(parseClockTimeHm('9:05')).toEqual({ hours: 9, minutes: 5 });
      expect(parseClockTimeHm('09:05:00')).toEqual({ hours: 9, minutes: 5 });
    });

    it('matches HH:mm prefix even when suffix text is present', () => {
      expect(parseClockTimeHm('9:30 AM')).toEqual({ hours: 9, minutes: 30 });
      expect(parseClockTimeHm('')).toBeNull();
      expect(parseClockTimeHm(null)).toBeNull();
    });
  });

  describe('utcDateTimePartsToMs', () => {
    it('combines UTC calendar date and clock time', () => {
      const ms = utcDateTimePartsToMs('2026-06-20', '17:30');
      expect(ms).toBe(Date.UTC(2026, 5, 20, 17, 30, 0, 0));
    });
  });

  describe('browseShiftStartActiveSql', () => {
    it('returns a Prisma SQL fragment', () => {
      const sql = browseShiftStartActiveSql();
      expect(sql).toBeDefined();
      expect(typeof sql.text).toBe('string');
      expect(sql.text).toContain('start_date IS NULL');
      expect(sql.text).toContain("TIME '23:59:59'");
    });
  });
});
