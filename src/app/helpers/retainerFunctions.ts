import { recurringDateTypeEnum, StepType } from "../models/enums";
import { Step } from "../models/step";
import { areTwoDaysInTheSameWeek, getTodayAtMidnightLocal, isDateGreaterOrEqual, isDateSmallerOrEqual, parseLocalDate } from "./functions";


// export function initRetainerSteps(steps: Step[], retainerActiveSteps: Step[], retainerFutureSteps: Step[], retainerFinishedSteps: Step[]) {
//     if (steps) {
//         steps.forEach(step => {
//             if (step.name?.includes("פרויקט 1")) {
//                 debugger
//             }
//             if (!step.isComplete) {
//                 handleNotCompletedRetainerStep(step, retainerActiveSteps, retainerFutureSteps);
//             } else {
//                 if (step.isRecurring) {
//                     const dateCreated = parseLocalDate(step.dateCreated ?? step.dateCompleted);
//                     //const dateDue = parseLocalDate(step.dateDue ?? step.dateCompleted);
//                     const dateCompleted = parseLocalDate(step.dateCompleted);
//                     const today = new Date();
//                     let nextOccurrenceDate = new Date(dateCreated);
//                     let occurIntervalCounter = new Date(nextOccurrenceDate);
//                     if (step.recurringDateType === recurringDateTypeEnum.day) {
//                         //occurIntervalCounter.setDate(occurIntervalCounter.getDate() + (step.recurringEvery ?? 1));
//                         // nextOccurrenceDate.setDate(occurIntervalCounter.getDate());
//                         while (isDateGreaterOrEqual(dateCompleted, occurIntervalCounter)) {
//                             nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + (step.recurringEvery ?? 1));
//                             //occurIntervalCounter.setDate(occurIntervalCounter.getDate() + (step.recurringEvery ?? 1));
//                         }
//                         //step.dateDue = new Date(nextOccurrenceDate); // ?useless?
//                     } else if (step.recurringDateType === recurringDateTypeEnum.week && step.recurringDaysInWeek?.length) {
//                         if (areTwoDaysInTheSameWeek(dateCreated, dateCompleted)) { // maybe there is another weekly step in the same week
//                             // look for next day in week
//                             const dayInWeekCompleted = dateCompleted.getDay();
//                             let nextDayInWeek = -1;
//                             for (let index = 0; index < step.recurringDaysInWeek.length; index++) { // check if there is another task in the same week
//                                 if (step.recurringDaysInWeek[index] > dayInWeekCompleted) {
//                                     nextDayInWeek = step.recurringDaysInWeek[index];
//                                     break;
//                                 }
//                             }
//                             if (nextDayInWeek > -1) { // we are still in target week
//                                 nextOccurrenceDate.setDate(dateCreated.getDate() + (nextDayInWeek - dateCreated.getDay()));
//                             } else { // should look at next week
//                                 nextOccurrenceDate.setDate(dateDue.getDate() + (step.recurringEvery ?? 1) * 7);
//                                 const newDateDue = new Date(step.dateDue ?? new Date());
//                                 newDateDue.setDate(nextOccurrenceDate.getDate());
//                                 step.dateDue = newDateDue;
//                             }
//                         } else { // should look at next week
//                             // reset created date to the first day of the week
//                             const currentDayInWeek = occurIntervalCounter.getDay();
//                             const firstDayOfWeek = step.recurringDaysInWeek[0];
//                             nextOccurrenceDate.setDate(occurIntervalCounter.getDate() - (currentDayInWeek - firstDayOfWeek));

//                             while (isDateGreaterOrEqual(dateCompleted, occurIntervalCounter)) {
//                                 nextOccurrenceDate.setDate(occurIntervalCounter.getDate() + (step.recurringEvery ?? 1) * 7);
//                             }
//                         }
//                     } else { // month
//                         //occurIntervalCounter.setMonth(occurIntervalCounter.getMonth() + (step.recurringEvery ?? 1));
//                         //occurIntervalCounter.setDate(step.recurringDayInMonth ?? dateCreated.getDate());
//                         //nextOccurrenceDate.setDate(step.recurringDayInMonth ?? dateCreated.getDate());
//                         while (isDateGreaterOrEqual(dateCompleted, occurIntervalCounter)) {
//                             nextOccurrenceDate.setMonth(nextOccurrenceDate.getMonth() + (step.recurringEvery ?? 1));
//                             //nextOccurrenceDate = new Date(occurIntervalCounter);
//                             //occurIntervalCounter.setMonth(occurIntervalCounter.getMonth() + (step.recurringEvery ?? 1));
//                         }
//                         //step.dateDue = new Date(nextOccurrenceDate);
//                     }

//                     if (isDateGreaterOrEqual(nextOccurrenceDate, today)) {
//                         retainerFutureSteps.push(step);
//                     } else {
//                         if (step.tasks?.length) {
//                             step.tasks.forEach(t => t.isComplete = false);
//                         }

