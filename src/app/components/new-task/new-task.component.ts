import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { Step } from '../../models/step';
import { FormsModule } from '@angular/forms';
import { StepType } from '../../models/enums';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-new-task',
  imports: [CommonModule, FormsModule],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.scss'
})
export class NewTaskComponent {
  @ViewChild('newTaskDiv', { static: false }) newTaskDiv?: ElementRef;
  @ViewChild('taskText', { static: false }) taskText!: ElementRef;
  @Output() createNewStep = new EventEmitter<Step>();
  @Input() set stepInput(value: Step | undefined) {
    if (value) {
      this.isEdit = true;
      this.isShowNewStep = true;
      this.editingStep = value;
      this.stepName = value.name ?? '';
      this.startNewTask();
    }
  }

  authenticationService = inject(AuthenticationService);
  isShowNewStep = false;
  stepName = '';
  isEdit = false;
  mouseDownInside = false;
  editingStep?: Step;

  startNewTask() {
    this.isShowNewStep = true;
    setTimeout(() => {
      if (this.taskText?.nativeElement) {
        this.taskText.nativeElement.focus()
      }
    }, 1);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newTaskDiv?.nativeElement && !this.newTaskDiv.nativeElement.contains(event.target) && !this.mouseDownInside) {
      this.stepName = '';
      this.isShowNewStep = false;
    } else {
      this.mouseDownInside = true;
    }
    this.mouseDownInside = false;
  }

  createStep() {
    if (this.isEdit && this.editingStep) {
      this.isShowNewStep = false;
      this.editingStep.name = this.stepName?.trim();
      this.createNewStep.emit(this.editingStep);
      this.editingStep = undefined;
      this.stepName = '';
    } else if (this.stepName?.trim()) {
      this.isShowNewStep = false;
      const step = new Step();
      step.name = this.stepName.trim();
      step.userId = this.authenticationService.getUserId() ?? 'newStep';
      step.stepType = StepType.task;
      this.createNewStep.emit(step);
      this.stepName = '';
    } else {
      this.isShowNewStep = false;
    }
  }
}
