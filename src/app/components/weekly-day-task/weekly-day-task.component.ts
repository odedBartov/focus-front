import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { StepOrTask } from '../../models/stepOrTask';
import { StepType } from '../../models/enums';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewTaskComponent } from '../new-task/new-task.component';
import { Project } from '../../models/project';
import { StepTask } from '../../models/stepTask';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-weekly-day-task',
  imports: [CommonModule, NewTaskComponent, DragDropModule],
  templateUrl: './weekly-day-task.component.html',
  styleUrl: './weekly-day-task.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px'
      })),
      state('expanded', style({
        height: '*'
      })),
      transition('collapsed <=> expanded', [
        animate('200ms ease')
      ]),
    ])
  ]
})
export class WeeklyDayTaskComponent {
  @ViewChild('weeklyDayTaskDiv', { static: false }) weeklyDayTaskDiv?: ElementRef;
  @Output() openProject = new EventEmitter<Project>();
  @Output() completeTask = new EventEmitter();
  @Output() createNewTaskEmitter = new EventEmitter<StepTask>();
  @Input() task!: StepOrTask;
  isHovering = false;
  isEditing = false;
  mouseDownInside = false;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.weeklyDayTaskDiv?.nativeElement && !this.weeklyDayTaskDiv.nativeElement.contains(event.target) && !this.mouseDownInside) {
      this.isEditing = false;
    } else {
      this.mouseDownInside = true;
      event.stopPropagation();
    }

    this.mouseDownInside = false;
  }

  isStepOrTaskComplete(task: StepOrTask) {
    if (task.task) {
      return task.task.isComplete;
    } else if (task.step) {
      return task.step.isComplete;
    }

    return false;
  }

  getTextForTask(task: StepOrTask): string | undefined {
    if (task.task) {
      return task.task.text;
    } else if (task.step?.stepType === StepType.payment) {
      return task.step.price + ' ₪';
    }
    return task.step?.description;
  }

  updateTask(task: StepTask) {
    this.isEditing = false;
    this.task.task = task;
    this.createNewTaskEmitter.emit(task);
  }
}
