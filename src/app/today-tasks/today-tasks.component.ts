import { Component, inject, Input } from '@angular/core';
import { Step } from '../models/step';
import { Project } from '../models/project';
import { CommonModule } from '@angular/common';
import { StepType } from '../models/enums';
import { HttpService } from '../services/http.service';
import { LoadingService } from '../services/loading.service';
import { NewStepComponent } from '../new-step/new-step.component';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-today-tasks',
  imports: [CommonModule, NewStepComponent],
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
export class TodayTasksComponent {
  @Input() tasks: { step: Step, project: Project }[] = []
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  isShowNewStep = false;
  stepTypeEnum = StepType;
  editDiv?: HTMLDivElement;
  hoverStepId: string | undefined = '';
  editStepId: string | undefined = '';

  editStep(div: HTMLDivElement, stepId: string | undefined) {
    this.editDiv = div;
    this.editStepId = stepId;
  }

  finishStep(task: { step: Step, project: Project }) {
    // todo - index
    task.step.isComplete = true;
    this.loadingService.changeIsloading(true);
    this.httpService.updateSteps([task.step]).subscribe(res => {
      const nextStep = task.project.steps.find(s => !s.isComplete);
      if (nextStep) {
        task.step = nextStep;
      } else {
        const taskIndex = this.tasks.indexOf(task);
        this.tasks.splice(taskIndex, 1);
      }
      this.loadingService.changeIsloading(false);
    });
  }

  createNewStep(step: Step) {

  }
}
