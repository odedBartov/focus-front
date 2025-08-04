import { AfterViewInit, Component, effect, inject, WritableSignal } from '@angular/core';
import { Project } from '../../models/project';
import { ProjectsService } from '../../services/projects.service';
import { StepOrTask } from '../../models/stepOrTask';
import { WeeklyDay } from '../../models/weeklyDay';
import { StepType } from '../../models/enums';
import { StepTask } from '../../models/stepTask';
import { Step } from '../../models/step';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weekly-tasks',
  imports: [FormsModule, CommonModule],
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
  deltaDays: number = 0; // used to show previous or next week

  constructor() {
    this.projects = this.projectsService.getActiveProjects();
    effect(() => {
      this.initTasks();
    })
  }

  ngAfterViewInit(): void {
    this.initTasks();
    console.log(this.tasksWithDate);

    this.initPresentedDays();
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

  initPresentedDays() {
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

    this.assignTasksToDays();
  }

  assignTasksToDays() {
    this.tasksWithDate.forEach(taskOrStep => {
      const taskDate = taskOrStep.task?.dateOnWeekly || taskOrStep.step?.dateOnWeekly;
      for (const day of this.presentedDays) {
        if (taskDate && day.date.toDateString() === taskDate.toDateString()) {
          day.tasks.push(taskOrStep);
          return; // stop searching once we found the right day
        }
      }
    });
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

  updatePositionInList() {
    // update position in list of tasks
    // this is used to sort tasks in the UI
  }

  showHideAllTasks() {
    this.showAllTasks = !this.showAllTasks;
  }
}
