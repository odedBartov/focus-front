import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Project } from '../models/project';
import { UserProjects } from '../models/userProjects';
import { Step } from '../models/step';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  projects = new UserProjects();

  constructor() {
    const p1 = new Project();
    p1.id = "111";
    p1.name = 'פרויקט ראשון';
    p1.description = 'פה יש הסבר על הפרויקט';
    p1.progress = 17;

    const p2 = new Project();
    p2.id = "222";
    p2.name = 'פרויקט שני';
    p2.description = 'סתם טקסט של תיאור';
    p2.progress = 80

    const p3 = new Project();
    p3.id = "333";
    p3.name = 'פרויקט שלישי';
    p3.description = 'זה פרויקט מוקפא';

    const p4 = new Project();
    p4.id = "444";
    p4.name = 'פרויקט רביעי';
    p4.description = 'זה סתם עוד פרויקט שהסתיים';
    p4.progress = 100;

    this.projects.activeProjects = [p1, p2];
    this.projects.frozenProjects = [p3];
    this.projects.finishedProjects = [p4];
  }

  getProjects(): Observable<UserProjects> {
    return of(this.projects);
  }

  getProject(projectId: string) {
    const projects = this.projects.activeProjects.concat(this.projects.finishedProjects).concat(this.projects.frozenProjects);
    const res = projects.find(p => p.id === projectId);
    return of(res);
  }

  createStep(project: Project, step: Step): Observable<Step> {
    const currentPrpoject = this.projects.activeProjects.find(p => p.id == project.id);
    if (currentPrpoject) {
      currentPrpoject.steps.push(step);
    }

    return of(step);
  }

  updateStep(project: Project, step: Step) {
    debugger
    const currentPrpoject = this.projects.activeProjects.find(p => p.id == project.id);
    if (currentPrpoject) {
      let stepIndex = currentPrpoject.steps.findIndex(s => s.stepId === step.stepId)
      if (stepIndex !== undefined) {
        currentPrpoject.steps[stepIndex] = step;
      }
    }

    return of(step);
  }
}
