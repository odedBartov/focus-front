import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpService } from '../services/http.service';
import { Project } from '../models/project';
import { UserProjects } from '../models/userProjects';
import { RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { ProjectsListComponent } from '../projects-list/projects-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { LoadingService } from '../services/loading.service';
import { ProjectStatus } from '../models/enums';

@Component({
  selector: 'app-home',
  imports: [RouterModule, MatExpansionModule, CommonModule, ProjectsListComponent, ProjectsListComponent, MatMenuModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent implements OnInit {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  projects: Project[] = [];
  userProjects?: UserProjects;
  activeTab: string = 'home';

  tabs = [
    { id: 'home', label: '🏠' }
  ];

  setActive(tabId: string) {
    this.activeTab = tabId;
  }

  ngOnInit(): void {
    this.loadingService.changeIsloading(true);
    this.httpService.getProjects().subscribe(res => {
      this.loadingService.changeIsloading(false);
      this.userProjects = this.sortProjects(res);
      const activeProjectTabs = this.userProjects.activeProjects.map(p => {return {id: p.id ?? '', label: p.name}});
      this.tabs.push(...activeProjectTabs)
    }, err => {
      this.loadingService.changeIsloading(false);
    })
  }

  sortProjects(projects: Project[]): UserProjects {
    const result = new UserProjects();
    projects.forEach(project => {
      switch (project.status) {
        case ProjectStatus.active:
          result.activeProjects.push(project);
          break;
        case ProjectStatus.frozen:
          result.frozenProjects.push(project);
          break;
        case ProjectStatus.finished:
          result.finishedProjects.push(project);
          break;
        default:
          break;
      }
    })
    return result;
  }
}
