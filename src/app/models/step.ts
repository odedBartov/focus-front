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
    reccuringEvery?: number;
    recurringDateType?: recurringDateTypeEnum;

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