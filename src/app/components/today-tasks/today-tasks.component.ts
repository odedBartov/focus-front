import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, Input, OnInit, Output, QueryList, ViewChild, ViewChildren, WritableSignal } from '@angular/core';
import { Step } from '../../models/step';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';
import { ProjectStatus, StepType } from '../../models/enums';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { NewStepComponent } from '../new-step/new-step.component';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Task } from '../../models/task';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StandAloneStepsService } from '../../services/stand-alone-steps.service';
import { ProjectsService } from '../../services/projects.service';

@Component({
  selector: 'app-today-tasks',
  imports: [CommonModule, NewStepComponent, MatTooltipModule],
  templateUrl: './today-tasks.component.html',
  styleUrl: './today-tasks.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        marginTop: '0px'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
        marginTop: '20px'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease')
      ]),
    ])
  ]
})
export class TodayTasksComponent implements OnInit, AfterViewInit {
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  @ViewChildren('descriptions') descriptions!: QueryList<ElementRef<HTMLTextAreaElement>>;
  @Output() selectProjectEmitter = new EventEmitter<Project>();
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  standAloneStepsService = inject(StandAloneStepsService);
  projectsService = inject(ProjectsService);
  stepTypeEnum = StepType;
  editDiv?: HTMLDivElement;
  hoverStepId: string | undefined = '';
  editStepId: string | undefined = '';
  projects: WritableSignal<Project[]>;
  noProject: WritableSignal<Project>
  tasks: Task[] = [];
  creatingNewStep = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newStepDiv?.nativeElement && !this.newStepDiv.nativeElement.contains(event.target)) {
      this.creatingNewStep = false;
    }

    if (!this.editDiv?.contains(event.target as Node)) {
      this.editStepId = '';
      setTimeout(() => {
        this.setWidthForAllDescriptions();
      }, 1);
    }
  }

  constructor() {
    this.projects = this.projectsService.getActiveProjects();
    this.noProject = this.projectsService.getNoProjects();
  }

  ngAfterViewInit(): void {
    this.setWidthForAllDescriptions();
  }

  ngOnInit(): void {
    this.initTasks();
  }

  initTasks() {
    this.projects().forEach(project => {
      if (project?.steps) {
        const currentStep = project.steps.find(s => !s.isComplete);
        if (currentStep && (!currentStep.hideTaskDate || !this.isWithinLastDay(currentStep.hideTaskDate))) {
          this.tasks.push({ project: project, step: currentStep });
        }
      }
    })

    this.noProject().steps?.forEach(step => {
      if (!step.hideTaskDate || !this.isWithinLastDay(step.hideTaskDate)) {
        const newTask: Task = { project: this.noProject(), step: step };
        this.tasks.push(newTask);
      }
    })
  }

  isWithinLastDay(date: Date) {
    const today = new Date();
    const dateToCheck = new Date(date);
    return today.getFullYear() === dateToCheck.getFullYear() &&
      today.getMonth() === dateToCheck.getMonth() &&
      today.getDay() === dateToCheck.getDay()
  }

  setWidthForAllDescriptions() {
    this.descriptions.forEach((textareaRef) => {
      const textarea = textareaRef.nativeElement;
      const scrollHeight = textarea.scrollHeight;
      const actualHeight = textarea.clientHeight;
      const gap = (actualHeight + 17) - scrollHeight;
      let epsilon = 0;
      if (gap > 0) {
        epsilon = gap;
      }
      textarea.style.height = 'auto'; // Reset height
      // Set height to scrollHeight minus a small epsilon to avoid overflow
      textarea.style.height = textarea.scrollHeight - epsilon + "px";
    });
  }

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  finishStep(task: Task) {
    task.step.isComplete = true;
    task.step.dateCompleted = new Date();
    if (task.project.id === this.noProject().id) {
      this.deleteStep(task);
    } else {
      this.animationsService.changeIsLoadingWithDelay();
      this.httpService.updateSteps([task.step]).subscribe(res => {
        const finishedStepId = task.step.id;
        this.handleNextStep(task);
        const newStepId = task.step.id;
        if (newStepId !== finishedStepId) {
          const taskIndex = this.tasks.indexOf(task);
          // reset element to default height, then stretch
          const description = task.step.description;
          const price = task.step.price;
          task.step.description = undefined;
          task.step.price = 0;
          setTimeout(() => {
            task.step.description = description;
            task.step.price = price;
            setTimeout(() => {
              this.setWidthForAllDescriptions();
            }, 1);
          }, 1);
        } else { // project was finished
          task.project.status = ProjectStatus.finished;
          this.httpService.updateProjects([task.project]).subscribe(res => {
            const activeProjects = this.projectsService.getActiveProjects();
            const unActiveProjects = this.projectsService.getUnActiveProjects();
            const activeProjectIndex = activeProjects().indexOf(task.project);
            if (activeProjectIndex > -1) {
              unActiveProjects.set(unActiveProjects().concat(task.project));
              activeProjects().splice(activeProjectIndex, 1);
            }
          });
          this.animationsService.showFinishProject();
        }
        this.animationsService.changeIsloading(false);
      });
    }
  }

  createNewStep(step: Step) {
    this.animationsService.changeIsloading(true);
    step.projectId = this.standAloneStepsService.noProjectId;
    this.httpService.createStep(step).subscribe(res => {
      const newTask: Task = { project: this.noProject(), step: res };
      this.noProject().steps.push(res);
      this.tasks.push(newTask);
      setTimeout(() => {
        this.setWidthForAllDescriptions();
      }, 1);
      this.creatingNewStep = false;
      this.animationsService.changeIsloading(false);
    })
  }

  hideStepForToday(task: Task) {
    this.animationsService.changeIsLoadingWithDelay();
    task.step.hideTaskDate = new Date();
    const taskIndex = this.tasks.indexOf(task)
    this.tasks.splice(taskIndex, 1);
    this.httpService.updateSteps([task.step]).subscribe(res => {
      this.animationsService.changeIsloading(false);
    })
  }

  openProject(project: Project) {
    this.selectProjectEmitter.emit(project);
  }

  deleteStep(task: Task) {
    if (task.step.id) {
      this.animationsService.changeIsLoadingWithDelay();
      this.httpService.deleteStep(task.step.id).subscribe(res => {
        this.handleNextStep(task);
        this.animationsService.changeIsloading(false);
      });
    }
  }

  handleNextStep(task: Task) {
    const nextStep = task.project?.steps.find(s => !s.isComplete);
    if (nextStep && task.project.id !== this.noProject().id) {
      task.step = nextStep;
    } else {
      if (task.project.id === this.noProject().id) {
        const stepIndex = this.noProject().steps.indexOf(task.step);
        this.noProject().steps.splice(stepIndex, 1);
      }
      const taskIndex = this.tasks.indexOf(task);
      this.tasks.splice(taskIndex, 1);
    }
    this.notifyProjectUpdated(task.project);
  }

  updateStep(project: Project, newStep: Step) {
    this.animationsService.changeIsLoadingWithDelay();
    this.httpService.updateSteps([newStep]).subscribe(res => {
      project.steps = project?.steps?.map(step =>
        step.id === res[0].id ? res[0] : step
      )
      this.notifyProjectUpdated(project);
      setTimeout(() => {
        this.setWidthForAllDescriptions();
      }, 1);
      this.editStepId = '';
      this.animationsService.changeIsloading(false);
    })
  }

  notifyProjectUpdated(project: Project) {
    if (project.id === this.noProject().id) {
      this.noProject.set(project);
    } else {
      const updatedProjects = this.projects().map(p => p.id === project.id ? project : p);
      this.projects.set(updatedProjects);
    }
  }
}
