import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Project } from '../models/project';
import { Step } from '../models/step';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthenticationService } from './authentication.service';
import { environment } from "../../environments/environment";
import { User } from '../models/user';
import { Title } from '@angular/platform-browser';
import { HourlyWorkSession } from '../models/hourlyWorkSession';
import { RetainerPayment } from '../models/RetainerPayment';
import { Feature } from '../models/feature';
import { ChatRequest, ChatResponse } from '../models/aiModels';

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
      this.authenticationService.setSubscription(res.body.subscription);
      const fullName = this.authenticationService.getUserName();
      if (fullName) {
        this.titleService.setTitle("פוקוס - " + fullName);
      }
    }))
  }

  endFreeTrial() {
    const headers = this.generateHeaders();
    return this.httpClient.put(this.apiUrl + 'Auth/endFreeTrial', headers);
  }

  checkIfFreeTrialEnded() {
    const headers = this.generateHeaders();
    return this.httpClient.get(this.apiUrl + "Auth/checkFreeTrialExpire", headers);
  }

  updateUser(user: User) {
    const headers = this.generateHeaders();
    return this.httpClient.put<User>(this.apiUrl + 'Auth/updateUser', user, headers);
  }

  createProject(project: Project) {
    const headers = this.generateHeaders();
    return this.httpClient.post<Project>(this.apiUrl + "Projects/createProject", project, headers);
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
    const headers = this.generateHeaders();
    return this.httpClient.post<Step>(this.apiUrl + "Steps/createStep", step, headers);
  }

  getSteps(projectId: string): Observable<Step[]> {
    const headers = this.generateHeaders();
    return this.httpClient.get<Step[]>(`${this.apiUrl}Steps/getSteps?projectId=${projectId}`, headers);
  }

  updateSteps(steps: Step[]): Observable<Step[]> {
    const headers = this.generateHeaders();
    return this.httpClient.put<Step[]>(this.apiUrl + "Steps/updateSteps", steps, headers);
  }

  createRetainerPayment(payment: RetainerPayment) {
    const headers = this.generateHeaders();
    return this.httpClient.post<RetainerPayment>(this.apiUrl + "Retainer/createRetainerPayment", payment, headers);
  }

  deleteRetainerPayment(paymentId: string) {
    const headers = this.generateHeaders();
    return this.httpClient.delete(`${this.apiUrl}Retainer/deleteRetainerPayment?paymentId=${paymentId}`, headers)
  }

  deleteStep(stepId: string) {
    const headers = this.generateHeaders();
    return this.httpClient.delete(`${this.apiUrl}Steps/deleteStep?stepId=${stepId}`, headers)
  }

  createHourlyWorkSession(session: HourlyWorkSession): Observable<HourlyWorkSession> {
    const headers = this.generateHeaders();
    return this.httpClient.post<HourlyWorkSession>(this.apiUrl + "Retainer/createHourlySession", session, headers);
  }

  deleteHourlyWorkSession(sessionId: string) {
    const headers = this.generateHeaders();
    return this.httpClient.delete(`${this.apiUrl}Retainer/deleteHourlySession?sessionId=${sessionId}`, headers)
  }

  getFutureFeatures(): Observable<Feature[]> {
    return this.httpClient.get<Feature[]>(this.apiUrl + "Info/getFutureFeatures");
  }

  getUser(): Observable<User> {
    const headers = this.generateHeaders();
    return this.httpClient.get<User>(this.apiUrl + 'Auth/getUser', headers)
  }

  sendAiMessage(request: ChatRequest): Observable<ChatResponse> {
    const headers = this.generateHeaders();
    return this.httpClient.post<ChatResponse>(this.apiUrl + "Ai/chatWithAi", request, headers);
  }

  giveUserBonusSubscription(email: string) {
    return this.httpClient.post(this.apiUrl + "Auth/giveUserBonusSubscription", {email: email});
  }

  getAllUsers() {
    const headers = this.generateHeaders();
    return this.httpClient.get<User[]>(this.apiUrl + "Auth/getAllUsers", headers);
  }
}
