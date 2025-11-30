import { Component, effect, inject, OnInit, ViewChild, WritableSignal } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Project } from '../../models/project';
import { UserProjects } from '../../models/userProjects';
import { Router, RouterModule } from '@angular/router';
import { MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { ProjectsListComponent } from '../projects-list/projects-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { AnimationsService } from '../../services/animations.service';
import { ProjectStatus, subscriptionEnum } from '../../models/enums';
import { SummaryComponent } from "../summary/summary.component";
import { UpdatesComponent } from "../updates/updates.component";
import { ProjectPageComponent } from '../project-page/project-page.component';
import { ProjectTab } from '../../models/projectTab';
import { ProjectHoverService } from '../../services/project-hover.service';
import { AuthenticationService } from '../../services/authentication.service';
import { Title } from '@angular/platform-browser';
import { ArchiveComponent } from "../archive/archive.component";
import { StandAloneStepsService } from '../../services/stand-alone-steps.service';
import { ProjectsService } from '../../services/projects.service';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProfileComponent } from '../../modals/profile/profile.component';
import { WeeklyTasksComponent } from '../weekly-tasks/weekly-tasks.component';
import { FreeTrialEndComponent } from '../../modals/free-trial-end/free-trial-end.component';
import { WorkSessionService } from '../../services/work-session.service';
import { PaidFeatureModalComponent } from '../../modals/paid-feature-modal/paid-feature-modal.component';
import { WebSocketService } from '../../services/web-socket.service';

