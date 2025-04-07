import { Component, inject, OnInit } from '@angular/core';
import { HttpService } from '../services/http.service';
import { Project } from '../models/project';
import { UserProjects } from '../models/userProjects';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { CommonModule } from '@angular/common';
import { ProjectsListComponent } from '../projects-list/projects-list.component';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-home',
  imports: [RouterModule, RouterOutlet, MatExpansionModule, CommonModule, ProjectsListComponent, ProjectsListComponent, MatAccordion, MatMenuModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  httpService = inject(HttpService);
  
  projects: Project[] = [];
  userProjects?: UserProjects;
  
  ngOnInit(): void {
    this.httpService.getProjects().subscribe(res => {
      this.userProjects = res;      
    })
  }
}
