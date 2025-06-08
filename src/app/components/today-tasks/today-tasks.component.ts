import { Component, ElementRef, EventEmitter, HostListener, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Step } from '../../models/step';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';
import { StepType } from '../../models/enums';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { NewStepComponent } from '../new-step/new-step.component';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Task } from '../../models/task';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StandAloneStepsService } from '../../services/stand-alone-steps.service';

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
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease')
      ]),
    ])
  ]
})
export class TodayTasksComponent implements OnInit {
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  @Input() tasksInput: Task[] = []
  @Output() selectProjectEmitter = new EventEmitter<Project>();
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  standAloneStepsService = inject(StandAloneStepsService);
  stepTypeEnum = StepType;
  editDiv?: HTMLDivElement;
  hoverStepId: string | undefined = '';
  editStepId: string | undefined = '';
  tasks: Task[] = [];
  creatingNewStep = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newStepDiv?.nativeElement && !this.newStepDiv.nativeElement.contains(event.target)) {
      this.creatingNewStep = false;
    }

    if (!this.editDiv?.contains(event.target as Node)) {
      this.editStepId = '';
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.tasks = this.tasksInput
      this.fetchStandAloneSteps();
    }, 1);
  }

  fetchStandAloneSteps() {
    this.animationsService.changeIsloading(true);
    this.standAloneStepsService.getSteps().subscribe(res => {
      res.forEach(step => {
        const newTask: Task = { step: step };
        this.tasks.push(newTask);
      })
      this.animationsService.changeIsloading(false);
    });
  }

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  finishStep(task: Task) {
    // todo - index
    task.step.isComplete = true;
    this.animationsService.changeIsloading(true);
    this.httpService.updateSteps([task.step]).subscribe(res => {
      const nextStep = task.project?.steps.find(s => !s.isComplete);
      if (nextStep) {
        task.step = nextStep;
      } else {
        const taskIndex = this.tasks.indexOf(task);
        this.tasks.splice(taskIndex, 1);
      }
      this.animationsService.changeIsloading(false);
    });
  }

  createNewStep(step: Step) {
    this.animationsService.changeIsloading(true);
    step.projectId = this.standAloneStepsService.noProjectId;
    this.httpService.createStep(step).subscribe(res => {
      const newTask: Task = { project: undefined, step: res };
      this.tasks.push(newTask);
      this.creatingNewStep = false;
      this.animationsService.changeIsloading(false);
    })
  }

  hideStepForToday(task: Task) {
    this.animationsService.changeIsloading(true);
    task.step.hideTaskDate = new Date();
    this.httpService.updateSteps([task.step]).subscribe(res => {
      const taskIndex = this.tasks.indexOf(task)
      this.tasks.splice(taskIndex, 1);
      this.animationsService.changeIsloading(false);
    })
  }

  openProject(project: Project) {
    this.selectProjectEmitter.emit(project);
  }

  updateStep(project: Project | undefined, newStep: Step, oldStep: Step) {
    this.animationsService.changeIsloading(true);
    this.httpService.updateSteps([newStep]).subscribe(res => {
      if (project) {
        project.steps = project?.steps?.map(step =>
          step.id === res[0].id ? res[0] : step
        )
      } else {
        oldStep = newStep;
      }
      this.editStepId = '';
      this.animationsService.changeIsloading(false);
    })
  }
}
