import { Component, inject, WritableSignal, computed } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { MenuButton, Project } from '../../models/project';
import { ProjectStatus, StepType } from '../../models/enums';
import { tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-archive',
  imports: [CommonModule, MatProgressBarModule, MatMenuModule, DragDropModule, MatTooltipModule],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.scss'
})
export class ArchiveComponent {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  projectsService = inject(ProjectsService);

  projects = computed(() => this.projectsService.getUnActiveProjects()().sort(this.sortProjects));
  projectStatusEnum = ProjectStatus;
  projectStatusIcons: Record<ProjectStatus, string> = { [ProjectStatus.active]: "", [ProjectStatus.frozen]: "hourglass", [ProjectStatus.deleted]: "garbage_can_blue", [ProjectStatus.finished]: "confirm_yes" };
  regularMenuButtons: MenuButton[] = [];
  deletedProjectMenuButtons: MenuButton[] = [];

  constructor() {
    this.initMenuButtons();
  }

  sortProjects(a: Project, b: Project): number {
    if (!b.lastModifiedDate) return 1;
    if (!a.lastModifiedDate) return -1;

    return new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime();
  }

  initMenuButtons() {
    const duplicate: MenuButton = { text: "שכפול", action: (project) => this.cloneProject(project) };
    this.regularMenuButtons = [{ text: "הפעלה מחדש", action: (project) => this.activateProject(project) }, duplicate, { text: "מחיקה", action: (project) => this.softDeleteProject(project) }];
    this.deletedProjectMenuButtons = [{ text: "שחזור", action: (project) => this.activateProject(project) }, duplicate, { text: "מחיקה לנצח", action: (project) => this.deleteProject(project) }];
  }

  getMenuButtons(project: Project): MenuButton[] {
    if (project.status === ProjectStatus.deleted) return this.deletedProjectMenuButtons;
    return this.regularMenuButtons;
  }

  getBasePrice(project: Project) {
    const steps = project.steps?.filter(s => s.stepType === StepType.payment);
    return steps?.reduce((sum, step) => sum + step.price, 0) ?? 0;
  }

  activateProject(project: Project) {
    const projectToUpdate = { ...project };
    projectToUpdate.status = ProjectStatus.active;
    projectToUpdate.positionInList += 99999;
    this.updateProjects([projectToUpdate]).subscribe(res => {
      project.status = projectToUpdate.status;
      project.positionInList = projectToUpdate.positionInList;
      const projectIndex = this.projects().indexOf(project);
      const projects = [...this.projects()];
      projects.splice(projectIndex, 1);
      const activeProjects = this.projectsService.getActiveProjects();
      activeProjects.set(activeProjects().concat(project));
      this.projectsService.unActiveProjects.set(projects);
    });
  }

  cloneProject(project: Project) {
    this.animationsService.changeIsloading(true);
    const clonedProject = { ...project };
    clonedProject.id = undefined;
    clonedProject.startDate = new Date();
    this.httpService.createProject(clonedProject).subscribe(res => {
      this.projectsService.unActiveProjects.set(this.projects().concat(res));
      this.animationsService.changeIsloading(false);
    })
  }

  softDeleteProject(project: Project) {
    project.status = ProjectStatus.deleted;
    project.positionInList += 99999;
    this.updateProjects([project]).subscribe();
  }

  deleteProject(project: Project) {
    if (project.id) {
      this.animationsService.changeIsloading(true);
      this.httpService.deleteProject(project.id).subscribe(res => {
        const projectIndex = this.projects().indexOf(project);
        this.projects().splice(projectIndex, 1);
        this.animationsService.changeIsloading(false);
      })
    }
  }

  updateProjects(projects: Project[]) {
    this.animationsService.changeIsLoadingWithDelay();
    return this.httpService.updateProjects(projects).pipe(tap(res => {
      this.animationsService.changeIsloading(false);
    }));
  }

  openMenu(event: MouseEvent, menuTrigger: MatMenuTrigger, anchor: HTMLElement) {
    event.preventDefault();
    event.stopPropagation();

    // Move anchor to cursor
    anchor.style.top = `${event.clientY}px`;
    anchor.style.left = `${event.clientX}px`;

    // Open menu from anchor
    menuTrigger.openMenu();
    menuTrigger.menu?.focusFirstItem('mouse');
  }
}
