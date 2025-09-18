import { recurringDateTypeEnum, StepType } from "./enums";
import { StepTask } from "./stepTask";

export class Step {
    id?: string;
    projectId?: string | null;
    userId: string;
    name?: string;
    description?: string;
    isComplete: boolean;
    stepType: StepType;
    price: number;
    dateCompleted?: Date;
    dateDue?: Date | null;
    dateOnWeekly?: Date;
    positionInList: number;
    positionInWeeklyList: number;
    hideTaskDate?: Date;
    tasks?: StepTask[];
    isRecurring = false;
    reccuringEvery?: number;
    recurringDateType?: recurringDateTypeEnum;
    recurringDaysInWeek?: string[]; // 1 - Sunday, 7 - Saturday
    recurringDayInMonth?: number; // day in the month. 1-30

    constructor() {
        this.userId = "newStep";
        this.isComplete = false;
        this.stepType = StepType.task;
        this.price = 0;
        this.dateDue = undefined;
        this.positionInList = 0;
        this.positionInWeeklyList = 0;
    }
}