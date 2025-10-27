import { recurringDateTypeEnum } from "../models/enums";
import { Step } from "../models/step";
import { areTwoDaysInTheSameWeek, isDateGreaterOrEqual, parseLocalDate } from "./functions";


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

export function handleNotCompletedRetainerStep(step: Step, retainerActiveSteps: Step[], retainerFutureSteps: Step[]) {
    if (!step.isRecurring) {
        retainerActiveSteps.push(step);
    } else {
        const today = new Date();
        if (step.recurringDateType === recurringDateTypeEnum.day) { // day
            retainerActiveSteps.push(step);
        } else if (step.recurringDateType === recurringDateTypeEnum.week && step.recurringDaysInWeek?.length) { // week
            const todayDayInWeek = today.getDay();
            if (step.recurringDaysInWeek.includes(todayDayInWeek)) {
                retainerActiveSteps.push(step);
            } else {
                retainerFutureSteps.push(step);
            }
        } else { // month
            if (today.getDate() === step.recurringDayInMonth) {
                retainerActiveSteps.push(step);
            } else {
                retainerFutureSteps.push(step);
            }
        }
    }
}