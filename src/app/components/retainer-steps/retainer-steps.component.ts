import { Component, Input } from '@angular/core';
import { Project } from '../../models/project';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-retainer-steps',
  imports: [CommonModule],
  templateUrl: './retainer-steps.component.html',
  styleUrl: './retainer-steps.component.scss'
})
export class RetainerStepsComponent {
  @Input() project!: Project;
}
