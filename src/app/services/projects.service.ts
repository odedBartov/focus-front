import { inject, Injectable, Signal, signal } from '@angular/core';
import { HttpService } from './http.service';
import { Project } from '../models/project';
import { Step } from '../models/step';
import { StepWithProject } from '../models/step-with-project';
import { areDatesEqual, getTodayAtMidnightLocal } from '../helpers/functions';
import { projectTypeEnum, recurringDateTypeEnum } from '../models/enums';

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

  getNextOccurrenceDate(step: Step): Date {
    let result = new Date();
    if (step.isRecurring && step.recurringDateType != null) {
      switch (step.recurringDateType) {
        case recurringDateTypeEnum.day:
          break;
        case recurringDateTypeEnum.week:
          while (!step.recurringDaysInWeek?.includes(result.getDay())) {
            result.setDate(result.getDate() + 1);
          }
          break;
        case recurringDateTypeEnum.month:
          while (result.getDate() != step.recurringDayInMonth) {
            result.setDate(result.getDate() + 1);
          }
          break;
      }
    }
    result.setHours(12, 0, 0, 0);
    return result;
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
        if (!step.isRecurring) {
          if (step.dateOnWeekly) {
            this.insertStepToList(this.tasksWithDate, step, project);
          } else if (!step.isComplete) {
            this.insertStepToFutureTasks(project, step);
            if (!foundActiveStep) {
              this.insertStepToList(this.tasksWithoutDate, step, project);
            }
          }
          if (!step.isComplete) foundActiveStep = true;
        }
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

  addStepsToActiveProjects(steps: Step[]) {
    this.activeProjects.update(projects => {
      if (projects.length === 0) {
        return projects;
      }
      const projectMap = new Map<string, Project>();
      projects.forEach(p => {
        if (p.id) {
          projectMap.set(p.id, { ...p, steps: [...(p.steps ?? [])] });
        }
      });
      steps.forEach(step => {
        if (!step.projectId) return;
        const project = projectMap.get(step.projectId);
        if (project) {
          const originalStep = project.steps.find(s => s.id === step.originalRetainerStepId);
          if (originalStep) {
            if (!originalStep.createdStepsFromRetainer) {
              originalStep.createdStepsFromRetainer = [];
            }
            if (!originalStep.createdStepsFromRetainer.includes(step.id ?? '')) {
              originalStep.createdStepsFromRetainer.push(step.id ?? '');
            }
          }
          const newSteps = [...(project.steps ?? []), step].sort((a, b) => a.positionInList - b.positionInList);
          projectMap.set(step.projectId, { ...project, steps: newSteps });
        }
      });
      const nextProjects = projects.map(p => {
        const updated = p.id ? projectMap.get(p.id) : undefined;
        if (updated) return updated;
        return { ...p, steps: [...(p.steps ?? [])] };
      });
      const currentId = this.currentProject()?.id;
      if (currentId) {
        const updatedCurrent = nextProjects.find(pr => pr.id === currentId);
        if (updatedCurrent) {
          this.currentProject.set(updatedCurrent);
        }
      }
      return nextProjects;
    });

    this.currentProject.set({...this.currentProject()});
  }

  deleteStepsFromProject(stepIds: string[], projectId: string) {    
    this.activeProjects.update(projects => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        project.steps = project.steps.filter(s => s.id && !stepIds.includes(s.id));
      }
      return projects;
    });
  }
}
