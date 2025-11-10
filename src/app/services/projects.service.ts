import { inject, Injectable, Signal, signal } from '@angular/core';
import { HttpService } from './http.service';
import { Project } from '../models/project';
import { StepOrTask } from '../models/stepOrTask';
import { Step } from '../models/step';
import { StepTask } from '../models/stepTask';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  httpService = inject(HttpService);
  activeProjects = signal<Project[]>([]);
  unActiveProjects = signal<Project[]>([]);
  noProject = signal<Project>(new Project());
  currentProject = signal<Project>(new Project())
  tasksWithDate: StepOrTask[] = [];
  tasksWithoutDate: StepOrTask[] = [];
  currentAndFutureTasks: { project: Project, tasks: StepOrTask[] }[] = []; // without date, no matter if active or not
  projectWithOpenNotes = signal<Project | undefined>(undefined);

  getActiveProjects() {
    return this.activeProjects;
  }

  getUnActiveProjects() {
    return this.unActiveProjects;
  }

  getNoProject() {
    return this.noProject;
  }

  getCurrentProject() {
    return this.currentProject;
  }

  getProjectWithOpenNotes() {
    return this.projectWithOpenNotes;
  }

  populateCalendarTasks() {
    const projects = this.activeProjects();
    this.tasksWithDate = [];
    this.tasksWithoutDate = [];
    this.currentAndFutureTasks = [];

    const weeklyTasksStep = this.noProject().steps.find(s => s.name === 'weeklyTasks');
    if (weeklyTasksStep) {
      weeklyTasksStep.tasks?.forEach(task => {
        if (task.dateOnWeekly) {
          this.insertTaskToList(this.tasksWithDate, weeklyTasksStep, this.noProject(), task, undefined);
        } else {
          this.insertTaskToFutueTasks(this.noProject(), weeklyTasksStep, task, undefined);
          this.insertTaskToList(this.tasksWithoutDate, weeklyTasksStep, this.noProject(), task, undefined);
        }
      });
    }

    projects.forEach(project => {
      project.steps.sort((a, b) => a.positionInList - b.positionInList);
      let foundActiveStep = false;
      project.steps.forEach(step => {
        if (step.tasks?.length) {
          step.tasks.forEach(task => {
            if (task.dateOnWeekly) {
              this.insertTaskToList(this.tasksWithDate, step, project, task, undefined);
            } else if (!task.isComplete) {
              this.insertTaskToFutueTasks(project, step, task, undefined);
              if (!foundActiveStep) { // this is the first not complete step, so its the active one
                this.insertTaskToList(this.tasksWithoutDate, step, project, task, undefined);
              }
            }
          });
        } else {
          if (step.dateOnWeekly) {
            this.insertTaskToList(this.tasksWithDate, step, project, undefined, step);
          } else if (!step.isComplete) {
            this.insertTaskToFutueTasks(project, step, undefined, step);
            if (!foundActiveStep) { // this is the first not complete step, so its the active one
              this.insertTaskToList(this.tasksWithoutDate, step, project, undefined, step);
            }
          }
        }
        if (!step.isComplete) foundActiveStep = true;
      })
    })

    this.tasksWithDate = this.tasksWithDate.sort((a, b) => this.sortTasksAndSteps(a, b));
    this.tasksWithoutDate = this.tasksWithoutDate.sort((a, b) => this.sortTasksAndSteps(a, b));
    return { tasksWithDate: this.tasksWithDate, tasksWithoutDate: this.tasksWithoutDate, currentAndFutureTasks: this.currentAndFutureTasks };
  }

  insertTaskToList(list: StepOrTask[], parentStep: Step, project?: Project, task?: StepTask, step?: Step) {
    const taskOrStep = new StepOrTask();
    taskOrStep.task = task;
    taskOrStep.step = step;
    taskOrStep.parentStep = parentStep;
    taskOrStep.project = project;
    list.push(taskOrStep);
  }

  insertTaskToFutueTasks(project: Project, parentStep: Step, task?: StepTask, step?: Step) {
    let currentProject = this.currentAndFutureTasks.find(p => p.project?.id === project.id);
    if (!currentProject) {
      currentProject = { project, tasks: [] };
      this.currentAndFutureTasks.push(currentProject);
    }
    this.insertTaskToList(currentProject.tasks, parentStep, currentProject.project, task, step);
  }

  sortTasksAndSteps(first: StepOrTask, second: StepOrTask): number {
    const firstPosition = first.task?.positionInWeeklyList ?? first.step?.positionInWeeklyList ?? 0;
    const secondPosition = second.task?.positionInWeeklyList ?? second.step?.positionInWeeklyList ?? 0;
    return firstPosition - secondPosition;
  }
}
