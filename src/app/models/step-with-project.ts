import { Project } from "./project";
import { Step } from "./step";

export interface StepWithProject {
  step: Step;
  project?: Project;
}

export function isStepComplete(item: StepWithProject): boolean {
  return item.step?.isComplete ?? false;
}
