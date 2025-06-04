import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { Project } from '../../models/project';
import { ProjectStatus, StepType } from '../../models/enums';
import { tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-archive',
  imports: [CommonModule, MatProgressBarModule, MatMenuModule, DragDropModule, MatTooltipModule],
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.scss'
})
export class ArchiveComponent {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  @Output() unActiveProjectsEmitter = new EventEmitter<Project[]>();
  @Input() projects!: Project[];
  projectStatusEnum = ProjectStatus;

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.projects, event.previousIndex, event.currentIndex);
    this.updateProjectsPosition();
    this.updateProjects(this.projects).subscribe(res => { });
  }

  updateProjectsPosition() {
    for (let index = 0; index < this.projects.length; index++) {
      this.projects[index].positionInList = index;
    }
  }

  getBasePrice(project: Project) {
    const steps = project.steps?.filter(s => s.stepType === StepType.payment);
    return steps?.reduce((sum, step) => sum + step.price, 0) ?? 0;
  }

  activateProject(project: Project) {
    project.status = ProjectStatus.active;
    project.positionInList += 99999;
    this.updateProjects([project]).subscribe(res => {
      this.projects?.splice(this.projects.indexOf(project), 1);
    });
  }

  cloneProject(project: Project) {
    this.animationsService.changeIsloading(true);
    const clonedProject = { ...project };
    clonedProject.id = undefined;
    clonedProject.startDate = new Date();
    this.httpService.createProject(clonedProject).subscribe(res => {
      this.projects.push(res);
      this.unActiveProjectsEmitter.emit(this.projects);
      this.animationsService.changeIsloading(false);
    })
  }

  deleteProject(project: Project) {
    if (project.id) {
      this.animationsService.changeIsloading(true);
      this.httpService.deleteProject(project.id).subscribe(res => {
        const projectIndex = this.projects.indexOf(project);
        this.projects.splice(projectIndex, 1);
        this.unActiveProjectsEmitter.emit(this.projects);
        this.animationsService.changeIsloading(false);
      })
    }
  }

  updateProjects(projects: Project[]) {
    this.animationsService.changeIsloading(true);
    return this.httpService.updateProjects(projects).pipe(tap(res => {
      this.unActiveProjectsEmitter.emit(this.projects);
      this.animationsService.changeIsloading(false);
    }));
  }
}
