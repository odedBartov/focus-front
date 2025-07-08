import { StepType } from "./enums";

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

    constructor() {
        this.userId = "newStep";
        this.isComplete = false;
        this.stepType = StepType.task;
        this.price = 0;
        this.dateDue = null;
        this.positionInList = 0;
    }
}