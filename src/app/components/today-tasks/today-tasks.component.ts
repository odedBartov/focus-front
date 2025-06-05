import { Component, EventEmitter, HostListener, inject, Input, OnInit, Output } from '@angular/core';
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
  @Input() tasksInput: Task[] = []
  @Output() selectProjectEmitter = new EventEmitter<Project>();
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  isShowNewStep = false;
  stepTypeEnum = StepType;
  editDiv?: HTMLDivElement;
  hoverStepId: string | undefined = '';
  editStepId: string | undefined = '';
  tasks: Task[] = []

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // if (this.newStepDiv?.nativeElement && !this.newStepDiv.nativeElement.contains(event.target)) {
    //   this.isShowNewStep = false;
    // }

    if (!this.editDiv?.contains(event.target as Node)) {
      this.editStepId = '';
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.tasks = this.tasksInput
    }, 1);
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
      const nextStep = task.project.steps.find(s => !s.isComplete);
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

  updateStep(project: Project, newStep: Step) {
    this.animationsService.changeIsloading(true);
    this.httpService.updateSteps([newStep]).subscribe(res => {
      if (project && project.steps) {
        project.steps = project?.steps?.map(step =>
          step.id === res[0].id ? res[0] : step
        )
      }
      this.editStepId = '';
      this.animationsService.changeIsloading(false);
    })
  }
}
