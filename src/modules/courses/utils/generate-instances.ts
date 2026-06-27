export type FrequencyType = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

export type WeekdayTiming = { timeFrom: string; timeTo: string };

export type CourseOccurrence = { date: Date; timeFrom: string; timeTo: string };

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const MAX_INSTANCES = 365;

export function generateOccurrences(params: {
  startDate: Date;
  endDate: Date;
  frequency: FrequencyType;
  defaultTimeFrom: string;
  defaultTimeTo: string;
  weekdays?: string[];
  weekdayTimings?: Record<string, WeekdayTiming>;
}): CourseOccurrence[] {
  const {
    startDate,
    endDate,
    frequency,
    defaultTimeFrom,
    defaultTimeTo,
    weekdays = [],
    weekdayTimings = {},
  } = params;
  const occurrences: CourseOccurrence[] = [];

  const addOccurrence = (d: Date, timeFrom: string, timeTo: string) => {
    occurrences.push({ date: new Date(d), timeFrom, timeTo });
  };

  if (frequency === "daily") {
    const cursor = new Date(startDate);
    while (cursor <= endDate && occurrences.length < MAX_INSTANCES) {
      addOccurrence(cursor, defaultTimeFrom, defaultTimeTo);
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (frequency === "weekly") {
    const cursor = new Date(startDate);
    while (cursor <= endDate && occurrences.length < MAX_INSTANCES) {
      addOccurrence(cursor, defaultTimeFrom, defaultTimeTo);
      cursor.setDate(cursor.getDate() + 7);
    }
  } else if (frequency === "biweekly") {
    const cursor = new Date(startDate);
    while (cursor <= endDate && occurrences.length < MAX_INSTANCES) {
      addOccurrence(cursor, defaultTimeFrom, defaultTimeTo);
      cursor.setDate(cursor.getDate() + 14);
    }
  } else if (frequency === "monthly") {
    const cursor = new Date(startDate);
    while (cursor <= endDate && occurrences.length < MAX_INSTANCES) {
      addOccurrence(cursor, defaultTimeFrom, defaultTimeTo);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else if (frequency === "custom") {
    const targetDays = new Set(weekdays.map((w) => WEEKDAY_MAP[w]));
    const cursor = new Date(startDate);
    while (cursor <= endDate && occurrences.length < MAX_INSTANCES) {
      const dayName = Object.keys(WEEKDAY_MAP).find((k) => WEEKDAY_MAP[k] === cursor.getDay());
      if (targetDays.has(cursor.getDay()) && dayName) {
        const timing = weekdayTimings[dayName];
        addOccurrence(cursor, timing?.timeFrom ?? defaultTimeFrom, timing?.timeTo ?? defaultTimeTo);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return occurrences;
}
