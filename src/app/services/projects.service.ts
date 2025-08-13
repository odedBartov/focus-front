import { inject, Injectable, Signal, signal } from '@angular/core';
import { HttpService } from './http.service';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  httpService = inject(HttpService);
  activeProjects = signal<Project[]>([]);
  unActiveProjects = signal<Project[]>([]);
  noProject = signal<Project>(new Project());
  currentProject = signal<Project>(new Project())

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
}
