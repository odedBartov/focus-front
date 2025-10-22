import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, OnInit, Output, WritableSignal } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Feature } from '../../models/feature';
import { AnimationsService } from '../../services/animations.service';
import { AuthenticationService } from '../../services/authentication.service';
import { UpdatesService } from '../../services/updates.service';
import { environment } from '../../../environments/environment';
import { Step } from '../../models/step';
import { Project } from '../../models/project';
import { ProjectsService } from '../../services/projects.service';
import { StepOrTask } from '../../models/stepOrTask';

@Component({
  selector: 'app-updates',
  imports: [CommonModule],
  templateUrl: './updates.component.html',
  styleUrl: './updates.component.scss'
})
export class UpdatesComponent implements OnInit {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  authenticationService = inject(AuthenticationService);
  updatesService = inject(UpdatesService);
  projectsService = inject(ProjectsService);
  @Output() navigateToCalendarEmitter = new EventEmitter<void>();
  projects: WritableSignal<Project[]>;
  noProject: WritableSignal<Project>;
  features: Feature[] = [];
  steps: Step[] = [];
  stepsAndTasks: StepOrTask[] = [];
  fullName = "משתמש ללא שם";
  arielsNumber = environment.arielsNumber;

  constructor() {
    this.projects = this.projectsService.getActiveProjects();
    this.noProject = this.projectsService.getNoProject();
    effect(() => {
      this.initTasks();
    })
    effect(() => {
      this.steps = this.noProject().steps;
    })
  }
  
  ngOnInit(): void {
    const s1 = new Step();
    s1.name = "שלב 1";
    const s2 = new Step();
    s2.name = "שלב 2";
    const s3 = new Step();
    s3.name = "שלב 3";
    this.steps.push(s1, s2, s3, s1, s2, s3);

    this.animationsService.changeIsloading(true);
    this.updatesService.getFutureFeatures().subscribe(res => {
      this.animationsService.changeIsloading(false);
      this.features = res;
    })

    const userName = this.authenticationService.getUserName();
    if (userName) { 
      this.fullName = userName;
    }
  }

  initTasks() {
    // for no project - take every step of today, if not completed, if regular add add it, if with tasks add the first not completed task
    this.noProject().steps.forEach(step => {
      
    });
  }

  navigateToCalendar() {
    this.navigateToCalendarEmitter.emit();
  }

  editStep(step: Step) {
  }

  deleteStep(step: Step) {
  }

  openWhatsapp() {
    const message = `הי, זה ${this.fullName}. אני משתמש בפוקוס ויש לי משהו להגיד:
    `;
    const url = `https://wa.me/${this.arielsNumber}?text=${message}`;
    window.open(url, '_blank');
  }
}
