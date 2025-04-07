import { TaskType } from "./taskType";

export class Task {
    taskId: string;
    name: string;
    isFinished: boolean;
    taskType: TaskType;
    ammount: number;

    constructor() {
        this.taskId = 'aa';
        this.name = 'abc'
        this.isFinished = false;
        this.taskType = TaskType.work;
        this.ammount = 10;
    }
}