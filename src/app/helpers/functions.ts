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

export function isDateBeforeToday(date: Date) {
  const today = new Date();
  return date.getFullYear() < today.getFullYear() || date.getMonth() < today.getMonth() || date.getDate() < today.getDate();
}

export function getTextForTask(task: StepOrTask): string | undefined {
  if (task.task) {
    return task.task.text;
  } else
    return task.step?.name;
}