import { inject, Injectable, Signal, signal } from '@angular/core';
import { HttpService } from './http.service';
import { Project } from '../models/project';
import { Step } from '../models/step';
import { StepWithProject } from '../models/step-with-project';
import { areDatesEqual, getTodayAtMidnightLocal } from '../helpers/functions';
import { projectTypeEnum } from '../models/enums';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  httpService = inject(HttpService);
  activeProjects = signal<Project[]>([]);
  unActiveProjects = signal<Project[]>([]);
  noProject = signal<Project>(new Project());
  currentProject = signal<Project>(new Project())
  tasksWithDate: StepWithProject[] = [];
  tasksWithoutDate: StepWithProject[] = [];
  currentAndFutureTasks: { project: Project, steps: StepWithProject[] }[] = []; // without date, no matter if active or not
  projectWithOpenNotes = signal<Project | undefined>(undefined);
  currentProjectFilter = signal<projectTypeEnum | undefined>(undefined); 

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

    // const weeklyTasksStep = this.noProject().steps.find(s => s.name === 'weeklyTasks');
    // if (weeklyTasksStep) {
    //   weeklyTasksStep.tasks?.forEach(task => {
    //     if (task.dateOnWeekly) {
    //       this.insertTaskToList(this.tasksWithDate, weeklyTasksStep, task, this.noProject());
    //     } else {
    //       this.insertTaskToFutueTasks(this.noProject(), weeklyTasksStep, task);
    //       this.insertTaskToList(this.tasksWithoutDate, weeklyTasksStep, task, this.noProject());
    //     }
    //   });
    // }

    projects.forEach(project => {
      project.steps.sort((a, b) => a.positionInList - b.positionInList);
      let foundActiveStep = false;
      project.steps.forEach(step => {
        if (step.dateOnWeekly) {
          this.insertStepToList(this.tasksWithDate, step, project);
        } else if (!step.isComplete) {
          this.insertStepToFutureTasks(project, step);
          if (!foundActiveStep) {
            this.insertStepToList(this.tasksWithoutDate, step, project);
          }
        }
        if (!step.isComplete) foundActiveStep = true;
      })
    })

    this.tasksWithDate = this.tasksWithDate.sort((a, b) => this.sortSteps(a, b));
    this.tasksWithoutDate = this.tasksWithoutDate.sort((a, b) => this.sortSteps(a, b));
    return { tasksWithDate: this.tasksWithDate, tasksWithoutDate: this.tasksWithoutDate, currentAndFutureTasks: this.currentAndFutureTasks };
  }

  addStepToProject(projectId: string, step: Step) {
    const project = this.activeProjects().find(p => p.id === projectId) || this.unActiveProjects().find(p => p.id === projectId);
    if (project) project.steps.push(step);
  }

  insertStepToList(list: StepWithProject[], step: Step, project?: Project) {
    list.push({ step, project });
  }

  insertStepToFutureTasks(project: Project, step: Step) {
    let currentProject = this.currentAndFutureTasks.find(p => p.project?.id === project.id);
    if (!currentProject) {
      currentProject = { project, steps: [] };
      this.currentAndFutureTasks.push(currentProject);
    }
    this.insertStepToList(currentProject.steps, step, currentProject.project);
  }

  sortSteps(first: StepWithProject, second: StepWithProject): number {
    const firstPosition = first.step.positionInWeeklyList ?? 0;
    const secondPosition = second.step.positionInWeeklyList ?? 0;
    return firstPosition - secondPosition;
  }
}
