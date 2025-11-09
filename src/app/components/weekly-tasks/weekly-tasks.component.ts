import { AfterViewInit, ChangeDetectorRef, Component, effect, ElementRef, EventEmitter, inject, NgZone, Output, QueryList, signal, ViewChildren, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { ProjectsService } from '../../services/projects.service';
import { StepOrTask } from '../../models/stepOrTask';
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
    // const projects = this.projects();
    // if (!projects) return;
    // this.tasksWithDate = [];
    // this.tasksWithoutDate = [];
    // this.currentAndFutureTasks = [];

    // const weeklyTasksStep = this.noProject().steps.find(s => s.name === 'weeklyTasks');
    // if (weeklyTasksStep) {
    //   weeklyTasksStep.tasks?.forEach(task => {
    //     if (task.dateOnWeekly) {
    //       this.insertTaskToList(this.tasksWithDate, weeklyTasksStep, this.noProject(), task, undefined);
    //     } else {
    //       this.insertTaskToFutueTasks(this.noProject(), weeklyTasksStep, task, undefined);
    //       this.insertTaskToList(this.tasksWithoutDate, weeklyTasksStep, this.noProject(), task, undefined);
    //     }
    //   });
    // }

    // projects.forEach(project => {
    //   project.steps.sort((a, b) => a.positionInList - b.positionInList);
    //   let foundActiveStep = false;
    //   project.steps.forEach(step => {
    //     if (step.tasks?.length) {
    //       step.tasks.forEach(task => {
    //         if (task.dateOnWeekly) {
    //           this.insertTaskToList(this.tasksWithDate, step, project, task, undefined);
    //         } else if (!task.isComplete) {
    //           this.insertTaskToFutueTasks(project, step, task, undefined);
    //           if (!foundActiveStep) { // this is the first not complete step, so its the active one
    //             this.insertTaskToList(this.tasksWithoutDate, step, project, task, undefined);
    //           }
    //         }
    //       });
    //     } else {
    //       if (step.dateOnWeekly) {
    //         this.insertTaskToList(this.tasksWithDate, step, project, undefined, step);
    //       } else if (!step.isComplete) {
    //         this.insertTaskToFutueTasks(project, step, undefined, step);
    //         if (!foundActiveStep) { // this is the first not complete step, so its the active one
    //           this.insertTaskToList(this.tasksWithoutDate, step, project, undefined, step);
    //         }
    //       }
    //     }
    //     if (!step.isComplete) foundActiveStep = true;
    //   })
    // })

    // this.tasksWithDate = this.tasksWithDate.sort((a, b) => this.sortTasksAndSteps(a, b));
    // this.tasksWithoutDate = this.tasksWithoutDate.sort((a, b) => this.sortTasksAndSteps(a, b));
  }

  //insertTaskToList(list: StepOrTask[], parentStep: Step, project?: Project, task?: StepTask, step?: Step) {
  //this.projectsService.insertTaskToList(list, parentStep, project, task, step);
  // const taskOrStep = new StepOrTask();
  // taskOrStep.task = task;
  // taskOrStep.step = step;
  // taskOrStep.parentStep = parentStep;
  // taskOrStep.project = project;
  // list.push(taskOrStep);
  //}

  // insertTaskToFutueTasks(project: Project, parentStep: Step, task?: StepTask, step?: Step) {
  //   let currentProject = this.currentAndFutureTasks.find(p => p.project.id === project.id);
  //   if (!currentProject) {
  //     currentProject = { project, tasks: [] };
  //     this.currentAndFutureTasks.push(currentProject);
  //   }
  //   this.insertTaskToList(currentProject.tasks, parentStep, currentProject.project, task, step);
  // }

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

      // this.generateRetainerSteps();
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
        if (t.step?.isRecurring) {
          if (sunday.getDate() === new Date().getDate()) { // we dont want today, just future
            sunday.setDate(sunday.getDate() + 1);
          }
          const retainerDates = getOcurencesInRange(t.step, sunday, saturday);
          retainerDates.forEach(date => {
            if (t.step) {
              const tempStep: Step = structuredClone(t.step);
              tempStep.id = undefined;
              tempStep.dateCreated = getTodayAtMidnightLocal();
              tempStep.dateOnWeekly = date;
              tempStep.isRecurring = false;
              tempStep.isComplete = false;
              tempStep.isRetainerCopy = true;
              tempStep.positionInWeeklyList = 9999;
              const tempTaskWithStep = new StepOrTask();
              tempTaskWithStep.step = tempStep;
              tempTaskWithStep.project = t.project;
              tempTaskWithStep.parentStep = t.parentStep;
              this.tasksWithDate.push(tempTaskWithStep);
            }
          });
        }
      });
    }
  }

  getDateForCalendarTask(task: StepOrTask) {
    if (task.step) {
      return task.step.isComplete ? task.step.dateCompleted : task.step.dateOnWeekly;
    } else {
      return task.task?.dateOnWeekly;
    }
  }

  sortTasksAndSteps(first: StepOrTask, second: StepOrTask): number {
    const firstPosition = first.task?.positionInWeeklyList ?? first.step?.positionInWeeklyList ?? 0;
    const secondPosition = second.task?.positionInWeeklyList ?? second.step?.positionInWeeklyList ?? 0;
    return firstPosition - secondPosition;
  }

  getHebrewDay(date: Date): string {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[date.getDay()];
  }

  dropTask(event: CdkDragDrop<any[]>, date?: Date) {
    this.isDraggingTaskToProjects = false;
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateTasksPosition(event.container.data);
    } else {
      if (!date) {
        event.currentIndex = event.container.data.length;
      }
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      const item = event.container.data[event.currentIndex];
      if (item.task) {
        if (!item.task.dateOnWeekly) {
          item.positionInWeeklyList = event.currentIndex;
          this.tasksWithDate.push(item);
        } else if (!date) {
          const index = this.tasksWithDate.findIndex(t => t.task?.id === item.task.id);
          if (index !== -1) {
            this.tasksWithDate.splice(index, 1);
          }
        }
        item.task.dateOnWeekly = date;
      } else if (item.step) {
        if (!item.step.dateOnWeekly) {
          item.positionInWeeklyList = event.currentIndex;
          this.tasksWithDate.push(item);
        } else if (!date) {
          const index = this.tasksWithDate.findIndex(t => t.step?.id === item.step.id);
          if (index !== -1) {
            this.tasksWithDate.splice(index, 1);
          }
        }
        item.step.dateOnWeekly = date;
      }

      this.updateTasksPosition(event.container.data);
      this.updateTasksPosition(event.previousContainer.data);
    }

    this.initPresentedDays();
    this.updateTasks(event.previousContainer === event.container ? [] : event.previousContainer.data, event.container.data);
    this.initTasks()
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
        if (data.task) {
          data.task.dateOnWeekly = undefined;
          data.task.positionInWeeklyList = -1;
          index = this.tasksWithDate.findIndex(t => t.task?.id === data.task?.id);
        } else if (data.step) {
          data.step.dateOnWeekly = undefined;
          data.step.positionInWeeklyList = -1;
          index = this.tasksWithDate.findIndex(t => t.task?.id === data.task?.id);
        }
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
      if (task.task) {
        task.task.positionInWeeklyList = index;
      } else {
        task.step!.positionInWeeklyList = index;
      }
    }
  }

  updateTasks(fromList?: StepOrTask[], toList?: StepOrTask[]) {
    const stepsToUpdate: Step[] = [];
    if (fromList && fromList.length) {
      fromList.forEach(taskOrStep => {
        if (!stepsToUpdate.find(s => s.id === taskOrStep.parentStep.id)) {
          if (taskOrStep.step) {
            taskOrStep.parentStep = taskOrStep.step;
          }
          stepsToUpdate.push(taskOrStep.parentStep);
        }
      });
    }

    if (toList && toList.length) {
      toList.forEach(taskOrStep => {
        if (!stepsToUpdate.find(s => s.id === taskOrStep.parentStep.id)) {
          if (taskOrStep.step) {
            taskOrStep.parentStep = taskOrStep.step;
          }
          stepsToUpdate.push(taskOrStep.parentStep);
        }
      });
    }

    this.httpService.updateSteps(stepsToUpdate).subscribe(res => { });
  }

  compareDates(first: Date, second = new Date(), daysDelta = 0) {
    return first.getDate() + daysDelta === second.getDate() && first.getMonth() === second.getMonth() && first.getFullYear() === second.getFullYear();
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
    newTask.task = task;
    newTask.parentStep = tasksStep;
    newTask.project = this.noProject();
    day.tasks.push(newTask);
    this.tasksWithDate.push(newTask);
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
    if (task.step?.isRetainerCopy) { // todo: what the hell should i do here?
      const index = container.indexOf(task);
      this.httpService.createStep(task.step).subscribe((res: Step) => {
        if (task.step) {
          this.httpService.createStep(task.step).subscribe((res: Step) => {
            if (index !== undefined && index > -1) {
              container[index].step = res;
            }
          });
        }
      });
    } else {
      let previousIndex: number | undefined = undefined;

      if (task.task) {
        if (task.task.isComplete) {
          previousIndex = task.task.positionInWeeklyList;
        }
      } else if (task.step) {
        task.step.dateCompleted = new Date();
        if (task.step.isComplete) {
          previousIndex = task.step?.positionInWeeklyList;
        }
      }

      if (previousIndex !== undefined) {
        moveItemInArray(container, previousIndex, 0)
        this.updateTasksPosition(container);
      }

      this.updateTasks(container)
    }
  }
}