@Component({
  selector: 'app-home',
  imports: [RouterModule, MatExpansionModule, CommonModule,
    ProjectsListComponent, ProjectsListComponent,
    MatMenuModule, SummaryComponent, UpdatesComponent,
    ProjectPageComponent, ArchiveComponent, WeeklyTasksComponent],
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
  standAloneStepsService = inject(StandAloneStepsService);
  projectsService = inject(ProjectsService);
  titleService = inject(Title);
  workSessionService = inject(WorkSessionService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  dialog = inject(MatDialog);
  WebSocketService = inject(WebSocketService);
  activeProjects!: WritableSignal<Project[]>;
  unActiveProjects!: WritableSignal<Project[]>;
  noProject!: WritableSignal<Project>;
  selectedProject!: WritableSignal<Project | undefined>;
  isReadOnly!: WritableSignal<boolean>;
  isProjectHovered = this.projectHoverService.getSignal();
  userPicture: string | null = null;
  defaultUserPicture = "assets/icons/default_profile.svg"
  homeTab: ProjectTab = { id: 'home', icon: 'assets/icons/home.svg', disabledIcon: 'assets/icons/home_disabled.svg' };
  tasksTab: ProjectTab = { id: 'tasks', icon: 'assets/icons/tasks.svg', disabledIcon: 'assets/icons/tasks_disabled.svg' };
  archiveTab: ProjectTab = { id: "archive", label: "ארכיון", projects: [] };
  activeTab: ProjectTab = { id: 'none' };
  tabs: ProjectTab[] = [];
  projectsForPayment: Project[] = [];
  openNotesSignal: WritableSignal<Project | undefined>;

  constructor() {
    this.openNotesSignal = this.projectsService.getProjectWithOpenNotes();
    effect(() => {
      const selectedProject = this.selectedProject();
      if (selectedProject) {
        this.projectUpdated(selectedProject);
      }
    });

    effect(() => {
      const activeProjects = this.activeProjects();
      if (activeProjects) {
        this.projectsForPayment = this.activeProjects().concat(this.unActiveProjects()).concat(this.noProject());
        this.initTabs();
      }
    });

    this.isReadOnly = this.authenticationService.getIsReadOnly();
  }

  setActiveTab(tab: ProjectTab) {
    const canChangeTab = this.workSessionService.tryToChangePage();
    if (canChangeTab) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { tab: tab.id },
        queryParamsHandling: 'merge'
      });
      if (!(tab === this.tasksTab && this.authenticationService.getSubscription() === subscriptionEnum.free)) {
        this.activeTab = tab;
      }
      this.selectedProject.set(tab.project);
    }
  }

  ngOnInit(): void {
    this.activeProjects = this.projectsService.getActiveProjects();
    this.unActiveProjects = this.projectsService.getUnActiveProjects();
    this.noProject = this.projectsService.getNoProject();
    this.selectedProject = this.projectsService.getCurrentProject();
    this.initUserPicture();
    let paramProjectId: string | null | undefined = '';
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      paramProjectId = (tab !== this.homeTab.id && tab !== this.archiveTab.id && tab !== this.tasksTab.id) ? tab : undefined;
    });
    setTimeout(() => { // after query params loaded
      if (!paramProjectId && !this.authenticationService.getToken()) {
        this.router.navigate(['/login']);
      } else {
        this.refreshProjects(paramProjectId);
      }
    }, 1);

    this.checkIfFreeTrialEnded();
    this.WebSocketService.connect(this.authenticationService.getUserId() ?? "noUser");
  }

  checkIfFreeTrialEnded() {
    this.httpService.checkIfFreeTrialEnded().subscribe(res => {
      if (res === true) {
        this.dialog.open(FreeTrialEndComponent, { disableClose: true })
      }
    });
  }

  listenToUrl() {
    this.route.queryParams.subscribe(params => {
      const tabId = params['tab'];
      if (!tabId || tabId === 'main') {
        this.activeTab = this.homeTab;
      } else if (tabId === 'tasks') {
        if (this.authenticationService.getSubscription() === subscriptionEnum.free) { // subscriptio 
          this.dialog.open(PaidFeatureModalComponent);
        } else {
          this.activeTab = this.tasksTab;
        }
      } else if (tabId === 'archive') {
        this.activeTab = this.archiveTab;
      } else {
        const projectTab = this.tabs.find(t => t.id === tabId);
        if (projectTab) {
          this.activeTab = projectTab;
          this.selectedProject.set(projectTab.project);
        } else {
          this.activeTab = this.homeTab;
        }
      }
    });
  }

  initUserPicture() {
    setTimeout(() => {
      this.userPicture = this.authenticationService.getUserPicture() ?? this.defaultUserPicture;
    }, 0);
  }

  initTabs() {
    if (this.isReadOnly()) {
      this.tabs = [];
    } else {
      this.tabs = [this.homeTab, this.tasksTab];
    }

    this.activeProjects().sort((a, b) => a.positionInList - b.positionInList)
    const activeProjectTabs = this.activeProjects().map(p => { return { id: p.id ?? '', label: p.name, project: p } });
    this.tabs.push(...activeProjectTabs);
    if (this.unActiveProjects().length) {
      this.archiveTab.projects = this.unActiveProjects();
      this.tabs.push(this.archiveTab);
    } else {
      if (this.activeTab.id === this.archiveTab.id) {
        this.activeTab = this.homeTab;
      }
    }
  }

  updateProjectsPosition() {
    for (let index = 0; index < this.activeProjects().length; index++) {
      this.activeProjects()[index].positionInList = index;
    }
  }

  refreshProjects(projectId?: string | null) {
    this.animationsService.changeIsloading(true);
    this.httpService.getProjects(projectId).subscribe(res => {
      if (this.isReadOnly()) {
        this.tabs = this.tabs.splice(0, 1);
        this.activeProjects.set(res);
        setTimeout(() => {
          this.listenToUrl();
        }, 1);
      } else {
        const userProjects = this.sortProjects(res);
        this.projectsForPayment = userProjects.activeProjects.concat(this.unActiveProjects()).concat(userProjects.noProject);
        userProjects.activeProjects = userProjects.activeProjects.sort((a, b) => a.positionInList - b.positionInList);
        userProjects.unActiveProjects = userProjects.unActiveProjects.sort((a, b) => a.positionInList - b.positionInList);
        this.activeTab = this.homeTab;
        userProjects.activeProjects.forEach(project => {
          project.steps = project.steps.sort((a, b) => a.positionInList - b.positionInList);
        });
        this.updateDateDueForPassedSteps(userProjects.activeProjects);
        this.activeProjects.set(userProjects.activeProjects);
        this.unActiveProjects.set(userProjects.unActiveProjects);
        this.noProject.set(userProjects.noProject);
        this.initTabs();
        setTimeout(() => {
          this.listenToUrl();
        }, 1);
      }
      this.animationsService.changeIsloading(false);
    });
  }

  updateDateDueForPassedSteps(projects: Project[]) {
    const today = new Date();
    projects.forEach(project => {
      project.steps.forEach(step => {
        if (step.dateDue) {
          const dateToCheck = new Date(step.dateDue);
          if (dateToCheck.getFullYear() <= today.getFullYear() && dateToCheck.getMonth() < today.getMonth()) {
            step.dateDue = today;
          }
        }
      });
    });
  }

  sortProjects(projects: Project[]): UserProjects {
    const result = new UserProjects();
    projects.forEach(project => {
      if (project.id === this.standAloneStepsService.noProjectId) {
        result.noProject = project;
      } else
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
      this.setActiveTab(projectTab);
    } else {
      this.activeTab = { id: 'none' };
      this.selectedProject?.set(project);
    }
  }

  closeOpenNotes() {
    this.openNotesSignal.set(undefined);
  }

  projectUpdated(project: Project) {
    this.selectedProject.set(project);
    if (this.activeTab.id !== 'home' && this.activeTab.id !== 'tasks' && this.activeTab.id !== 'archive') {
      this.activeTab.project = project;
      this.activeTab.label = project.name;
    }
    for (let index = 0; index < this.activeProjects().length; index++) {
      if (this.activeProjects()[index].id === project.id) {
        this.activeProjects()[index] = project;
      }
    }
    this.projectsForPayment = this.activeProjects().concat(this.unActiveProjects()).concat(this.noProject());
    this.initTabs();
  }

  navigateToProfile() {
    const dialogRef = this.dialog.open(ProfileComponent);
    dialogRef.afterClosed().subscribe(res => {
      // do something?
    });
  }
}
