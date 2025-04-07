import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../models/project';
import { HttpService } from '../services/http.service';

@Component({
  selector: 'app-project-page',
  imports: [],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss'
})
export class ProjectPageComponent implements OnInit {
  route = inject(ActivatedRoute);
  httpService = inject(HttpService);
  projectId: string | null = null;
  project = signal<Project | undefined>(undefined);

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
    });
  }

  ngOnInit(): void {
    if (this.projectId) {
      this.httpService.getProject(this.projectId).subscribe(res => {
        if (res) {
          this.project.set(res);
        }
      })
    }
  }
}
