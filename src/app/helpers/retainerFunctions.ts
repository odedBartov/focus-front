import { recurringDateTypeEnum, StepType } from "../models/enums";
import { Step } from "../models/step";
import { areDatesEqual, areTwoDaysInTheSameWeek, getTodayAtMidnightLocal, isDateGreaterOrEqual, isDateSmallerOrEqual, parseLocalDate } from "./functions";


export function initRetainerSteps(steps: Step[]) {
    const retainerActiveSteps: Step[] = [];
    const retainerFutureSteps: Step[] = [];
    const retainerFinishedSteps: Step[] = [];

    steps.forEach(step => {
        if (step.isComplete) {
            retainerFinishedSteps.push(step);
        } else {
            if (step.isRecurring) {
                retainerFutureSteps.push(step);
            } else {
                if (step.dateOnWeekly == undefined || (step.dateOnWeekly && isDateSmallerOrEqual(new Date(step.dateOnWeekly), new Date()))) {
                    retainerActiveSteps.push(step);
                }
            }
        }
    })

    return {
        retainerActiveSteps,
        retainerFutureSteps,
        retainerFinishedSteps
    };
}

function addMonthsClamped(base: Date, monthsToAdd: number, dayInMonth?: number | null): Date {
    const year = base.getFullYear();
    const month = base.getMonth();
    const totalMonths = year * 12 + month + monthsToAdd;
    const targetYear = Math.floor(totalMonths / 12);
    const targetMonth = totalMonths % 12;

    const desiredDay = dayInMonth ?? base.getDate();
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const finalDay = Math.min(desiredDay, lastDayOfTargetMonth);

    return new Date(targetYear, targetMonth, finalDay);
}

function isInFutureModifiedTasks(step: Step, date: Date): boolean {
    return !!step.futureModifiedTasks?.some(d => areDatesEqual(d, date));
}

export function createNextOccurenceDate(step: Step): Date {
    const today = getTodayAtMidnightLocal();
    const every = step.recurringEvery && step.recurringEvery > 0 ? step.recurringEvery : 1;

    if (step.recurringDateType === recurringDateTypeEnum.day) {
        const result = new Date(today);
        result.setDate(result.getDate() + every - 1); // Minus 1 because in days we reduce one. i.e. every 2 days should be tomorrow
        return result;
    }

    if (step.recurringDateType === recurringDateTypeEnum.week) {
        const days = (step.recurringDaysInWeek ?? []).slice().sort((a, b) => a - b);
        if (!days.length) {
            const result = new Date(today);
            result.setDate(result.getDate() + 7 * every);
            return result;
        }

        const startSunday = new Date(today);
        startSunday.setDate(startSunday.getDate() - startSunday.getDay());

        let currentSunday = new Date(startSunday);
        // search blocks of weeks spaced by `every`
        for (let block = 0; block < 52 * every; block++) { // safety bound ~1 year
            const sundayOfBlock = new Date(currentSunday);
            sundayOfBlock.setDate(startSunday.getDate() + block * 7 * every);

            for (const dayIndex of days) {
                const candidate = new Date(sundayOfBlock);
                candidate.setDate(candidate.getDate() + dayIndex);
                if (isDateGreaterOrEqual(candidate, today)) {
                    return candidate;
                }
            }
        }

        return today;
    }

    // month
    const result = new Date(today);
    const targetDay = step.recurringDayInMonth ?? result.getDate();
    const sameMonthCandidate = addMonthsClamped(result, 0, targetDay);
    if (isDateGreaterOrEqual(sameMonthCandidate, today)) {
        return sameMonthCandidate;
    }
    return addMonthsClamped(result, every, targetDay);
}

