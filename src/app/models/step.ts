import { StepType } from "./stepType";

export class Step {
    stepId: string;
    name: string;
    details: string;
    isFinished: boolean;
    stepType: StepType;
    price: number;

    constructor() {
        this.stepId = 'aa';
        this.name = 'abc'
        this.details = 'עם כאלו מילים';
        this.isFinished = false;
        this.stepType = StepType.work;
        this.price = 10;
    }
}