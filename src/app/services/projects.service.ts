import { inject, Injectable, Signal, signal } from '@angular/core';
import { HttpService } from './http.service';
import { Project } from '../models/project';
import { IStepOrTask, StepOrTask } from '../models/stepOrTask';
import { Step } from '../models/step';
import { areDatesEqual, getTodayAtMidnightLocal } from '../helpers/functions';

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
          this.insertTaskToList(this.tasksWithDate, weeklyTasksStep, task, this.noProject());
        } else {
          this.insertTaskToFutueTasks(this.noProject(), weeklyTasksStep, task);
          this.insertTaskToList(this.tasksWithoutDate, weeklyTasksStep, task, this.noProject());
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
              this.insertTaskToList(this.tasksWithDate, step, task, project);
            } else if (!task.isComplete) {
              this.insertTaskToFutueTasks(project, step, task);
              if (!foundActiveStep) { // this is the first not complete step, so its the active one
                this.insertTaskToList(this.tasksWithoutDate, step, task, project);
              }
            }
          });
        } else {
          if (step.dateOnWeekly) {
            this.insertTaskToList(this.tasksWithDate, step, step, project);
          } else if (!step.isComplete) {
            this.insertTaskToFutueTasks(project, step, step);
            if (!foundActiveStep) { // this is the first not complete step, so its the active one
              this.insertTaskToList(this.tasksWithoutDate, step, step, project);
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

  addStepToProject(projectId: string, step: Step) {
    const project = this.activeProjects().find(p => p.id === projectId) || this.unActiveProjects().find(p => p.id === projectId);
    if (project) project.steps.push(step);
  }


  insertTaskToList(list: StepOrTask[], parentStep: Step, data: IStepOrTask, project?: Project) {
    const taskOrStep = new StepOrTask();
    taskOrStep.data = data;
    taskOrStep.parentStep = parentStep;
    taskOrStep.project = project;
    list.push(taskOrStep);
  }

  insertTaskToFutueTasks(project: Project, parentStep: Step, data: IStepOrTask) {
    let currentProject = this.currentAndFutureTasks.find(p => p.project?.id === project.id);
    if (!currentProject) {
      currentProject = { project, tasks: [] };
      this.currentAndFutureTasks.push(currentProject);
    }
    this.insertTaskToList(currentProject.tasks, parentStep, data, currentProject.project);
  }

  sortTasksAndSteps(first: StepOrTask, second: StepOrTask): number {
    const firstPosition = first.data.positionInWeeklyList ?? 0;
    const secondPosition = second.data.positionInWeeklyList ?? 0;
    return firstPosition - secondPosition;
  }
}
