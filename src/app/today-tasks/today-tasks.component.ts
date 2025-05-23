import { Component, Input } from '@angular/core';
import { Step } from '../models/step';
import { Project } from '../models/project';
import { CommonModule } from '@angular/common';
import { StepType } from '../models/enums';

@Component({
  selector: 'app-today-tasks',
  imports: [CommonModule],
  templateUrl: './today-tasks.component.html',
  styleUrl: './today-tasks.component.scss'
})
export class TodayTasksComponent {
  @Input() tasks: {step: Step, project: Project}[] = []
  stepTypeEnum = StepType;
}
