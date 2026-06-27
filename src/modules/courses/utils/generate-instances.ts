export type FrequencyType = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

export type WeekdayTiming = { timeFrom: string; timeTo: string };

export type CourseOccurrence = { date: Date; timeFrom: string; timeTo: string };

export const VALID_FREQUENCIES: FrequencyType[] = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
];

const WEEKDAY_MAP: Record<string, number> = {
  sunday: 0,
  sonntag: 0,
  monday: 1,
  montag: 1,
  tuesday: 2,
  dienstag: 2,
  wednesday: 3,
  mittwoch: 3,
  thursday: 4,
  donnerstag: 4,
  friday: 5,
  freitag: 5,
  saturday: 6,
  samstag: 6,
};

const toWeekdayNumber = (weekday: string): number | undefined =>
  WEEKDAY_MAP[weekday.trim().toLowerCase()];

export const MAX_INSTANCES = 365;

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
    if (occurrences.length >= MAX_INSTANCES) {
      throw new Error(
        `Dauerauftrag überschreitet das Maximum von ${MAX_INSTANCES} Instanzen. Bitte ein kürzeres Enddatum wählen.`
      );
    }
    occurrences.push({ date: new Date(d), timeFrom, timeTo });
  };

  if (frequency === "daily") {
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      addOccurrence(cursor, defaultTimeFrom, defaultTimeTo);
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (frequency === "weekly") {
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      addOccurrence(cursor, defaultTimeFrom, defaultTimeTo);
      cursor.setDate(cursor.getDate() + 7);
    }
  } else if (frequency === "biweekly") {
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      addOccurrence(cursor, defaultTimeFrom, defaultTimeTo);
      cursor.setDate(cursor.getDate() + 14);
    }
  } else if (frequency === "monthly") {
    const cursor = new Date(startDate);
    const desiredDay = cursor.getDate();
    while (cursor <= endDate) {
      addOccurrence(cursor, defaultTimeFrom, defaultTimeTo);
      cursor.setDate(1);
      cursor.setMonth(cursor.getMonth() + 1);
      const lastDayOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      cursor.setDate(Math.min(desiredDay, lastDayOfMonth));
    }
  } else if (frequency === "custom") {
    const targetDays = new Set(
      weekdays.map(toWeekdayNumber).filter((d): d is number => d !== undefined)
    );
    const timingsByDay = Object.entries(weekdayTimings).reduce<Record<number, WeekdayTiming>>(
      (acc, [weekday, timing]) => {
        const day = toWeekdayNumber(weekday);
        if (day !== undefined) acc[day] = timing;
        return acc;
      },
      {}
    );
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      if (targetDays.has(cursor.getDay())) {
        const timing = timingsByDay[cursor.getDay()];
        addOccurrence(cursor, timing?.timeFrom ?? defaultTimeFrom, timing?.timeTo ?? defaultTimeTo);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return occurrences;
}
