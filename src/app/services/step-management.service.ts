import { Injectable } from '@angular/core';
import { Step } from '../models/step';
import { Project } from '../models/project';
import { StepType, projectTypeEnum, paymentModelEnum } from '../models/enums';
import { moveItemInArray } from '@angular/cdk/drag-drop';

export interface StepCompletionResult {
  updatedStep: Step;
  updatedSteps: Step[];
  shouldUpdatePositions: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StepManagementService {

  /**
   * Handles the logic of completing or uncompleting a step
   * @param step The step to change status (will be mutated)
   * @param allSteps All steps in the project (will be mutated)
   * @param isRetainer Whether the project is a retainer project
   * @returns Result containing the updated step and all steps
   */
  completeStep(step: Step, allSteps: Step[], isRetainer: boolean): StepCompletionResult {
    // Toggle completion status (mutate the step directly)
    step.isComplete = step.isRecurring ? true : !step.isComplete;

    if (step.isComplete) {
      this.handleStepCompletion(step, allSteps, isRetainer);
    } else {
      this.handleStepUncompletion(step, allSteps);
    }

    return {
      updatedStep: step,
      updatedSteps: allSteps,
      shouldUpdatePositions: true
    };
  }

  /**
   * Handles step completion logic
   */
  private handleStepCompletion(step: Step, allSteps: Step[], isRetainer: boolean): void {
    step.dateCompleted = new Date();
    step.dateOnWeekly = new Date();
    step.positionInWeeklyList = -1;

    // Calculate where to move the completed step
    const stepIndex = allSteps.findIndex(s => s.id === step.id);
    if (stepIndex === -1) return;

    let finishedSteps = 0;
    let notFinishedSteps = 0;

    for (let i = 0; i < allSteps.length; i++) {
      const currentStep = allSteps[i];
      if (currentStep.isComplete) {
        if (currentStep.id !== step.id) {
          finishedSteps++;
        } else {
          break;
        }
      } else {
        notFinishedSteps++;
      }
    }

    // Move the completed step to the end of finished steps
    moveItemInArray(allSteps, finishedSteps + notFinishedSteps, finishedSteps);
  }

  /**
   * Handles step uncompletion logic
   */
  private handleStepUncompletion(step: Step, allSteps: Step[]): void {
    step.dateCompleted = undefined;

    const stepIndex = allSteps.findIndex(s => s.id === step.id);
    if (stepIndex === -1) return;

    let stepsToMove = 0;

    // Count how many finished steps come after this one
    for (let i = stepIndex + 1; i < allSteps.length; i++) {
      if (allSteps[i].isComplete) {
        stepsToMove++;
      } else {
        break;
      }
    }

    // Move the uncompleted step after all finished steps
    if (stepsToMove > 0) {
      moveItemInArray(allSteps, stepIndex, stepIndex + stepsToMove);
    }
  }

  /**
   * Updates position in list for all steps
   */
  updateStepsPositions(steps: Step[]): void {
    steps.forEach((step, index) => {
      step.positionInList = index;
    });
  }

  /**
   * Finds the first incomplete step
   */
  findActiveStep(steps: Step[]): Step | undefined {
    return steps.find(s => !s.isComplete);
  }

  /**
   * Checks if all steps in a project are complete
   */
  areAllStepsComplete(steps: Step[]): boolean {
    return steps.every(s => s.isComplete);
  }

  /**
   * Calculates project price based on payment type
   */
  calculateProjectPrice(project: Project, retainerFinishedSteps?: Step[]): { basePrice: number; paidMoney: number } {
    let basePrice = 0;
    let paidMoney = 0;

    const isRetainerHourly = project.projectType === projectTypeEnum.retainer && 
                            project.paymentModel === paymentModelEnum.hourly;

    if (isRetainerHourly) {
      const totalHours = project.hourlyWorkSessions.reduce(
        (acc, session) => acc + (session.workTime / 3600000), 
        0
      );
      basePrice = Math.round(totalHours * (project.reccuringPayment ?? 0));
      paidMoney = retainerFinishedSteps 
        ? retainerFinishedSteps.reduce((acc, step) => acc + step.price, 0)
        : 0;
    } else {
      project.steps?.forEach(step => {
        if (step.stepType === StepType.payment) {
          basePrice += step.price;
          if (step.isComplete) {
            paidMoney += step.price;
          }
        }
      });
    }

    return { basePrice, paidMoney };
  }

  /**
   * Sorts steps by position in list
   */
  sortStepsByPosition(steps: Step[]): Step[] {
    return [...steps].sort((a, b) => a.positionInList - b.positionInList);
  }
}
