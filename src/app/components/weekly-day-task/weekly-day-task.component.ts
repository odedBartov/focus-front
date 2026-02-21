import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NewTaskComponent } from '../new-task/new-task.component';
import { Project } from '../../models/project';
import { Step } from '../../models/step';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { getTextForStep, isDateBeforeToday } from '../../helpers/functions';
import { FutureRetainerStep } from '../../services/futureRetainerStep';
import { StepType } from '../../models/enums';
import { StepWithProject } from '../../models/step-with-project';

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
export class WeeklyDayTaskComponent implements OnInit {
  @ViewChild('weeklyDayTaskDiv', { static: false }) weeklyDayTaskDiv?: ElementRef;
  @Output() openProject = new EventEmitter<Project>();
  @Output() completeTask = new EventEmitter<StepWithProject>();
  @Output() stepUpdated = new EventEmitter<Step>();
  @Output() createFutureRetainerStep = new EventEmitter<FutureRetainerStep>();
  @Input() stepItem!: StepWithProject;
  @Input() isDragging!: { dragging: boolean };
  @Input() set shouldHidePlaceHolder(value: boolean) {
    const placeholder = document.querySelector('.cdk-drag-placeholder');
    if (placeholder) {
      this.renderer.setStyle(placeholder, 'display', value ? 'none' : 'flex');
    }
  }

  getTextForStep = getTextForStep;
  isHovering = false;
  isEditing = false;
  mouseDownInside = false;
  isReadOnly = false;

  constructor(private renderer: Renderer2) { }

  ngOnInit(): void {
    this.isReadOnly = this.stepItem.step.isRetainerCopy && this.stepItem.step.stepType == StepType.payment;
  }

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

  isStepWeekly(): boolean {
    return this.stepItem.step.isRetainerCopy;
  }

  isStepComplete(): boolean {
    return this.stepItem.step?.isComplete ?? false;
  }

  updateStep(step: Step): void {
    this.isEditing = false;
    if (step.name) {
      this.stepItem.step.name = step.name;
      this.stepUpdated.emit(this.stepItem.step);
    }
  }

  isDateBeforeToday(): boolean | undefined {
    const taskDate = this.stepItem.step.dateOnWeekly;
    return taskDate && isDateBeforeToday(new Date(taskDate));
  }

  changeTaskStatus(isComplete: boolean): void {
    this.stepItem.step.isComplete = isComplete;
    if (!this.isDateBeforeToday()) {
      if (this.stepItem.step.isRetainerCopy) {
        const futureRetainerStep = new FutureRetainerStep();
        futureRetainerStep.modifiedDate = this.stepItem.step.dateCreated ?? new Date();
        futureRetainerStep.newStep = this.stepItem.step;
        futureRetainerStep.newStep.positionInWeeklyList = -1;
        this.createFutureRetainerStep.emit(futureRetainerStep);
      } else {
        this.completeTask.emit(this.stepItem);
      }
    }
  }
}