//                         step.dateCreated = nextOccurrenceDate
//                         retainerActiveSteps.push(step);
//                     }
//                 } else {
//                     retainerFinishedSteps.push(step);
//                 }
//             }
//         });
//     }
// }

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
        result.setDate(result.getDate() + (step.recurringEvery ?? 1) - 1);
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
        result.setDate(result.getDate()+futureWeeks);
    } else { // month
        if (result.getDate() !== step.recurringDayInMonth) {
            result.setMonth(result.getMonth() + (step.recurringEvery ?? 1));
        }
    }

    return result
}

export function getNextRetainerOccurrenceDate(step: Step): Date {
    const today = new Date();
    if (step.isRecurring) {
        const dateCreated = parseLocalDate(step.dateCreated ?? new Date());
        let nextOccurrenceDate = new Date(dateCreated);
        nextOccurrenceDate = new Date(
            nextOccurrenceDate.getFullYear(),
            nextOccurrenceDate.getMonth(),
            nextOccurrenceDate.getDate()
        );
        if (step.recurringDateType === recurringDateTypeEnum.day) {
            nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + (step.recurringEvery ?? 1) - 1);
            while (!isDateGreaterOrEqual(nextOccurrenceDate, today)) {
                nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + (step.recurringEvery ?? 1));
            }
            return nextOccurrenceDate;
        } else if (step.recurringDateType === recurringDateTypeEnum.week && step.recurringDaysInWeek?.length) {
            // reset created date to the first day of the week
            const currentDayInWeek = nextOccurrenceDate.getDay();
            const firstDayOfWeek = step.recurringDaysInWeek[0];
            nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() - (currentDayInWeek - firstDayOfWeek));
            let atleastOnce = true;
            while (atleastOnce || !isDateGreaterOrEqual(nextOccurrenceDate, today)) {
                atleastOnce = false;
                let didFound = false;
                step.recurringDaysInWeek.forEach(day => {
                    const potentialDate = new Date(nextOccurrenceDate);
                    potentialDate.setDate(potentialDate.getDate() + (day - firstDayOfWeek));
                    if (isDateGreaterOrEqual(potentialDate, today)) {
                        nextOccurrenceDate = potentialDate;
                        didFound = true;
                        return;
                    }
                    if (didFound) return;
                });
                if (didFound) return nextOccurrenceDate;
                nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + (step.recurringEvery ?? 1) * 7);
            }
            return nextOccurrenceDate;
        } else { // month
            nextOccurrenceDate.setMonth(nextOccurrenceDate.getMonth() + (step.recurringEvery ?? 1));
            nextOccurrenceDate.setDate(step.recurringDayInMonth ?? nextOccurrenceDate.getDate());
            while (!isDateGreaterOrEqual(nextOccurrenceDate, today)) {
                nextOccurrenceDate.setMonth(nextOccurrenceDate.getMonth() + (step.recurringEvery ?? 1));
            }

            return nextOccurrenceDate;
        }
    }
    return today;
}

export function getOcurencesInRange(step: Step, start: Date, end: Date): Date[] {
    const results: Date[] = [];
    let nextOcurence = new Date(step.nextOccurrence ?? new Date());
    if (nextOcurence < new Date()) return results;
    if (step.recurringDateType === recurringDateTypeEnum.day) {
        while (isDateSmallerOrEqual(nextOcurence, end)) {
            nextOcurence.setDate(nextOcurence.getDate() + (step.recurringEvery ?? 1));
            if (isDateGreaterOrEqual(nextOcurence, start)) {
                results.push(new Date(nextOcurence));
            }
        }
    } else if (step.recurringDateType === recurringDateTypeEnum.week) {
        const days = step.recurringDaysInWeek ?? [];
        if (nextOcurence <= end) {
            const nextOcurenceDay = nextOcurence.getDay();
            days.forEach(day => {
                if (day > nextOcurenceDay) {
                    const newDay = new Date(nextOcurence);
                    newDay.setDate(newDay.getDate() + day);
                }
            });
            return results;
        }
        // return to sunday
        nextOcurence.setDate(nextOcurence.getDate() - nextOcurence.getDay());
        while (nextOcurence < start) {
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

// export function handleNotCompletedRetainerStep(step: Step, retainerActiveSteps: Step[], retainerFutureSteps: Step[]) {
//     if (!step.isRecurring) {
//         retainerActiveSteps.push(step);
//     } else {
//         const today = new Date();
//         if (step.recurringDateType === recurringDateTypeEnum.day) { // day
//             retainerActiveSteps.push(step);
//         } else if (step.recurringDateType === recurringDateTypeEnum.week && step.recurringDaysInWeek?.length) { // week
//             const todayDayInWeek = today.getDay();
//             if (step.recurringDaysInWeek.includes(todayDayInWeek)) {
//                 retainerActiveSteps.push(step);
//             } else {
//                 retainerFutureSteps.push(step);
//             }
//         } else { // month
//             if (today.getDate() === step.recurringDayInMonth) {
//                 retainerActiveSteps.push(step);
//             } else {
//                 retainerFutureSteps.push(step);
//             }
//         }
//     }
// }