import { recurringDateTypeEnum, StepType } from "./enums";
import { StepTask } from "./stepTask";

export interface IStepOrTask {
  id?: string;
  text?: string;
  isComplete?: boolean;
  dateOnWeekly?: Date;
  positionInWeeklyList: number;
}

export class Step implements IStepOrTask {
    id?: string;
    projectId?: string | null;
    dateCreated?: Date; // the date on which the step was created
    userId: string;
    name?: string;
    description?: string;
    isComplete: boolean; // if the step is complete. if its a recurring step, then this should be changed when the next occurrence date arrives
    stepType: StepType;
    price: number;
    dateCompleted?: Date;
    dateDue?: Date | null; // month for payment
    dateOnWeekly?: Date; // the date on which the step is expected to be completed, we see this on the calendar
    positionInList: number; // the order of the step in the list of steps in the project
    positionInWeeklyList: number; // the order of the step in the list of steps in the weekly view
    hideTaskDate?: Date;
    tasks?: StepTask[];
    isRecurring = false; // if the step is recurring every period, or just a regular step
    recurringEvery?: number; // the number of the recurring period. i.e. every 2 days, every 3 weeks, every 4 months
    recurringDateType?: recurringDateTypeEnum; // the type of the recurring date. day, week, month
    recurringDaysInWeek?: number[]; // 0 - Sunday, 6 - Saturday (JS Date.getDay / .NET DayOfWeek). if the step is recurring every week, this is the days of the week on which the step is expected to be completed
    recurringDayInMonth?: number; // day in the month. 1-30
    nextOccurrence?: Date; // the next date on which the step is expected to be completed. when this date arrives the step should become not completed
    futureModifiedTasks?: Date[] = []; // list of dates on which the step is expected to be completed, but has been modified by the user. we need to avoid duplicates
    
    // these are not stored in db
    isRetainerCopy = false; // if the step is a copy of a retainer step. this is used to avoid duplicates
    originalRetainerStep?: Step; // the original retainer step that was copied

    constructor() {
        this.userId = "newStep";
        this.isComplete = false;
        this.stepType = StepType.task;
        this.price = 0;
        this.dateDue = undefined;
        this.positionInList = 0;
        this.positionInWeeklyList = 0;
        this.dateCreated = new Date();
    }
}