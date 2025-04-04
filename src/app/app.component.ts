import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatAccordion } from '@angular/material/expansion';
import { MatExpansionModule } from '@angular/material/expansion';
import { Project } from './models/project';
import { CommonModule } from '@angular/common';
import { ProjectsListComponent } from "./projects-list/projects-list.component";
import { Inject, PLATFORM_ID } from '@angular/core';
import { HttpService } from './services/http.service';
import { UserProjects } from './models/userProjects';
import {MatMenuModule} from '@angular/material/menu';

@Component({
  selector: 'app-root',
  imports: [MatExpansionModule, CommonModule, ProjectsListComponent, ProjectsListComponent, MatAccordion, MatMenuModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  httpService = inject(HttpService);
  projects: Project[] = [];
  userProjects?: UserProjects;
  
  constructor(@Inject(PLATFORM_ID) private platformId: object){}

  ngOnInit(): void {
    this.httpService.getProjects().subscribe(res => {
      this.userProjects = res;
    })
  }
}
