import { Step } from "../models/step";
import { StepOrTask } from "../models/stepOrTask";

export function parseDate(input?: string): Date | null {
  if (input) {
    const parts = input.split('/');
    if (parts.length !== 3) return null;

    let [day, month, year] = parts.map(p => parseInt(p, 10));
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    day = day > 31 ? 31 : day;
    month = month > 12 ? 12 : month;
    // Handle 2-digit year (assume 2000s)
    const fullYear = year < 100 ? 2000 + year : year;
    const date = new Date(fullYear, month - 1, day);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function isDateBeforeToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // midnight, ignore time
  const given = new Date(date);
  given.setHours(0, 0, 0, 0);
  return given < today;
}

export function getTextForTask(task: StepOrTask): string | undefined {
  if (task.task) {
    return task.task.text;
  } else
    return task.step?.name;
}

export function areTwoDaysInTheSameWeek(date1: Date, date2: Date): boolean {
  // Clone the dates so we don't mutate the originals
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Get start of week (Sunday) for each date
  d1.setHours(0, 0, 0, 0);
  d1.setDate(d1.getDate() - d1.getDay());

  d2.setHours(0, 0, 0, 0);
  d2.setDate(d2.getDate() - d2.getDay());

  // Compare timestamps
  return d1.getTime() === d2.getTime();
}

export function parseLocalDate(dateValue: string | Date | undefined): Date {
  if (!dateValue) return new Date(0);
  if (dateValue instanceof Date) return dateValue;

  // Remove timezone info (Z or ±hh:mm) so JS treats it as local time
  const localDateString = dateValue.replace(/Z|([+-]\d{2}:?\d{2})$/, '');
  return new Date(localDateString);
}

export function isDateGreaterOrEqual(d1: Date, d2: Date): boolean {
  const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return date1.getTime() >= date2.getTime();
}

export function areDatesEqual(d1: Date | undefined, d2: Date | undefined): boolean {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function updateDatesWithLocalTime(step: Step) {
  const nextOccurrence = step.nextOccurrence;

  if (nextOccurrence) {
    const newNextOccurrence = new Date(
      nextOccurrence.getTime() - nextOccurrence.getTimezoneOffset() * 60000
    );
    step.nextOccurrence = newNextOccurrence;
  }
}