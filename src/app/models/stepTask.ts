

export class StepTask {
    id: string;
    text?: string;
    isComplete?: boolean;
    dateOnWeekly?: Date;
    positionInWeeklyList: number;

    constructor() {
        this.id = crypto.randomUUID();
        this.positionInWeeklyList = 0;
    }
}