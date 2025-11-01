import { Project } from "./project";
import { Step } from "./step";
import { StepTask } from "./stepTask";
import { Task } from "./task";

export class StepOrTask {
    task?: StepTask;
    step?: Step;
    parentStep!: Step;
    project?: Project;
}

export function isStepOrTaskComplete(task: StepOrTask) {
    if (task.step) {
        return task.step.isComplete;
    }
    return task.task?.isComplete;
}
