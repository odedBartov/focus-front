import { Component, inject, OnInit, signal, ViewChild, viewChild } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Project } from '../../models/project';
import { UserProjects } from '../../models/userProjects';
import { Router, RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { ProjectsListComponent } from '../projects-list/projects-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { AnimationsService } from '../../services/animations.service';
import { ProjectStatus } from '../../models/enums';
import { SummaryComponent } from "../summary/summary.component";
import { UpdatesComponent } from "../updates/updates.component";
import { ProjectPageComponent } from '../project-page/project-page.component';
import { ProjectTab } from '../../models/projectTab';
import { ProjectHoverService } from '../../services/project-hover.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Title } from '@angular/platform-browser';
import { ArchiveComponent } from "../archive/archive.component";
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-home',
  imports: [RouterModule, MatExpansionModule, CommonModule,
    ProjectsListComponent, ProjectsListComponent,
    MatMenuModule, SummaryComponent, UpdatesComponent,
    ProjectPageComponent, ArchiveComponent, DragDropModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent implements OnInit {
  @ViewChild('projectPage', { static: false }) projectPage?: ProjectPageComponent;
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  projectHoverService = inject(ProjectHoverService);
  authenticationService = inject(AuthenticationService);
  titleService = inject(Title);
  router = inject(Router);
  userProjects: UserProjects = new UserProjects();
  selectedProject?: Project;
  isProjectHovered = this.projectHoverService.getSignal();
  userPicture: string | null = null;
  defaultUserPicture = "assets/icons/default_profile.svg"
  homeTab: ProjectTab = { id: 'home', icon: 'assets/icons/home.svg' };
  activeTab: ProjectTab = { id: 'none' };
  archiveTab: ProjectTab = { id: "archive", label: "ארכיון", projects: [] }
  tabs: ProjectTab[] = [];

  setActive(tab: ProjectTab) {
    this.activeTab = tab;
    this.selectedProject = tab.project;
  }

  ngOnInit(): void {
    this.initUserPicture();
    this.refreshProjects();
    this.activeTab = this.homeTab;
  }

  initUserPicture() {
    setTimeout(() => {
      this.userPicture = this.authenticationService.getUserPicture() ?? this.defaultUserPicture;
    }, 0);
  }

  initTabs() {
    this.tabs = [this.homeTab];
    const activeProjectTabs = this.userProjects.activeProjects.map(p => { return { id: p.id ?? '', label: p.name, project: p } });
    this.tabs.push(...activeProjectTabs);
    if (this.userProjects.unActiveProjects.length) {
      this.archiveTab.projects = this.userProjects.unActiveProjects;
      this.tabs.push(this.archiveTab);
    } else {
      if (this.activeTab.id === this.archiveTab.id) {
        this.activeTab = this.homeTab;
      }
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.tabs, event.previousIndex, event.currentIndex);
    moveItemInArray(this.userProjects.activeProjects, event.previousIndex - 1, event.currentIndex - 1)
    this.updateProjectsPosition();
    this.animationsService.changeIsloading(true);
    this.httpService.updateProjects(this.userProjects.activeProjects).subscribe(res => {
      this.userProjects.activeProjects = this.userProjects.activeProjects.sort((a, b) => a.positionInList - b.positionInList);
      this.animationsService.changeIsloading(false);
    });
  }

  updateProjectsPosition() {
    for (let index = 0; index < this.userProjects.activeProjects.length; index++) {
      this.userProjects.activeProjects[index].positionInList = index;
    }
  }

  refreshProjects() {
    this.animationsService.changeIsloading(true);
    this.httpService.getProjects().subscribe(res => {
      this.userProjects = this.sortProjects(res);
      this.userProjects.activeProjects = this.userProjects.activeProjects.sort((a, b) => a.positionInList - b.positionInList);
      this.userProjects.unActiveProjects = this.userProjects.unActiveProjects.sort((a, b) => a.positionInList - b.positionInList);
      this.initTabs();
      this.activeTab = this.homeTab;
      this.sortStepsPosition();
      this.animationsService.changeIsloading(false);
    });
  }

  sortStepsPosition() {
    this.userProjects.activeProjects.forEach(project => {
      project.steps = project.steps.sort((a, b) => a.positionInList - b.positionInList);
    });
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

  projectUpdated(project: Project) {
    this.selectedProject = project;
    this.activeTab.project = project;
    this.activeTab.label = project.name;
    for (let index = 0; index < this.userProjects.activeProjects.length; index++) {
      if (this.userProjects.activeProjects[index].id === project.id) {
        this.userProjects.activeProjects[index] = project;
      }
    }
  }

  navigateToProfile() {
    //this.router.navigate(['/profile']);
  }
}
