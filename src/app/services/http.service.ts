import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Project } from '../models/project';
import { Step } from '../models/step';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  apiUrl = "https://localhost:7189/api/";
  // apiUrl = "https://projectsmanagerserver.onrender.com/api/";
  httpClient = inject(HttpClient);
  authenticationService = inject(AuthenticationService);

  generateHeaders() {
    const token = this.authenticationService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return {headers};
  }

  loginWithGoogleToken(token: string) {
    return this.httpClient.post(`${this.apiUrl}Auth/googleLogin`, {"code": token}, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(tap((res: any) => {
      this.authenticationService.setUserName(res.name);
    }))
  }

  getProject(projectId: string): Observable<Project> {
    const headers = this.generateHeaders();
    return this.httpClient.get<Project>(`${this.apiUrl}Projects/getProject?projectId=${projectId}`, headers);
  }

  getProjects(): Observable<Project[]> {
    const headers = this.generateHeaders();
    return this.httpClient.get<Project[]>(this.apiUrl + "Projects/getUserProjects", headers);
  }

  updateProject(project: Project[]): Observable<Project> {
    const headers = this.generateHeaders();
    return this.httpClient.put<Project>(this.apiUrl + "Projects/updateProject", project, headers);
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
