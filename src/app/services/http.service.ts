import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Project } from '../models/project';
import { UserProjects } from '../models/userProjects';
import { Step } from '../models/step';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  httpClient = inject(HttpClient);
  projects = new UserProjects();
  apiUrl = "https://projectsmanagerserver.onrender.com/api/";

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

  getProjects(): Observable<Project[]> {
    return this.httpClient.get<Project[]>(this.apiUrl + "Projects/getUserProjects");
  }

  // ??
  // getProject(projectId: string): Observable<Project> {
  //   return this.httpClient.get<Project>(this.apiUrl + "")
  // }

  createStep(step: Step): Observable<Step> {
    return this.httpClient.post<Step>(this.apiUrl + "Steps/createStep", step);
  }

  getStep(projectId: string): Observable<Step[]> {
    return this.httpClient.get<Step[]>(this.apiUrl + "Steps/getSteps?projectId=" + projectId);
  }

  updateStep(step: Step) {
    return this.httpClient.put(this.apiUrl + "Steps/updateStep", step);
  }
}
