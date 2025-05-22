import { Component } from '@angular/core';
import { Step } from '../models/step';
import { Project } from '../models/project';

@Component({
  selector: 'app-today-tasks',
  imports: [],
  templateUrl: './today-tasks.component.html',
  styleUrl: './today-tasks.component.scss'
})
export class TodayTasksComponent {
  tasks: {step: Step, project: Project}[] = []
}
