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
import { SummaryComponent } from "../summary/summary.component";
import { UpdatesComponent } from "../updates/updates.component";
import { ProjectPageComponent } from '../project-page/project-page.component';
import { ProjectTab } from '../models/projectTab';
import { ProjectHoverService } from '../services/project-hover.service';

@Component({
  selector: 'app-home',
  imports: [RouterModule, MatExpansionModule, CommonModule,
    ProjectsListComponent, ProjectsListComponent,
    MatMenuModule, SummaryComponent, UpdatesComponent,
    ProjectPageComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent implements OnInit {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  projectHoverService = inject(ProjectHoverService);
  userProjects: UserProjects = new UserProjects();
  selectedProject?: Project;
  isProjectHovered = this.projectHoverService.getSignal();

  activeTab: ProjectTab = { id: 'home', icon: 'assets/icons/home.svg' };
  tabs: ProjectTab[] = [];

  setActive(tab: ProjectTab) {
    this.activeTab = tab;
    this.selectedProject = tab.project;
  }

  ngOnInit(): void {
    this.loadingService.changeIsloading(true);
    this.httpService.getProjects().subscribe(res => {
      this.loadingService.changeIsloading(false);
      this.userProjects = this.sortProjects(res);
      this.initTabs();
    })
  }

  initTabs() {
    const activeProjectTabs = this.userProjects.activeProjects.map(p => { return { id: p.id ?? '', label: p.name, project: p } });
    this.tabs = [this.activeTab];
    this.tabs.push(...activeProjectTabs);
    this.setActive(this.tabs[1]);// to remove
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

  selectProject(project: Project) {
    const projectTab = this.tabs.find(t => t.id === project.id);
    if (projectTab) {
      this.setActive(projectTab);
    } else {
      this.activeTab = { id: 'none' };
      this.selectedProject = project;
    }
  }

  updateActiveTabs(projects: Project[]) {
    this.userProjects.activeProjects = projects;
    this.initTabs();
  }
}
