import { StepType } from "./enums";

export class Step {
    id: string;
    name: string;
    details: string;
    isFinished: boolean;
    stepType: StepType;
    price: number;

    constructor() {
        this.id = 'aa';
        this.name = 'abc'
        this.details = 'עם כאלו מילים';
        this.isFinished = false;
        this.stepType = StepType.work;
        this.price = 10;
    }
}