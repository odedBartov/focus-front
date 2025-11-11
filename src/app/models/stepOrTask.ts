import { Project } from "./project";
import { Step } from "./step";
import { StepTask } from "./stepTask";
import { Task } from "./task";

export class StepOrTask {
    data!: IStepOrTask;
    parentStep!: Step;
    project?: Project;
}

export interface IStepOrTask {
    id?: string;
    text?: string;
    isComplete?: boolean;
    dateOnWeekly?: Date;
    positionInWeeklyList: number;
}

export function isStepOrTaskComplete(task: StepOrTask) {
    return task.data?.isComplete;
}

export function isStep(stepOrTask: any): stepOrTask is Step {
    return stepOrTask.userId !== undefined;
}