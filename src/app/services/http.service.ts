import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Project } from '../models/project';
import { Step } from '../models/step';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthenticationService } from './authentication.service';
import { environment } from "../../environments/environment";
import { InsightAndUpdates } from '../models/insightAndUpdates';
import { User } from '../models/user';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  apiUrl = environment.apiUrl;
  httpClient = inject(HttpClient);
  authenticationService = inject(AuthenticationService);
  titleService = inject(Title);

  constructor() {
  }

  generateHeaders() {
    const token = this.authenticationService.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    headers.append("withCredentials", 'true');
    return { headers };
  }

  loginWithGoogleToken(token: string) {
    return this.httpClient.post(`${this.apiUrl}Auth/googleLogin`, { "code": token }, {
      observe: 'response',
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(tap((res: any) => {
      const isNewUser = res.headers.get("isNewUser");
      this.authenticationService.setNewUser(isNewUser == "True");      
      this.authenticationService.setUserPicture(res.body.picture);
      this.authenticationService.setUserName(res.body.firstName, res.body.lastName);
      const fullName = this.authenticationService.getUserName();
      if (fullName) {
        this.titleService.setTitle("פוקוס - " + fullName);

        if (fullName.includes("עודד") || fullName.includes("אריאל")) {
          setInterval(() => {
            this.getInsightAndUpdates().subscribe(res => { })
          }, 700000);
        }
      }
    }))
  }

  updateUser(user: User) {
    const headers = this.generateHeaders();
    return this.httpClient.put<User>(this.apiUrl + 'Auth/updateUser', user, headers);
  }

  createProject(project: Project) {
    return this.httpClient.post<Project>(this.apiUrl + "Projects/createProject", project);
  }

  getProject(projectId: string): Observable<Project> {
    const headers = this.generateHeaders();
    return this.httpClient.get<Project>(`${this.apiUrl}Projects/getProject?projectId=${projectId}`, headers);
  }

  getProjects(projectId?: string | null): Observable<Project[]> {
    const headers = this.generateHeaders();
    const singleProject = projectId ? `?singleProjectId=${projectId}` : "";
    return this.httpClient.get<Project[]>(this.apiUrl + `Projects/getUserProjects${singleProject}`, { ...headers, observe: 'response' }).pipe(tap((res: any) => {
      const readOnlyHeader = res.headers.get("isReadOnly");
      const isReadOnly = readOnlyHeader && readOnlyHeader === 'true';
      this.authenticationService.setIsReadOnly(isReadOnly);
      if (isReadOnly) {
        this.authenticationService.setUserPicture(res.body[0].ownerPicture);
      }
    }), map(res => res.body as Project[]));
  }

  updateProjects(project: Project[]): Observable<Project[]> {
    const headers = this.generateHeaders();
    return this.httpClient.put<Project[]>(this.apiUrl + "Projects/updateProjects", project, headers);
  }

  deleteProject(projectId: string) {
    const headers = this.generateHeaders();
    return this.httpClient.delete(`${this.apiUrl}Projects/deleteProject?projectId=${projectId}`, headers)
  }

  createStep(step: Step): Observable<Step> {
    return this.httpClient.post<Step>(this.apiUrl + "Steps/createStep", step);
  }

  getSteps(projectId: string): Observable<Step[]> {
    const headers = this.generateHeaders();
    return this.httpClient.get<Step[]>(`${this.apiUrl}Steps/getSteps?projectId=${projectId}`, headers);
  }

  updateSteps(steps: Step[]): Observable<Step[]> {
    const headers = this.generateHeaders();
    return this.httpClient.put<Step[]>(this.apiUrl + "Steps/updateSteps", steps, headers);
  }

  deleteStep(stepId: string) {
    const headers = this.generateHeaders();
    return this.httpClient.delete(`${this.apiUrl}Steps/deleteStep?stepId=${stepId}`, headers)
  }

  getInsightAndUpdates(): Observable<InsightAndUpdates> {
    return this.httpClient.get<InsightAndUpdates>(this.apiUrl + "Info/GetInsightAndUpdates");
  }

  createInsight(text: string) {
    return this.httpClient.post(this.apiUrl + "Info/createInsight", { Text: text })
  }

  getUser(): Observable<User> {
    const headers = this.generateHeaders();
    return this.httpClient.get<User>(this.apiUrl + 'Auth/getUser', headers)
  }
}
