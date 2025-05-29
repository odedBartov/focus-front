import { Component, inject, OnInit, signal, ViewChild, viewChild } from '@angular/core';
import { HttpService } from '../services/http.service';
import { Project } from '../models/project';
import { UserProjects } from '../models/userProjects';
import { Router, RouterModule } from '@angular/router';
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
import { AuthenticationService } from '../services/authentication.service';
import { Title } from '@angular/platform-browser';

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
  @ViewChild('projectPage', { static: false }) projectPage?: ProjectPageComponent;
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  projectHoverService = inject(ProjectHoverService);
  authenticationService = inject(AuthenticationService);
  titleService = inject(Title);
  router = inject(Router);
  userProjects: UserProjects = new UserProjects();
  // activeProjects: Project[] = [];
  // unactiveProjects: Project[] = [];
  selectedProject?: Project;
  isProjectHovered = this.projectHoverService.getSignal();
  userPicture: string | null = null;
  defaultUserPicture = "assets/icons/default_profile.svg"
  activeTab: ProjectTab = { id: 'home', icon: 'assets/icons/home.svg' };
  tabs: ProjectTab[] = [];

  setActive(tab: ProjectTab) {
    this.activeTab = tab;
    this.selectedProject = tab.project;
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.userPicture = this.authenticationService.getUserPicture() ?? this.defaultUserPicture;
      const fullName = this.authenticationService.getUserName();
      if (fullName) {
        this.titleService.setTitle(fullName);
      }
    }, 0);
    this.loadingService.changeIsloading(true);
    this.httpService.getProjects().subscribe(res => {
      this.loadingService.changeIsloading(false);
      this.userProjects = this.sortProjects(res);
      this.userProjects.activeProjects = this.userProjects.activeProjects;
      this.userProjects.unActiveProjects = this.userProjects.unActiveProjects;
      this.initTabs();
    })
  }

  initTabs() {
    const activeProjectTabs = this.userProjects.activeProjects.map(p => { return { id: p.id ?? '', label: p.name, project: p } });
    this.tabs = [this.activeTab];
    this.tabs.push(...activeProjectTabs);
    if (this.userProjects.unActiveProjects.length) {
      const archiveTab = { id: "archive", label: "ארכיון", projects: this.userProjects.unActiveProjects };
      this.tabs.push(archiveTab);
    }
  }

  sortProjects(projects: Project[]): UserProjects {
    const result = new UserProjects();
    projects.forEach(project => {
      if (project.status === ProjectStatus.active) {
        result.activeProjects.push(project);
      } else {
        result.unActiveProjects.push(project);
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

  navigateToProfile() {
    //this.router.navigate(['/profile']);
  }
}
