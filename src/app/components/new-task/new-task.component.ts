import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { StepTask } from '../../models/stepTask';
import { FormsModule } from '@angular/forms';
import { AutoResizeInputDirective } from '../../helpers/autoResizeInputDirectory';
import { Task } from '../../models/task';

@Component({
  selector: 'app-new-task',
  imports: [CommonModule, FormsModule, AutoResizeInputDirective],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.scss'
})
export class NewTaskComponent {
  @ViewChild('newTaskDiv', { static: false }) newTaskDiv?: ElementRef;
  @ViewChild('taskText', { static: false }) taskText!: ElementRef;
  @Output() createNewTask = new EventEmitter<StepTask>();
  @Input() set taskInput(value: StepTask | undefined) {
    if (value) {
      this.isEdit = true;
      this.newTask = structuredClone(value);
    }
  }
  isShowNewStep = false;
  newTask: StepTask = new StepTask();
  showError = false;
  isEdit = false;

  constructor() { }

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
    if (this.newTaskDiv?.nativeElement && !this.newTaskDiv.nativeElement.contains(event.target)) {
      this.isShowNewStep = false;
    } else {
      event.stopPropagation();
    }
  }

  @HostListener('document:keydown.enter', ['$event'])
  handleEnterKey(event: KeyboardEvent) {
    const active = document.activeElement as HTMLElement;
    if (active && this.newTaskDiv?.nativeElement.contains(active)) {
      active.click();
    }
  }

  createTask() {
    if (this.newTask.text) {
      this.isShowNewStep = false;
      this.createNewTask.emit(this.newTask);
    } else {
      this.showError = true;
    }
  }
}
