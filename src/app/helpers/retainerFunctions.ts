import { Step } from "../models/step";
import { isDateSmallerOrEqual } from "./functions";


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
                if (step.originalRetainerStepId) {
                    if (step.dateOnWeekly == undefined || (step.dateOnWeekly && isDateSmallerOrEqual(new Date(step.dateOnWeekly), new Date()))) {
                        retainerActiveSteps.push(step);
                    }
                } else {
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
