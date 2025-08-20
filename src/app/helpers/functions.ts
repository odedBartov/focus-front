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