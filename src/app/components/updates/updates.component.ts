import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, effect, ElementRef, EventEmitter, inject, NgZone, OnInit, Output, ViewChild, WritableSignal } from '@angular/core';
import { HttpService } from '../../services/http.service';
import { Feature } from '../../models/feature';
import { AnimationsService } from '../../services/animations.service';
import { AuthenticationService } from '../../services/authentication.service';
import { UpdatesService } from '../../services/updates.service';
import { environment } from '../../../environments/environment';
import { Step } from '../../models/step';
import { Project } from '../../models/project';
import { ProjectsService } from '../../services/projects.service';
import { StepWithProject } from '../../models/step-with-project';
import { areDatesEqual, getTodayAtMidnightLocal } from '../../helpers/functions';
import { WeeklyDayTaskComponent } from '../weekly-day-task/weekly-day-task.component';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NewTaskComponent } from '../new-task/new-task.component';
import { StepType } from '../../models/enums';
import { take } from 'rxjs';

@Component({
  selector: 'app-updates',
  imports: [CommonModule, WeeklyDayTaskComponent, DragDropModule, NewTaskComponent],
  templateUrl: './updates.component.html',
  styleUrl: './updates.component.scss'
})
export class UpdatesComponent implements OnInit, AfterViewInit {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  authenticationService = inject(AuthenticationService);
  updatesService = inject(UpdatesService);
  projectsService = inject(ProjectsService);
  @ViewChild('todayTasks') todayTasksElement!: ElementRef<HTMLDivElement>;
  @ViewChild('tasksContainer') tasksContainer!: ElementRef<HTMLDivElement>;
  @Output() navigateToCalendarEmitter = new EventEmitter<void>();
  @Output() selectProject = new EventEmitter<Project>();
  projects: WritableSignal<Project[]>;
  noProject: WritableSignal<Project>;
  regularFeatures: Feature[] = [];
  oneTimeFeatures: Feature[] = [];
  currentOneTimeFeature?: Feature;
  watchedFeatures: string[] = [];
  stepsAndTasks: StepWithProject[] = [];
  isDragging = { dragging: false };
  fullName = "משתמש ללא שם";
  arielsNumber = environment.arielsNumber;
  focusFacebookGroup = "https://www.facebook.com/groups/1244597577480607";

  constructor(private ngZone: NgZone) {
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
      this.regularFeatures = res.filter(f => !f.oneTimeWatch);
      this.oneTimeFeatures = res.filter(f => f.oneTimeWatch);
      this.watchedFeatures = JSON.parse(localStorage.getItem('watchedFeatures') ?? '[]');
      this.findOneTimeFeature();
    })

    const userName = this.authenticationService.getUserName();
    if (userName) {
      this.fullName = userName;
    }
  }

  findOneTimeFeature() {
    this.currentOneTimeFeature = this.oneTimeFeatures.find(f => !this.watchedFeatures.includes(f.id));
  }

  watchOneTimeFeature(feature: Feature) {
    this.watchedFeatures.push(feature.id);
    localStorage.setItem('watchedFeatures', JSON.stringify(this.watchedFeatures));
    this.findOneTimeFeature();
  }

  isComplete(item: StepWithProject) {
    return item.step?.isComplete ?? false;
  }

  initTasks() {
    this.stepsAndTasks = [];
    const lists = this.projectsService.populateCalendarTasks();
    const allSteps = lists.tasksWithDate;
    const today = getTodayAtMidnightLocal();
    allSteps.forEach(item => {
      const taskDate = item.step.dateOnWeekly;
      if (taskDate && areDatesEqual(new Date(taskDate), today)) {
        this.stepsAndTasks.push(item);
      }
    });
    this.sortSteps();
  }

  ngAfterViewInit(): void {
    this.ngZone.onStable.asObservable().pipe(take(1)).subscribe(() => {
      setTimeout(() => {
        const width = this.todayTasksElement.nativeElement.offsetWidth;
        document.documentElement.style.setProperty('--task-width', `${width - 50}px`);
        this.scrollToFirstIncomplete();
      }, 1);
    });
  }

  scrollToBottom() {
    const container = this.tasksContainer?.nativeElement;
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 1);
  }

  scrollToFirstIncomplete() {
    const container = this.tasksContainer.nativeElement as HTMLElement;
    const target = container.querySelector('.task.incomplete') as HTMLElement | null;

    if (target) {
      // Compute offset relative to the container, not the page
      const targetOffset =
        target.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;

      container.scrollTo({
        top: targetOffset,
        behavior: 'smooth'
      });
    }
  }


  dropStep(event: CdkDragDrop<StepWithProject[]>) {
    moveItemInArray(this.stepsAndTasks, event.previousIndex, event.currentIndex);
    this.updateStepsPosition();
    const stepsToUpdate: Step[] = [];
    this.stepsAndTasks.forEach(item => {
      if (!stepsToUpdate.find(s => s.id === item.step?.id)) {
        stepsToUpdate.push(item.step);
      }
    });

    this.animationsService.changeIsLoadingWithDelay();
    this.httpService.updateSteps(stepsToUpdate).subscribe(res => {
      this.animationsService.changeIsloading(false);
    })
  }

  sortSteps() {
    this.stepsAndTasks.sort((a, b) => {
      const posA = a.step.positionInWeeklyList;
      const posB = b.step.positionInWeeklyList;
      return posA - posB;
    });
  }

  updateStepsPosition() {
    for (let index = 0; index < this.stepsAndTasks.length; index++) {
      this.stepsAndTasks[index].step.positionInWeeklyList = index;
    }
  }

  navigateToCalendar() {
    this.navigateToCalendarEmitter.emit();
  }

  openProject(project?: Project) {
    if (project) {
      this.selectProject.emit(project);
    }
  }

  updateStepText(step: Step) {
    this.httpService.updateSteps([step]).subscribe();
  }

  createNewStep(step: Step) {
    step.positionInWeeklyList = this.stepsAndTasks.length;
    step.dateOnWeekly = new Date();
    step.projectId = this.noProject().id;
    step.stepType = StepType.task;
    step.userId = this.authenticationService.getUserId() ?? 'noUserId';
    this.httpService.createStep(step).subscribe(res => {
      this.noProject().steps.push(res);
      this.noProject().steps = [...this.noProject().steps];
      this.stepsAndTasks.push({ step: res, project: this.noProject() });
    });
  }

  completeTask(task: StepWithProject) {
    const index = this.stepsAndTasks.findIndex(t => t.step.id === task.step.id);
    if (index > -1 && task.step.isComplete) {
      moveItemInArray(this.stepsAndTasks, index, 0);
    }
    this.updateStepsPosition();
    const stepsToUpdate: Step[] = [];
    this.stepsAndTasks.forEach(item => {
      if (!stepsToUpdate.find(s => s.id === item.step?.id)) {
        stepsToUpdate.push(item.step);
      }
    });

    this.animationsService.changeIsLoadingWithDelay();
    this.httpService.updateSteps(stepsToUpdate).subscribe(res => {
      this.animationsService.changeIsloading(false);
      this.projects.update(projects => projects.map(project => ({
        ...project,
        steps: project.steps.map(step => res.find(s => s.id === step.id) ?? step)
      })));
    })
  }

  openWhatsapp() {
    const message = `הי, כאן ${this.fullName}. אני משתמש/ת בפוקוס ויש לי משהו לומר:
    `;
    const url = `https://wa.me/${this.arielsNumber}?text=${message}`;
    window.open(url, '_blank');
  }

  joinFacebook() {
    window.open(this.focusFacebookGroup, '_blank');
  }
}
