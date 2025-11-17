import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, Renderer2, ViewChild } from '@angular/core';
import { isStep, isStepOrTaskComplete, StepOrTask } from '../../models/stepOrTask';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewTaskComponent } from '../new-task/new-task.component';
import { Project } from '../../models/project';
import { StepTask } from '../../models/stepTask';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { areDatesEqual, getTextForTask, getTodayAtMidnightLocal, isDateBeforeToday } from '../../helpers/functions';
import { FutureRetainerStep } from '../../services/futureRetainerStep';

@Component({
  selector: 'app-weekly-day-task',
  imports: [CommonModule, NewTaskComponent, DragDropModule],
  templateUrl: './weekly-day-task.component.html',
  styleUrl: './weekly-day-task.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        marginTop: '0px'
      })),
      state('expanded', style({
        marginTop: '10px',
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
  @Output() completeTask = new EventEmitter<StepOrTask>();
  @Output() createNewTaskEmitter = new EventEmitter<StepTask>();
  @Output() createFutureRetainerStep = new EventEmitter<FutureRetainerStep>();
  @Input() task!: StepOrTask;
  @Input() isDragging!: { dragging: boolean };
  @Input() set shouldHidePlaceHolder(value: boolean) {
    const placeholder = document.querySelector('.cdk-drag-placeholder');
    if (placeholder) {
      this.renderer.setStyle(placeholder, 'display', value ? 'none' : 'flex');
    }
  }

  isStep = isStep;
  getTextForTask = getTextForTask;
  test = true;
  isHovering = false;
  isEditing = false;
  mouseDownInside = false;

  constructor(private renderer: Renderer2) { }

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
    return isStepOrTaskComplete(task);
  }

  updateTask(task: StepTask) {
    this.isEditing = false;
    if (task.text) {
      this.task.data = task;
      this.createNewTaskEmitter.emit(task);
    }
  }

  isDateBeforeToday() {
    const taskDate = this.task.data.dateOnWeekly;
    return taskDate && isDateBeforeToday(new Date(taskDate));
  }

  changeTaskStatus(isComplete: boolean) {
    this.task.data.isComplete = isComplete;
    if (!this.isDateBeforeToday()) {
      if (isStep(this.task.data) && this.task.data.isRetainerCopy) {
        const futureRetainerStep = new FutureRetainerStep();
        futureRetainerStep.modifiedDate = this.task.data.dateCreated ?? new Date();
        futureRetainerStep.newStep = this.task.data;
        futureRetainerStep.newStep.positionInWeeklyList = -1;
        this.createFutureRetainerStep.emit(futureRetainerStep);
      } else {
        this.completeTask.emit(this.task);
      }
    }
  }
}