export function getNextRetainerOccurrenceDate(step: Step): Date {
    const today = getTodayAtMidnightLocal();
    if (step.isRecurring) {
        const every = step.recurringEvery && step.recurringEvery > 0 ? step.recurringEvery : 1;
        let nextOccurrenceDate = new Date(step.nextOccurrence ?? today);
        if (step.recurringDateType === recurringDateTypeEnum.day) {
            nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + every);
            while (!isDateGreaterOrEqual(nextOccurrenceDate, today) || isInFutureModifiedTasks(step, nextOccurrenceDate)) {
                nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + every);
            }
            return nextOccurrenceDate;
        } else if (step.recurringDateType === recurringDateTypeEnum.week && step.recurringDaysInWeek?.length) {
            const days = step.recurringDaysInWeek.slice().sort((a, b) => a - b);
            // mirror backend logic: walk through allowed weekdays, jumping by `every` weeks when needed
            let safety = 0;
            while ((isDateGreaterOrEqual(today, nextOccurrenceDate) || isInFutureModifiedTasks(step, nextOccurrenceDate)) && safety < 366) {
                safety++;
                const currentDay = nextOccurrenceDate.getDay();
                const nextDayInList = days.find(d => d > currentDay);
                let candidate: Date;

                if (nextDayInList !== undefined) {
                    const diff = nextDayInList - currentDay;
                    candidate = new Date(nextOccurrenceDate);
                    candidate.setDate(candidate.getDate() + diff);
                } else {
                    const weeksToAdd = every;
                    const startOfNextBlock = new Date(nextOccurrenceDate);
                    startOfNextBlock.setDate(startOfNextBlock.getDate() + 7 * weeksToAdd);
                    const firstDay = days[0];
                    const diff = (firstDay - startOfNextBlock.getDay() + 7) % 7;
                    candidate = new Date(startOfNextBlock);
                    candidate.setDate(candidate.getDate() + diff);
                }

                nextOccurrenceDate = candidate;
            }

            return nextOccurrenceDate;
        } else { // month
            const targetDay = step.recurringDayInMonth ?? nextOccurrenceDate.getDate();
            nextOccurrenceDate = addMonthsClamped(nextOccurrenceDate, every, targetDay);
            let safety = 0;
            while ((!isDateGreaterOrEqual(nextOccurrenceDate, today) || isInFutureModifiedTasks(step, nextOccurrenceDate)) && safety < 120) {
                safety++;
                nextOccurrenceDate = addMonthsClamped(nextOccurrenceDate, every, targetDay);
            }

            return nextOccurrenceDate;
        }
    }
    return today;
}

export function getOcurencesInRange(step: Step, start: Date, end: Date): Date[] {
    const results: Date[] = [];
    const today = getTodayAtMidnightLocal();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // we dont want to calculate today, so we start from tomorrow
    const every = step.recurringEvery && step.recurringEvery > 0 ? step.recurringEvery : 1;

    let nextOcurence = new Date(step.nextOccurrence ?? tomorrow);
    if (nextOcurence < tomorrow) nextOcurence = tomorrow;

    if (step.recurringDateType === recurringDateTypeEnum.day) {
        while (isDateSmallerOrEqual(nextOcurence, end)) {
            if (isDateGreaterOrEqual(nextOcurence, start) && !isInFutureModifiedTasks(step, nextOcurence)) {
                results.push(new Date(nextOcurence));
            }
            nextOcurence.setDate(nextOcurence.getDate() + every);
        }
    } else if (step.recurringDateType === recurringDateTypeEnum.week) {
        const days = (step.recurringDaysInWeek ?? []).slice().sort((a, b) => a - b);
        if (!days.length) {
            return results;
        }

        const rangeSunday = new Date(start);
        rangeSunday.setDate(rangeSunday.getDate() - rangeSunday.getDay());

        let anchorSunday: Date;
        if (step.nextOccurrence) {
            anchorSunday = new Date(step.nextOccurrence);
            anchorSunday.setDate(anchorSunday.getDate() - anchorSunday.getDay());
        } else {
            anchorSunday = new Date(rangeSunday);
        }

        // align anchorSunday to the first recurrence block >= rangeSunday
        if (isDateGreaterOrEqual(rangeSunday, anchorSunday)) {
            const diffDays = Math.floor((rangeSunday.getTime() - anchorSunday.getTime()) / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.floor(diffDays / 7);
            const blocksToAdd = Math.ceil(diffWeeks / every);
            anchorSunday.setDate(anchorSunday.getDate() + blocksToAdd * 7 * every);
        }

        let currentSunday = new Date(anchorSunday);
        // generate blocks while within range
        while (isDateSmallerOrEqual(currentSunday, end)) {
            for (const dayIndex of days) {
                const candidate = new Date(currentSunday);
                candidate.setDate(candidate.getDate() + dayIndex);
                if (!isDateGreaterOrEqual(candidate, start) || !isDateSmallerOrEqual(candidate, end)) {
                    continue;
                }
                if (!isDateGreaterOrEqual(candidate, tomorrow)) {
                    continue; // skip today and past
                }
                if (isInFutureModifiedTasks(step, candidate)) {
                    continue;
                }
                results.push(candidate);
            }
            currentSunday.setDate(currentSunday.getDate() + 7 * every);
        }
    } else if (step.recurringDateType === recurringDateTypeEnum.month) {
        const targetDay = step.recurringDayInMonth ?? nextOcurence.getDate();
        // advance to at least start and tomorrow
        while ((!isDateGreaterOrEqual(nextOcurence, start) || !isDateGreaterOrEqual(nextOcurence, tomorrow) || isInFutureModifiedTasks(step, nextOcurence))) {
            nextOcurence = addMonthsClamped(nextOcurence, every, targetDay);
        }
        if (isDateSmallerOrEqual(nextOcurence, end)) {
            results.push(new Date(nextOcurence));
        }
    }

    return results
}
