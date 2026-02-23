import { AfterViewInit, Component, effect, ElementRef, EventEmitter, inject, Output, QueryList, ViewChildren, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { ProjectsService } from '../../services/projects.service';
import { WeeklyDay } from '../../models/weeklyDay';
import { StepType } from '../../models/enums';
import { Step } from '../../models/step';
import { StepWithProject } from '../../models/step-with-project';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { HttpService } from '../../services/http.service';
import { NewTaskComponent } from '../new-task/new-task.component';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { WeeklyDayTaskComponent } from '../weekly-day-task/weekly-day-task.component';
import { areDatesEqual, getTextForStep, getTodayAtMidnightLocal, isDateBeforeToday } from '../../helpers/functions';

@Component({
  selector: 'app-weekly-tasks',
  imports: [FormsModule, CommonModule, DragDropModule, NewTaskComponent, WeeklyDayTaskComponent],
  templateUrl: './weekly-tasks.component.html',
  styleUrl: './weekly-tasks.component.scss',
  animations: [
    trigger('expandUnassignTasks', [
      state('collapsed', style({
        flex: '1.5'
      })),
      state('expanded', style({
        flex: '4'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease')
      ]),
    ])
  ]
})
export class WeeklyTasksComponent implements AfterViewInit {
  projectsService = inject(ProjectsService);
  httpService = inject(HttpService);
  @Output() selectProject = new EventEmitter<Project>();
  @ViewChildren('days') days!: QueryList<ElementRef<HTMLDivElement>>;
  projects: WritableSignal<Project[]>;
  noProject: WritableSignal<Project>;
  isDateBeforeToday = isDateBeforeToday;
  getTextForStep = getTextForStep;
  tasksWithDate: StepWithProject[] = [];
  tasksWithoutDate: StepWithProject[] = []; // without date and are active
  currentAndFutureTasks: { project: Project, steps: StepWithProject[] }[] = []; // without date, no matter if active or not
  presentedDays: WeeklyDay[] = [];
  isShowingNewSteps: boolean[] = [];
  showAllTasks = false;
  deltaDays: number = 0; // used to show previous or next week
  isDraggingTaskToProjects = false;
  isDragging = { dragging: false };

  constructor() {
    this.projects = this.projectsService.getActiveProjects();
    this.noProject = this.projectsService.getNoProject();
    effect(() => {
      void this.projects();
      this.initTasks();
    });
  }

  ngAfterViewInit(): void {
    this.initPresentedDays();
    setTimeout(() => {
      const width = this.days.first.nativeElement.offsetWidth;
      document.documentElement.style.setProperty('--task-width', `${width - 30}px`);
    }, 1);
  }

  get allDropListIds(): string[] {
    const ids = this.presentedDays.map((_, i) => `day-${i}`);
    const noDateIds = this.currentAndFutureTasks.map((p) => p.project?.id ?? 'project');
    return [...ids, ...noDateIds, 'unAssigned'];
  }

  get daysDropListsIds() {
    const ids = this.presentedDays.map((_, i) => `day-${i}`);
    return ids;
  }

  dropPredicateFor(day: any) {
    return () => {
      return !this.isDateBeforeToday(day.date);
    };
  }

  prevWeek() {
    this.deltaDays -= 7;
    this.initPresentedDays();
  }

  nextWeek() {
    this.deltaDays += 7;
    this.initPresentedDays();
  }

  initTasks() {
    const lists = this.projectsService.populateCalendarTasks();
    this.tasksWithDate = lists.tasksWithDate;
    this.tasksWithoutDate = lists.tasksWithoutDate;
    this.currentAndFutureTasks = lists.currentAndFutureTasks;
    this.tasksWithDate = this.tasksWithDate.sort((a, b) => this.sortSteps(a, b));
  }

  initPresentedDays() {
    setTimeout(() => {
      this.presentedDays = [];
      const now = new Date();
      const currentDay = new Date(now);
      currentDay.setDate(now.getDate() - now.getDay());
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentDay);
        day.setDate(currentDay.getDate() + i + this.deltaDays);
        const weeklyDay = new WeeklyDay();
        weeklyDay.date = day;
        this.presentedDays.push(weeklyDay);
      }

      const sunday = new Date();
      sunday.setDate(sunday.getDate() - sunday.getDay() + this.deltaDays);
      const saturday = new Date();
      saturday.setDate(saturday.getDate() - saturday.getDay() + 6 + this.deltaDays);

      this.assignTasksToDays();

      this.httpService.getRetainerSteps(sunday, saturday).subscribe((retainerSteps) => {
        if (retainerSteps.length > 0) {
          this.projectsService.addStepsToActiveProjects(retainerSteps);
        }
        const lists = this.projectsService.populateCalendarTasks();
        this.tasksWithDate = lists.tasksWithDate.sort((a, b) => this.sortSteps(a, b));
        this.tasksWithoutDate = lists.tasksWithoutDate;
        this.currentAndFutureTasks = lists.currentAndFutureTasks;
        this.presentedDays.forEach((d) => (d.steps = []));
        this.assignTasksToDays();
      });
    }, 1);
  }

  assignTasksToDays() {
    this.tasksWithDate = this.tasksWithDate.sort((a, b) => this.sortSteps(a, b));
    this.tasksWithDate.forEach(stepWithProject => {
      const taskDate = this.getDateForCalendarStep(stepWithProject);
      for (const day of this.presentedDays) {
        if (taskDate && this.compareDates(day.date, new Date(taskDate))) {
          day.steps.push(stepWithProject);
          return; // stop searching once we found the right day
        }
      }
    });
  }

  // generateRetainerSteps() {
  //   const sunday = new Date();
  //   sunday.setDate(sunday.getDate() - sunday.getDay() + this.deltaDays);
  //   const saturday = new Date();
  //   saturday.setDate(saturday.getDate() - saturday.getDay() + 6 + this.deltaDays);
  //   if (this.deltaDays >= 0) {
  //     this.tasksWithDate.forEach((item: StepWithProject) => {
  //       const step = item.step;
  //       if (step.isRecurring) {
  //         if (sunday.getDate() === new Date().getDate()) { // we dont want today, just future
  //           sunday.setDate(sunday.getDate() + 1);
  //         }
  //         const retainerDates = getOcurencesInRange(step, sunday, saturday);
  //         retainerDates.forEach(date => {
  //           if (step && (!step.futureModifiedTasks || !step.futureModifiedTasks.find(d => this.compareDates(d, date))) && !areDatesEqual(step.dateOnWeekly, date)) {
  //             const tempStep: Step = structuredClone(step);
  //             tempStep.id = undefined;
  //             tempStep.dateCreated = date;
  //             tempStep.dateOnWeekly = date;
  //             tempStep.isRecurring = false;
  //             tempStep.recurringEvery = undefined;
  //             tempStep.recurringDateType = undefined;
  //             tempStep.recurringDayInMonth = undefined;
  //             tempStep.recurringDaysInWeek = undefined;
  //             tempStep.isComplete = false;
  //             tempStep.positionInWeeklyList = 9999;
  //             this.tasksWithDate.push({ step: tempStep, project: item.project });
  //           }
  //         });
  //       }
  //     });
  //   }
  // }

  removeModifiedTodayRetainerSteps(): void {
    const today = getTodayAtMidnightLocal();
    this.tasksWithDate = this.tasksWithDate.filter(item => {
      const step = item.step;
      const isStepToday = areDatesEqual(step.dateOnWeekly, today);
      const isRecurrenceModifiedToday = step.futureModifiedTasks && step.futureModifiedTasks.find(d => areDatesEqual(d, today));
      return !(isStepToday && isRecurrenceModifiedToday);
    });
  }

  getDateForCalendarStep(item: StepWithProject) {
    const step = item.step;
    return step.isComplete ? step.dateCompleted : step.dateOnWeekly;
  }

  sortSteps(first: StepWithProject, second: StepWithProject): number {
    const firstPosition = first.step?.positionInWeeklyList ?? 0;
    const secondPosition = second.step?.positionInWeeklyList ?? 0;
    return firstPosition - secondPosition;
  }

  getHebrewDay(date: Date): string {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[date.getDay()];
  }

  dropTask(event: CdkDragDrop<any[]>, date?: Date) {    
    this.isDraggingTaskToProjects = false;
    const item = (event.item?.data ?? event.previousContainer.data[event.previousIndex]) as StepWithProject;
    const oldDate = item.step?.dateOnWeekly ?? new Date();

    const stepsToUpdate: Step[] = [];
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateStepsPosition(event.container.data);
    } else {
      if (!date) {
        event.currentIndex = event.container.data.length;
      }
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

      if (!item.step.dateOnWeekly) {
        item.step.positionInWeeklyList = event.currentIndex;
        this.tasksWithDate.push(item);
      } else if (!date) {
        const index = this.tasksWithDate.findIndex(t => t.step?.id === item.step.id);
        if (index !== -1) {
          this.tasksWithDate.splice(index, 1);
        }
      }
      item.step.dateOnWeekly = date;
      this.updateStepsPosition(event.container.data);
      this.updateStepsPosition(event.previousContainer.data);

      // When moving a retainer-originated step to another day, update the original retainer's futureModifiedTasks
      // if (date && item.step.originalRetainerStepId && item.project) {
      //   const originalStep = item.project.steps?.find(s => s.id === item.step.originalRetainerStepId);
      //   if (originalStep) {
      //     if (!originalStep.futureModifiedTasks) {
      //       originalStep.futureModifiedTasks = [];
      //     }
      //     originalStep.futureModifiedTasks.push(oldDate);
      //     stepsToUpdate.push(originalStep);
      //   }
      // }
    }

    this.initPresentedDays();
    this.updateSteps(event.previousContainer === event.container ? [] : event.previousContainer.data, event.container.data, stepsToUpdate);
  }

  dropTaskInProjectsList(event: CdkDragDrop<any[]>) {
    this.isDraggingTaskToProjects = false;
    if (event.previousContainer !== event.container) {
      const data: StepWithProject = event.item.data;
      let projectList = this.currentAndFutureTasks.find(p => p.project?.id === data.project?.id);
      if (!projectList && data.project) {
        projectList = { project: data.project, steps: [] };
      }

      if (projectList) {
        transferArrayItem(
          event.previousContainer.data,
          projectList.steps,
          event.previousIndex,
          projectList.steps.length
        );
        data.step.dateOnWeekly = undefined;
        data.step.positionInWeeklyList = -1;
        this.tasksWithDate.findIndex(t => t.step?.id === data.step?.id);
      }

      this.initTasks();
      this.updateStepsPosition(event.previousContainer.data);
      this.initPresentedDays();
      this.updateSteps(event.previousContainer.data, event.container.data);
    }
  }

  updateStepsPosition(list: StepWithProject[]) {
    for (let index = 0; index < list.length; index++) {
      list[index].step.positionInWeeklyList = index;
    }
  }

  updateSteps(fromList?: StepWithProject[], toList?: StepWithProject[], stepsToUpdate: Step[] = []) {
    if (fromList && fromList.length) {
      fromList.forEach(item => {
        if (!stepsToUpdate.find(s => s.id === item.step.id)) {
          stepsToUpdate.push(item.step);
        }
      });
    }

    if (toList && toList.length) {
      toList.forEach(item => {
        if (!stepsToUpdate.find(s => s.id === item.step.id)) {
          stepsToUpdate.push(item.step);
        }
      });
    }

    this.httpService.updateSteps(stepsToUpdate).subscribe(res => { });
  }

  compareDates(first: Date, second = new Date(), daysDelta = 0) {
    const castedFirst = new Date(first);
    const castedSecond = new Date(second);
    return castedFirst.getDate() + daysDelta === castedSecond.getDate() && castedFirst.getMonth() === castedSecond.getMonth() && castedFirst.getFullYear() === castedSecond.getFullYear();
  }

  createNewStep(step: Step, day: WeeklyDay) {
    step.positionInWeeklyList = day.steps.length;
    step.dateOnWeekly = day.date;
    step.projectId = this.noProject().id;
    step.stepType = StepType.task;
    this.httpService.createStep(step).subscribe(res => {
      this.noProject().steps.push(res);
      this.noProject().steps = [...this.noProject().steps];
      const newStepWithProject: StepWithProject = { step: res, project: this.noProject() };
      day.steps.push(newStepWithProject);
      this.tasksWithDate.push(newStepWithProject);
    });
  }

  updateStepText(step: Step) {
    this.httpService.updateSteps([step]).subscribe();
  }

  openProject(project?: Project) {
    if (project) {
      this.selectProject.emit(project);
    }
  }

  completeTask(item: StepWithProject, container: StepWithProject[]) {
    item.step.dateCompleted = new Date();
    const previousIndex = item.step?.positionInWeeklyList;

    if (previousIndex !== undefined) {
      moveItemInArray(container, previousIndex, 0);
      this.updateStepsPosition(container);
    }

    this.updateSteps(container);
  }
}
