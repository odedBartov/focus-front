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
import { areDatesEqual } from '../../helpers/functions';
import { WeeklyDayTaskComponent } from '../weekly-day-task/weekly-day-task.component';
import { StepTask } from '../../models/stepTask';
import { initRetainerSteps } from '../../helpers/retainerFunctions';

@Component({
  selector: 'app-updates',
  imports: [CommonModule, WeeklyDayTaskComponent],
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
  @Output() selectProject = new EventEmitter<Project>();
  projects: WritableSignal<Project[]>;
  noProject: WritableSignal<Project>;
  features: Feature[] = [];
  stepsAndTasks: StepOrTask[] = [];
  isDragging = { dragging: false };
  fullName = "משתמש ללא שם";
  arielsNumber = environment.arielsNumber;

  constructor() {
    this.projects = this.projectsService.getActiveProjects();
    this.noProject = this.projectsService.getNoProject();
    effect(() => {
      this.initTasks();
    })
  }

  ngOnInit(): void {
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
    this.stepsAndTasks = [];
    const lists = this.projectsService.populateCalendarTasks();
    const allTasks = lists.tasksWithDate;
    allTasks.forEach(t => {
      const taskDate = t.task?.dateOnWeekly || t.step?.dateOnWeekly;
      if (taskDate && areDatesEqual(new Date(taskDate), new Date())) {
        this.stepsAndTasks.push(t);
      }
    });

    const activeSteps = this.projects().flatMap(p => p.steps.filter(s => s.isRecurring));
    const retainerSteps: Step[] = [];
    initRetainerSteps(activeSteps, retainerSteps, [], []);    
    const retainerStepsOrTasks = retainerSteps.map(step => {
      const stepOrTask = new StepOrTask();
      stepOrTask.step = step;
      return stepOrTask;
    });
    this.stepsAndTasks = this.stepsAndTasks.concat(retainerStepsOrTasks);
  }

  navigateToCalendar() {
    this.navigateToCalendarEmitter.emit();
  }

  openProject(project?: Project) {
    if (project) {
      this.selectProject.emit(project);
    }
  }

  updateTaskText(task: StepTask, step: Step) {
    if (step.tasks) {
      const index = step.tasks.findIndex(t => t.id === task.id);
      if (index > -1) {
        step.tasks[index] = task;
        this.httpService.updateSteps([step]).subscribe();
      }
    }
  }

  completeTask(task: StepOrTask) {
    // update position
    if (task.step) {
      this.httpService.updateSteps([task.step]).subscribe();
    } else if (task.task && task.parentStep) {
      this.httpService.updateSteps([task.parentStep]).subscribe();
    }
  }

  openWhatsapp() {
    const message = `הי, זה ${this.fullName}. אני משתמש בפוקוס ויש לי משהו להגיד:
    `;
    const url = `https://wa.me/${this.arielsNumber}?text=${message}`;
    window.open(url, '_blank');
  }
}
