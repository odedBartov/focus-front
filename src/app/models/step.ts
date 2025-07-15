import { StepType } from "./enums";
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
    positionInList: number;
    hideTaskDate?: Date;
    tasks?: StepTask[];

    constructor() {
        this.userId = "newStep";
        this.isComplete = false;
        this.stepType = StepType.task;
        this.price = 0;
        this.dateDue = undefined;
        this.positionInList = 0;
    }
}