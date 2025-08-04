import { AfterViewInit, Component, effect, inject, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { ProjectsService } from '../../services/projects.service';
import { StepOrTask } from '../../models/stepOrTask';
import { WeeklyDay } from '../../models/weeklyDay';
import { StepType } from '../../models/enums';
import { StepTask } from '../../models/stepTask';
import { Step } from '../../models/step';

@Component({
  selector: 'app-weekly-tasks',
  imports: [],
  templateUrl: './weekly-tasks.component.html',
  styleUrl: './weekly-tasks.component.scss'
})
export class WeeklyTasksComponent implements AfterViewInit {
  projectsService = inject(ProjectsService);
  projects: WritableSignal<Project[] | undefined>;
  tasksWithDate: StepOrTask[] = [];
  tasksWithoutDate: StepOrTask[] = []; // without date and are active
  currentAndFutureTasks: { project: Project, tasks: StepOrTask[] }[] = []; // without date, no matter if active or not
  presentedDays: WeeklyDay[] = [];
  showAllTasks: boolean = false;

  constructor() {
    this.projects = this.projectsService.getActiveProjects();
    effect(() => {
      this.initTasks();
    })
  }

  ngAfterViewInit(): void {
  }

  prevWeek() {

  }

  nextWeek() {

  }

  initTasks() {
    const projects = this.projects();
    if (!projects) return;
    this.tasksWithDate = [];
    this.tasksWithoutDate = [];
    this.currentAndFutureTasks = [];

    projects.forEach(project => {
      project.steps.sort((a, b) => a.positionInList - b.positionInList);
      let foundActiveStep = false;
      project.steps.forEach(step => {
        if (step.stepType === StepType.task) {
          if (step.tasks?.length) {
            step.tasks.forEach(task => {
              if (task.dateOnWeekly) {
                this.insertTaskToList(this.tasksWithDate, step, task, undefined);
              } else if (!task.isComplete) {
                this.insertTaskToFutueTasks(project, step, task, undefined);
                if (!foundActiveStep) { // this is the first not complete step, so its the active one
                  this.insertTaskToList(this.tasksWithoutDate, step, task, undefined);
                }
              }
            });
          } else {
            if (step.dateOnWeekly) {
              this.insertTaskToList(this.tasksWithDate, step, undefined, step);
            } else if (!step.isComplete) {
              this.insertTaskToFutueTasks(project, step, undefined, step);
              if (!foundActiveStep) { // this is the first not complete step, so its the active one
                this.insertTaskToList(this.tasksWithoutDate, step, undefined, step);
              }
            }
          }
        }
        if (!step.isComplete) foundActiveStep = true;
      })
    })

    this.tasksWithDate = this.tasksWithDate.sort((a, b) => this.sortTasksAndSteps(a, b));
    this.tasksWithoutDate = this.tasksWithoutDate.sort((a, b) => this.sortTasksAndSteps(a, b));
    this.initPresentedDays();
  }

  insertTaskToList(list: StepOrTask[], parentStep: Step, task?: StepTask, step?: Step) {
    const taskOrStep = new StepOrTask();
    taskOrStep.task = task;
    taskOrStep.step = step;
    taskOrStep.parentStep = parentStep;
    list.push(taskOrStep);
  }

  insertTaskToFutueTasks(project: Project, parentStep: Step, task?: StepTask, step?: Step) {
    let currentProject = this.currentAndFutureTasks.find(p => p.project.id === project.id);
    if (!currentProject) {
      currentProject = { project, tasks: [] };
      this.currentAndFutureTasks.push({ project, tasks: [] });
    }
    this.insertTaskToList(currentProject.tasks, parentStep, task, step);
  }

  initPresentedDays(deltaDays: number = 0) {
    this.presentedDays = [];
    const now = new Date();
    const currentDay = new Date(now);
    currentDay.setDate(now.getDate() - now.getDay());
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentDay);
      day.setDate(currentDay.getDate() + i + deltaDays);
      const weeklyDay = new WeeklyDay();
      weeklyDay.date = day;
      this.presentedDays.push(weeklyDay);
    }
  }

  sortTasksAndSteps(first: StepOrTask, second: StepOrTask): number {
    const firstPosition = first.task?.positionInWeeklyList ?? first.step?.positionInWeeklyList ?? 0;
    const secondPosition = second.task?.positionInWeeklyList ?? second.step?.positionInWeeklyList ?? 0;
    return firstPosition - secondPosition;
  }

  updatePositionInList() {
    // update position in list of tasks
    // this is used to sort tasks in the UI
  }

  showHideAllTasks() {
    this.showAllTasks = !this.showAllTasks;
  }
}
