import { Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Project } from '../../models/project';
import { FormBuilder, NgForm } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { LoadingService } from '../../services/loading.service';
import { DatePipe } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
  selector: 'app-project-modal',
  imports: [NgxMaskDirective],
  providers: [provideNgxMask(), DatePipe],
  templateUrl: './project-modal.component.html',
  styleUrl: './project-modal.component.scss'
})
export class ProjectModalComponent {
  httpService = inject(HttpService);
  dialogRef = inject(MatDialogRef<ProjectModalComponent>);
  loadingService = inject(LoadingService);
  formBuilder = inject(FormBuilder);
  datePipe = inject(DatePipe);

  project: Project;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { project: Project }) {
    this.project = data.project;
  }

  save(stepForm: NgForm) {
    if (stepForm.valid) {
      this.loadingService.changeIsloading(true);
      this.httpService.updateProjects([this.project]).subscribe(res => {
        this.project = res;
        this.closeModal()
      })
    } else {
      Object.values(stepForm.controls).forEach(control => control.markAsTouched());
    }
  }

  closeModal() {
    this.loadingService.changeIsloading(false);
    this.dialogRef.close(this.project);
  }
}
