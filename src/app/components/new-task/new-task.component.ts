import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Output, ViewChild } from '@angular/core';
import { StepTask } from '../../models/stepTask';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-task',
  imports: [CommonModule, FormsModule],
  templateUrl: './new-task.component.html',
  styleUrl: './new-task.component.scss'
})
export class NewTaskComponent {
  @ViewChild('newStepDiv', { static: false }) newStepDiv?: ElementRef;
  @Output() createNewTask = new EventEmitter<StepTask>();
  isShowNewStep = false;
  newTask: StepTask = new StepTask();

  constructor() { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.newStepDiv?.nativeElement && !this.newStepDiv.nativeElement.contains(event.target)) {
      this.isShowNewStep = false;
    }
  }

  createTask() {    
    if (this.newTask.text) { // show error
      this.isShowNewStep = false;
      this.createNewTask.emit(this.newTask);
    }
  }
}
