import { AfterViewInit, ChangeDetectorRef, Component, effect, ElementRef, EventEmitter, inject, NgZone, Output, QueryList, signal, ViewChildren, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { ProjectsService } from '../../services/projects.service';
import { isStep, StepOrTask } from '../../models/stepOrTask';
import { WeeklyDay } from '../../models/weeklyDay';
import { StepType } from '../../models/enums';
import { StepTask } from '../../models/stepTask';
import { Step } from '../../models/step';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { HttpService } from '../../services/http.service';
import { NewTaskComponent } from '../new-task/new-task.component';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { WeeklyDayTaskComponent } from '../weekly-day-task/weekly-day-task.component';
import { getTextForTask, getTodayAtMidnightLocal, isDateBeforeToday } from '../../helpers/functions';
import { getOcurencesInRange } from '../../helpers/retainerFunctions';
import { FutureRetainerStep } from '../../services/futureRetainerStep';

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
  getTextForTask = getTextForTask;
  tasksWithDate: StepOrTask[] = [];
  tasksWithoutDate: StepOrTask[] = []; // without date and are active
  currentAndFutureTasks: { project: Project, tasks: StepOrTask[] }[] = []; // without date, no matter if active or not
  presentedDays: WeeklyDay[] = [];
  isShowingNewSteps: boolean[] = [];
  showAllTasks = false;
  deltaDays: number = 0; // used to show previous or next week
  isDraggingTaskToProjects = false;
  isDragging = { dragging: false };

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    this.projects = this.projectsService.getActiveProjects();
    this.noProject = this.projectsService.getNoProject();
    effect(() => {
      this.initTasks();
    })
  }

  ngAfterViewInit(): void {
    this.initPresentedDays();
    this.ngZone.onStable.asObservable().pipe().subscribe(() => {
      setTimeout(() => {
        const width = this.days.first.nativeElement.offsetWidth;
        document.documentElement.style.setProperty('--task-width', `${width - 30}px`);
      }, 1);
    });
  }

  get allDropListIds(): string[] {
    const ids = this.presentedDays.map((_, i) => `day-${i}`);
    const noDateIds = this.currentAndFutureTasks.map((p) => p.project.id ?? 'project');
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
    this.tasksWithDate = this.tasksWithDate.sort((a, b) => this.sortTasksAndSteps(a, b));
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

      this.tasksWithDate = this.tasksWithDate.filter(t => !(isStep(t.data) && t.data.isRetainerCopy));
      this.generateRetainerSteps();
      this.assignTasksToDays();
    }, 1);
  }

  assignTasksToDays() {
    this.tasksWithDate = this.tasksWithDate.sort((a, b) => this.sortTasksAndSteps(a, b));
    this.tasksWithDate.forEach(taskOrStep => {
      const taskDate = this.getDateForCalendarTask(taskOrStep);
      for (const day of this.presentedDays) {
        if (taskDate && this.compareDates(day.date, new Date(taskDate))) {
          day.tasks.push(taskOrStep);
          return; // stop searching once we found the right day
        }
      }
    });
  }

  generateRetainerSteps() {
    const sunday = new Date();
    sunday.setDate(sunday.getDate() - sunday.getDay() + this.deltaDays);
    const saturday = new Date();
    saturday.setDate(saturday.getDate() - saturday.getDay() + 6 + this.deltaDays);
    if (this.deltaDays >= 0) {
      this.tasksWithDate.forEach((t: StepOrTask) => {
        if (isStep(t.data)) {
          const castedStep = t.data as Step;
          if (castedStep.isRecurring) {
            if (sunday.getDate() === new Date().getDate()) { // we dont want today, just future
              sunday.setDate(sunday.getDate() + 1);
            }
            const retainerDates = getOcurencesInRange(castedStep, sunday, saturday);
            retainerDates.forEach(date => {
              if (castedStep && (!castedStep.futureModifiedTasks || !castedStep.futureModifiedTasks.find(d => this.compareDates(d, date)))) {
                const tempStep: Step = structuredClone(castedStep);
                tempStep.id = undefined;
                tempStep.dateCreated = date;
                tempStep.dateOnWeekly = date;
                tempStep.isRecurring = false;
                tempStep.isComplete = false;
                tempStep.isRetainerCopy = true;
                tempStep.positionInWeeklyList = 9999;
                tempStep.originalRetainerStep = castedStep;
                const tempTaskWithStep = new StepOrTask();
                tempTaskWithStep.data = tempStep;
                tempTaskWithStep.project = t.project;
                tempTaskWithStep.parentStep = t.parentStep;
                this.tasksWithDate.push(tempTaskWithStep);
              }
            });
          }
        }
      });
    }
  }

  getDateForCalendarTask(task: StepOrTask) {
    if (isStep(task.data)) {
      const castedStep = task.data as Step;
      return castedStep.isComplete ? castedStep.dateCompleted : castedStep.dateOnWeekly;
    } else {
      return task.data?.dateOnWeekly;
    }
  }

  sortTasksAndSteps(first: StepOrTask, second: StepOrTask): number {
    const firstPosition = first.data?.positionInWeeklyList ?? 0;
    const secondPosition = second.data?.positionInWeeklyList ?? 0;
    return firstPosition - secondPosition;
  }

  getHebrewDay(date: Date): string {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[date.getDay()];
  }

  dropTask(event: CdkDragDrop<any[]>, date?: Date) {
    let isFutureRetainer = false;
    this.isDraggingTaskToProjects = false;
    const item = (event.item?.data ?? event.previousContainer.data[event.previousIndex]) as StepOrTask//event.container.data[event.currentIndex] as StepOrTask;
    const oldDate = item.data?.dateOnWeekly ?? new Date();
    if (isStep(item.data) && item.data.isRetainerCopy) {
      item.data.futureModifiedTasks = undefined;
      item.data.isRecurring = false;
      item.data.isRetainerCopy = false;
      // create the step
      isFutureRetainer = true;
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      item.data.positionInWeeklyList = event.currentIndex;
      this.httpService.createStep(item.data).subscribe((res: Step) => {
        const stepsToUpdate: Step[] = [];
        if (isStep(item.data) && item.data.originalRetainerStep) {
          if (!item.data.originalRetainerStep?.futureModifiedTasks) {
            item.data.originalRetainerStep.futureModifiedTasks = [];
          }
          item.data.originalRetainerStep.futureModifiedTasks.push(oldDate);
          stepsToUpdate.push(item.data.originalRetainerStep);
        }

        item.data = res;
        if (res.projectId) {
          this.projectsService.addStepToProject(res.projectId, res);
        }

        this.initPresentedDays();
        this.updateTasks(event.previousContainer === event.container ? [] : event.previousContainer.data, event.container.data, stepsToUpdate);
        this.projectsService.addStepToProject(item.project?.id ?? '', item.data as Step);
      });
    } else {
      if (event.previousContainer === event.container) {
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        this.updateTasksPosition(event.container.data);
      } else {
        if (!date) {
          event.currentIndex = event.container.data.length;
        }
        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);

        if (!item.data.dateOnWeekly) {
          item.data.positionInWeeklyList = event.currentIndex;
          this.tasksWithDate.push(item);
        } else if (!date) {
          const index = this.tasksWithDate.findIndex(t => t.data?.id === item.data.id);
          if (index !== -1) {
            this.tasksWithDate.splice(index, 1);
          }
        }
        item.data.dateOnWeekly = date;
        this.updateTasksPosition(event.container.data);
        this.updateTasksPosition(event.previousContainer.data);
      }
    }

    if (!isFutureRetainer) {
      this.initPresentedDays();
      this.updateTasks(event.previousContainer === event.container ? [] : event.previousContainer.data, event.container.data);
      this.initTasks()
    }
  }

  dropTaskInProjectsList(event: CdkDragDrop<any[]>) {
    this.isDraggingTaskToProjects = false;
    if (event.previousContainer !== event.container) {
      const data: StepOrTask = event.item.data;
      let projectList = this.currentAndFutureTasks.find(p => p.project.id === data.project?.id);
      if (!projectList && data.project) {
        projectList = { project: data.project, tasks: [] };
      }

      if (projectList) {
        transferArrayItem(
          event.previousContainer.data,
          projectList.tasks,
          event.previousIndex - 1,
          projectList.tasks.length
        );
        let index = -1;
        // if (data.task) {
        //   data.task.dateOnWeekly = undefined;
        //   data.task.positionInWeeklyList = -1;
        //   index = this.tasksWithDate.findIndex(t => t.task?.id === data.task?.id);
        // } else if (data.step) {
        //   data.step.dateOnWeekly = undefined;
        //   data.step.positionInWeeklyList = -1;
        //   index = this.tasksWithDate.findIndex(t => t.task?.id === data.task?.id);
        // }
        data.data.dateOnWeekly = undefined;
        data.data.positionInWeeklyList = -1;
        index = this.tasksWithDate.findIndex(t => t.data?.id === data.data?.id);
      }

      this.initTasks();
      this.updateTasksPosition(event.previousContainer.data);
      this.initPresentedDays();
      this.updateTasks(event.previousContainer.data, event.container.data);
    }
  }

  updateTasksPosition(list: StepOrTask[]) {
    for (let index = 0; index < list.length; index++) {
      const task = list[index];
      task.data.positionInWeeklyList = index;
      // if (task.task) {
      //   task.task.positionInWeeklyList = index;
      // } else {
      //   task.step!.positionInWeeklyList = index;
      // }
    }
  }

  updateTasks(fromList?: StepOrTask[], toList?: StepOrTask[], stepsToUpdate: Step[] = []) {
    if (fromList && fromList.length) {
      fromList.forEach(taskOrStep => {
        if (!stepsToUpdate.find(s => s.id === taskOrStep.parentStep.id)) {
          if (isStep(taskOrStep.data)) {
            taskOrStep.parentStep = taskOrStep.data;
          }
          stepsToUpdate.push(taskOrStep.parentStep);
        }
      });
    }

    if (toList && toList.length) {
      toList.forEach(taskOrStep => {
        if (!stepsToUpdate.find(s => s.id === taskOrStep.parentStep.id)) {
          if (isStep(taskOrStep.data)) {
            taskOrStep.parentStep = taskOrStep.data;
          }
          stepsToUpdate.push(taskOrStep.parentStep);
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

  createNewTask(task: StepTask, day: WeeklyDay) {
    task.positionInWeeklyList = day.tasks.length;
    task.dateOnWeekly = day.date;
    let tasksStep = this.noProject().steps.find(s => s.name === 'weeklyTasks');
    if (!tasksStep) {
      tasksStep = new Step();
      tasksStep.projectId = this.noProject().id;
      tasksStep.name = 'weeklyTasks';
      tasksStep.stepType = StepType.task;
      tasksStep.tasks = [task];
      this.noProject().steps.push(tasksStep);
      this.noProject().steps = [...this.noProject().steps];
      this.httpService.createStep(tasksStep).subscribe(res => {
        if (tasksStep) {
          tasksStep.id = res.id;
        }
      });
    } else {
      tasksStep.tasks?.push(task);
      this.httpService.updateSteps([tasksStep]).subscribe(res => { });
    }
    const newTask = new StepOrTask();
    newTask.data = task;
    newTask.parentStep = tasksStep;
    newTask.project = this.noProject();
    day.tasks.push(newTask);
    this.tasksWithDate.push(newTask);
  }

  createFutureRetainerStep(modifiedStep: FutureRetainerStep) {
    // create the new step
    modifiedStep.newStep.isRetainerCopy = false;
    modifiedStep.newStep.dateCompleted = modifiedStep.newStep.dateOnWeekly;
    modifiedStep.newStep.futureModifiedTasks = [];
    this.httpService.createStep(modifiedStep.newStep).subscribe(res => {
      modifiedStep.newStep = res;
      this.projectsService.addStepToProject(modifiedStep.newStep.projectId ?? '', modifiedStep.newStep);
    });

    // update original retainer
    if (modifiedStep.newStep.originalRetainerStep) {
      if (!modifiedStep.newStep.originalRetainerStep.futureModifiedTasks) {
        modifiedStep.newStep.originalRetainerStep.futureModifiedTasks = [];
      }
      modifiedStep.newStep.originalRetainerStep.futureModifiedTasks.push(modifiedStep.modifiedDate);
      this.httpService.updateSteps([modifiedStep.newStep.originalRetainerStep]).subscribe(res => { });
    }
  }

  updateTaskText(task: StepTask, step: Step) {
    if (step.tasks) {
      const index = step.tasks.findIndex(t => t.id === task.id);
      if (index > -1) {
        step.tasks[index] = task;
        this.httpService.updateSteps([step]).subscribe();
      }
    }
  }

  openProject(project?: Project) {
    if (project) {
      this.selectProject.emit(project);
    }
  }

  completeTask(task: StepOrTask, container: StepOrTask[]) {
    let previousIndex: number | undefined = undefined;
    if (isStep(task.data)) {
      task.data.dateCompleted = new Date();
    }
    previousIndex = task.data?.positionInWeeklyList;

    if (previousIndex !== undefined) {
      moveItemInArray(container, previousIndex, 0)
      this.updateTasksPosition(container);
    }

    this.updateTasks(container)
  }
}
