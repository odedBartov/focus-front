import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../models/project';
import { HttpService } from '../services/http.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Step } from '../models/step';
import { LoadingService } from '../services/loading.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StepModalComponent } from '../modals/step-modal/step-modal.component';

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, MatDialogModule],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss'
})
export class ProjectPageComponent implements OnInit {
  route = inject(ActivatedRoute);
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  dialog = inject(MatDialog);
  projectId: string | null = null;
  project = signal<Project | undefined>(undefined);
  steps = signal<Step[]>([]);

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
    });
  }

  ngOnInit(): void {
    this.loadSteps();
  }

  loadSteps() {
    if (this.projectId) {
      this.loadingService.changeIsloading(true);
      this.httpService.getStep(this.projectId).subscribe(res => {
        this.loadingService.changeIsloading(false);
        if (res) {
          this.steps.set(res);
        }
      })
    }
  }

  changeStepStatus(step: Step) {
    step.isFinished = !step.isFinished;
  }

  openStepModal(step?: Step) {
    const dialogRef = this.dialog.open(StepModalComponent, { data: { step: step, project: this.project() } });

    dialogRef.afterClosed().subscribe(res => {
      if (res) { // should reload
        this.loadSteps();
      }
    })
  }
}
