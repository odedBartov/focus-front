import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project } from '../models/project';
import { UserProjects } from '../models/userProjects';
import { Step } from '../models/step';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  projects = new UserProjects();
  // apiUrl = "https://localhost:7189/api/";
  apiUrl = "https://projectsmanagerserver.onrender.com/api/";
  httpClient = inject(HttpClient)

  loginWithGoogleToken(token: string) {
    return this.httpClient.post(`${this.apiUrl}Auth/googleLogin`, {"code": token}, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  getProject(projectId: string): Observable<Project> {
    return this.httpClient.get<Project>(`${this.apiUrl}Projects/getProject?projectId=${projectId}`);
  }

  getProjects(): Observable<Project[]> {
    return this.httpClient.get<Project[]>(this.apiUrl + "Projects/getUserProjects");
  }

  createStep(step: Step): Observable<Step> {
    return this.httpClient.post<Step>(this.apiUrl + "Steps/createStep", step);
  }

  getStep(projectId: string): Observable<Step[]> {
    return this.httpClient.get<Step[]>(this.apiUrl + "Steps/getSteps?projectId=" + projectId);
  }

  updateStep(step: Step): Observable<Step> {
    return this.httpClient.put<Step>(this.apiUrl + "Steps/updateStep", step);
  }

  deleteStep(stepId: string) {
    return this.httpClient.delete(`${this.apiUrl}Steps/deleteStep?stepId=${stepId}`)
  }
}
