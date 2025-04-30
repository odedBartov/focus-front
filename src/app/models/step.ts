import { StepType } from "./enums";

export class Step {
    id?: string;
    projectId?: string;
    name?: string;
    description?: string;
    isComplete: boolean;
    stepType: StepType;
    price: number;
    dateCompleted?: Date;
    dateDue: Date;

    constructor() {
        this.isComplete = false;
        this.stepType = StepType.work;
        this.price = 0;
        this.dateDue = new Date();
    }
}