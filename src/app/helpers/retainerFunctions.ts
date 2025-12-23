import { recurringDateTypeEnum, StepType } from "../models/enums";
import { Step } from "../models/step";
import { areTwoDaysInTheSameWeek, getTodayAtMidnightLocal, isDateGreaterOrEqual, isDateSmallerOrEqual, parseLocalDate } from "./functions";


export function initRetainerSteps(steps: Step[]) {
    const retainerActiveSteps: Step[] = [];
    const retainerFutureSteps: Step[] = [];
    const retainerFinishedSteps: Step[] = [];

    steps.forEach(step => {
        if (!step.isComplete) {
            retainerActiveSteps.push(step);
        } else {
            if (step.isRecurring) {
                retainerFutureSteps.push(step);
            } else {
                retainerFinishedSteps.push(step);
            }
        }
    });

    return {
        retainerActiveSteps,
        retainerFutureSteps,
        retainerFinishedSteps
    };
}

export function createNextOccurenceDate(step: Step): Date {
    const result = getTodayAtMidnightLocal();
    if (step.recurringDateType === recurringDateTypeEnum.day) {
        result.setDate(result.getDate() + (step.recurringEvery ?? 1) - 1); // Minus 1 because in days we reduce one. i.e. every 2 days should be tomorrow
    } else if (step.recurringDateType === recurringDateTypeEnum.week) {
        const days = step.recurringDaysInWeek ?? [];
        for (let index = 0; index < days.length; index++) {
            const day = days[index];
            if (day >= result.getDay()) {
                const daysGap = day - result.getDay();
                result.setDate(result.getDate() + daysGap);
                return result;
            }
        }
        const daysGap = result.getDay() - days[0];
        const futureWeeks = ((step.recurringEvery ?? 1) * 7) - daysGap;
        result.setDate(result.getDate() + futureWeeks);
    } else { // month
        if (result.getDate() !== step.recurringDayInMonth) {
            result.setMonth(result.getMonth() + (step.recurringEvery ?? 1));
            result.setDate(step.recurringDayInMonth ?? result.getDate());
        }
    }

    return result
}

export function getNextRetainerOccurrenceDate(step: Step): Date {
    const today = getTodayAtMidnightLocal();
    if (step.isRecurring) {
        let nextOccurrenceDate = new Date(step.nextOccurrence ?? today);
        today.setFullYear(nextOccurrenceDate.getFullYear());
        today.setMonth(nextOccurrenceDate.getMonth());
        today.setDate(nextOccurrenceDate.getDate());
        if (step.recurringDateType === recurringDateTypeEnum.day) {
            nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + (step.recurringEvery ?? 1));
            while (!isDateGreaterOrEqual(nextOccurrenceDate, today) || (step.futureModifiedTasks && step.futureModifiedTasks.includes(nextOccurrenceDate))) {
                nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + (step.recurringEvery ?? 1));
            }
            return nextOccurrenceDate;
        } else if (step.recurringDateType === recurringDateTypeEnum.week && step.recurringDaysInWeek?.length) {
            // check if there is another day in the week
            const days = step.recurringDaysInWeek ?? [];
            for (let index = 0; index < days.length; index++) {
                const day = days[index];
                if (day > nextOccurrenceDate.getDay() + 1) {
                    const daysGap = day - nextOccurrenceDate.getDay();
                    nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() - daysGap);
                    return nextOccurrenceDate;
                }
            }
            // if not, rturn to sunday and do a while
            const currentDayInWeek = nextOccurrenceDate.getDay();
            const firstDayOfWeek = step.recurringDaysInWeek[0];
            nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() - (currentDayInWeek - firstDayOfWeek));
            nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + ((step.recurringEvery ?? 1) * 7));
            while (!isDateGreaterOrEqual(nextOccurrenceDate, today) || (step.futureModifiedTasks && step.futureModifiedTasks.includes(nextOccurrenceDate))) {
                nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + ((step.recurringEvery ?? 1) * 7));
            }

            return nextOccurrenceDate;
        } else { // month
            nextOccurrenceDate.setMonth(nextOccurrenceDate.getMonth() + (step.recurringEvery ?? 1));
            nextOccurrenceDate.setDate(step.recurringDayInMonth ?? nextOccurrenceDate.getDate());
            while (!isDateGreaterOrEqual(nextOccurrenceDate, today) || (step.futureModifiedTasks && step.futureModifiedTasks.includes(nextOccurrenceDate))) {
                nextOccurrenceDate.setMonth(nextOccurrenceDate.getMonth() + (step.recurringEvery ?? 1));
            }

            return nextOccurrenceDate;
        }
    }
    return today;
}

export function getOcurencesInRange(step: Step, start: Date, end: Date): Date[] {
    const results: Date[] = [];
    const today = getTodayAtMidnightLocal();
    today.setDate(today.getDate() + 1); // we dont want to calculate today, so we start from tomorrow
    let nextOcurence = new Date(step.nextOccurrence ?? today);
    if (nextOcurence < today) nextOcurence = today;
    if (step.recurringDateType === recurringDateTypeEnum.day) {
        while (isDateSmallerOrEqual(nextOcurence, end)) {
            if (isDateGreaterOrEqual(nextOcurence, start)) {
                results.push(new Date(nextOcurence));
            }
            nextOcurence.setDate(nextOcurence.getDate() + (step.recurringEvery ?? 1));
        }
    } else if (step.recurringDateType === recurringDateTypeEnum.week) {
        const days = step.recurringDaysInWeek ?? [];
        nextOcurence.setDate(nextOcurence.getDate() - nextOcurence.getDay());
        while (!isDateGreaterOrEqual(nextOcurence, start)) {
            nextOcurence.setDate(nextOcurence.getDate() + (7 * (step.recurringEvery ?? 1)));
        }
        // take the days
        days.forEach(day => {
            const newDate = new Date(nextOcurence);
            newDate.setDate(newDate.getDate() + day);
            results.push(newDate);
        });
    } else if (step.recurringDateType === recurringDateTypeEnum.month) {
        while (!isDateGreaterOrEqual(nextOcurence, start)) {
            nextOcurence.setMonth(nextOcurence.getMonth() + (step.recurringEvery ?? 1));
        }
        if (isDateSmallerOrEqual(nextOcurence, end)) {
            results.push(nextOcurence);
        }
    }

    return results
}
