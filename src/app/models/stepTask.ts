

export class StepTask {
    id: string;
    text?: string;
    isComplete?: boolean;

    constructor() {
        this.id = crypto.randomUUID();
    }
}