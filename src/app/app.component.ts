import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatAccordion } from '@angular/material/expansion';
import { MatExpansionModule } from '@angular/material/expansion';
import { Project } from './models/project';
import { CommonModule } from '@angular/common';
import { ProjectsListComponent } from "./projects-list/projects-list.component";
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatExpansionModule, CommonModule, ProjectsListComponent, ProjectsListComponent, MatAccordion],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.Emulated
})
export class AppComponent implements OnInit {
  projects: Project[] = [];
  
  constructor(@Inject(PLATFORM_ID) private platformId: object){}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Code that interacts with shadowRoot
    }

    const p1 = new Project();
    p1.name = 'פרויקט ראשון';
    p1.description = 'פה יש הסבר על הפרויקט';

    const p2 = new Project();
    p2.name = 'פרויקט שני';
    p2.description = 'סתם טקסט של תיאור';


    this.projects = [p1, p2];
  }
}
