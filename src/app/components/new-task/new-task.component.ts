import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { StepTask } from '../../models/stepTask';
import { FormsModule } from '@angular/forms';
import { IStepOrTask } from '../../models/stepOrTask';

@Component({
  selector: 'app-new-task',
  imports: [CommonModule, FormsModule],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.scss'
})
export class NewTaskComponent {
  @ViewChild('newTaskDiv', { static: false }) newTaskDiv?: ElementRef;
  @ViewChild('taskText', { static: false }) taskText!: ElementRef;
  @Output() createNewTask = new EventEmitter<StepTask>();
  @Input() set taskInput(value: IStepOrTask | undefined) {
    if (value && value instanceof StepTask) {
      this.isEdit = true;
      this.newTask = structuredClone(value);
      this.startNewTask();
    }
  }

  isShowNewStep = false;
  newTask: StepTask = new StepTask();
  isEdit = false;
  mouseDownInside = false;

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
      this.newTask = new StepTask();
      this.isShowNewStep = false;
    } else {
      this.mouseDownInside = true;
    }
    this.mouseDownInside = false;
  }

  @HostListener('document:keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    this.createTask();
  }

  createTask() {
    if (this.newTask.text || this.isEdit) {
      this.isShowNewStep = false;
      this.createNewTask.emit({ ...this.newTask });
      this.newTask = new StepTask();
    } else {
      this.isShowNewStep = false;
    }
  }
}
