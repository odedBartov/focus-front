import { Component, inject, OnInit } from '@angular/core';
import { HttpService } from '../services/http.service';
import { Project } from '../models/project';
import { UserProjects } from '../models/userProjects';
import { RouterModule } from '@angular/router';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { ProjectsListComponent } from '../projects-list/projects-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { LoadingService } from '../services/loading.service';
import { ProjectStatus } from '../models/enums';

@Component({
  selector: 'app-home',
  imports: [RouterModule, MatExpansionModule, CommonModule, ProjectsListComponent, ProjectsListComponent, MatAccordion, MatMenuModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);

  projects: Project[] = [];
  userProjects?: UserProjects;

  ngOnInit(): void {
    this.loadingService.changeIsloading(true);
    this.httpService.getProjects().subscribe(res => {
      this.loadingService.changeIsloading(false);
      this.userProjects = this.sortProjects(res);
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
