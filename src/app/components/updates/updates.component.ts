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
import { StepOrTask } from '../../models/stepOrTask';
import { areDatesEqual } from '../../helpers/functions';
import { WeeklyDayTaskComponent } from '../weekly-day-task/weekly-day-task.component';
import { StepTask } from '../../models/stepTask';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NewTaskComponent } from '../new-task/new-task.component';
import { StepType } from '../../models/enums';

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
  features: Feature[] = [];
  stepsAndTasks: StepOrTask[] = [];
  isDragging = { dragging: false };
  fullName = "משתמש ללא שם";
  arielsNumber = environment.arielsNumber;

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
    const today = new Date();
    allTasks.forEach(t => {
      const taskDate = t.task?.dateOnWeekly || t.step?.dateOnWeekly;
      if (taskDate && areDatesEqual(new Date(taskDate), today)) {
        this.stepsAndTasks.push(t);
      }
    });
    this.sortSteps();

    // const activeSteps = this.projects().flatMap(p => p.steps.filter(s => s.isRecurring));
    // const retainerSteps: Step[] = [];
    // // initRetainerSteps(activeSteps, retainerSteps, [], []);
    // const retainerStepsOrTasks = retainerSteps.map(step => {
    //   const stepOrTask = new StepOrTask();
    //   stepOrTask.step = step;
    //   return stepOrTask;
    // });
    // this.stepsAndTasks = this.stepsAndTasks.concat(retainerStepsOrTasks);
  }

  ngAfterViewInit(): void {
    this.ngZone.onStable.asObservable().pipe().subscribe(() => {
      setTimeout(() => {
        const width = this.todayTasksElement.nativeElement.offsetWidth;
        document.documentElement.style.setProperty('--task-width', `${width - 50}px`); // 50 is the margin
      }, 1);
    });
  }

  scrollToBottom() {
    const container = this.tasksContainer?.nativeElement;
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 1);
  }

  dropStep(event: CdkDragDrop<StepOrTask[]>) {
    moveItemInArray(this.stepsAndTasks, event.previousIndex, event.currentIndex);
    this.updateStepsPosition();
    const stepsToUpdate: Step[] = [];
    this.stepsAndTasks.forEach(taskOrStep => {
      if (!stepsToUpdate.find(s => s.id === taskOrStep.parentStep?.id)) {
        if (taskOrStep.step) {
          taskOrStep.parentStep = taskOrStep.step;
        }
        stepsToUpdate.push(taskOrStep.parentStep);
      }
    });

    this.animationsService.changeIsLoadingWithDelay();
    this.httpService.updateSteps(stepsToUpdate).subscribe(res => {
      this.animationsService.changeIsloading(false);
    })
  }

  sortSteps() {
    this.stepsAndTasks.sort((a, b) => {
      const posA = a.task ? a.task.positionInWeeklyList : a.step!.positionInWeeklyList;
      const posB = b.task ? b.task.positionInWeeklyList : b.step!.positionInWeeklyList;
      return posA - posB;
    });
  }

  updateStepsPosition() {
    for (let index = 0; index < this.stepsAndTasks.length; index++) {
      const task = this.stepsAndTasks[index];
      if (task.task) {
        task.task.positionInWeeklyList = index;
      } else if (task.step) {
        task.step.positionInWeeklyList = index;
      }
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

  updateTaskText(task: StepTask, step: Step) {
    if (step.tasks) {
      const index = step.tasks.findIndex(t => t.id === task.id);
      if (index > -1) {
        step.tasks[index] = task;
        this.httpService.updateSteps([step]).subscribe();
      }
    }
  }

  createNewTask(task: StepTask) {
    task.positionInWeeklyList = this.stepsAndTasks.length;
    task.dateOnWeekly = new Date();
    let tasksStep = this.noProject().steps.find(s => s.name === 'weeklyTasks');
    if (!tasksStep) {
      tasksStep = new Step();
      tasksStep.projectId = this.noProject().id;
      tasksStep.name = 'weeklyTasks';
      tasksStep.stepType = StepType.task;
      tasksStep.tasks = [task];
      this.noProject().steps.push(tasksStep);
      this.noProject().steps = [...this.noProject().steps];
      this.httpService.createStep(tasksStep).subscribe(res => {
        if (tasksStep) {
          tasksStep.id = res.id;
        }
      });
    } else {
      tasksStep.tasks?.push(task);
      this.httpService.updateSteps([tasksStep]).subscribe(res => { });
    }
    const newTask = new StepOrTask();
    newTask.task = task;
    newTask.parentStep = tasksStep;
    newTask.project = this.noProject();
    this.stepsAndTasks.push(newTask);
  }

  completeTask(task: StepOrTask) {
    const index = this.stepsAndTasks.findIndex(t => {
      if (task.task) {
        return t.task?.id === task.task.id;
      } else if (task.step) {
        return t.step?.id === task.step.id;
      }
      return false;
    });
    if (index > -1 && (task.task?.isComplete || task.step?.isComplete)) {
      moveItemInArray(this.stepsAndTasks, index, 0);
    }
    this.updateStepsPosition();
    const stepsToUpdate: Step[] = [];
    this.stepsAndTasks.forEach(taskOrStep => {
      if (!stepsToUpdate.find(s => s.id === taskOrStep.parentStep?.id)) {
        if (taskOrStep.step) {
          taskOrStep.parentStep = taskOrStep.step;
        }
        stepsToUpdate.push(taskOrStep.parentStep);
      }
    });


    this.animationsService.changeIsLoadingWithDelay();
    this.httpService.updateSteps(stepsToUpdate).subscribe(res => {
      this.animationsService.changeIsloading(false);
    })
  }

  openWhatsapp() {
    const message = `הי, זה ${this.fullName}. אני משתמש בפוקוס ויש לי משהו להגיד:
    `;
    const url = `https://wa.me/${this.arielsNumber}?text=${message}`;
    window.open(url, '_blank');
  }
}
