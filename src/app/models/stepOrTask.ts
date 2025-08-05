import { Project } from "./project";
import { Step } from "./step";
import { StepTask } from "./stepTask";

export class StepOrTask {
    task?: StepTask;
    step?: Step;
    parentStep?: Step;
    project?: Project;
}