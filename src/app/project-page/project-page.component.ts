import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../models/project';
import { HttpService } from '../services/http.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Step } from '../models/step';
import { LoadingService } from '../services/loading.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StepModalComponent } from '../modals/step-modal/step-modal.component';
import { ConfirmationModalComponent } from '../modals/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, MatDialogModule, FormsModule],
  templateUrl: './project-page.component.html',
  styleUrl: './project-page.component.scss'
})
export class ProjectPageComponent implements OnInit {
  route = inject(ActivatedRoute);
  httpService = inject(HttpService);
  loadingService = inject(LoadingService);
  dialog = inject(MatDialog);
  @Input() set projectInput(value: Project | undefined) {
    this.project.set(value);
  }
  project = signal<Project | undefined>(undefined);
  projectId: string | null = null;
  isReadOnly = false;
  hoverExpandProject = false;

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
      this.isReadOnly = params.get('readOnly') == 'true';

    });
  }

  ngOnInit(): void {
    this.loadProject();
  }

  loadProject() {
    if (this.projectId) {
      this.loadingService.changeIsloading(true);
      this.httpService.getProject(this.projectId).subscribe({
        next: (res) => {
          if (res) {
            this.project.set(res);
            this.loadingService.changeIsloading(false);
          }
        }, error: (err) => {
          this.loadingService.changeIsloading(false);
          // show error
        }
      });
    }
  }

  updateCient() {
    this.project.update(current => ({...current, updateClient: !current?.updateClient} as Project));
  }

  changeStepStatus(step: Step) {
    step.isComplete = !step.isComplete;
    this.loadingService.changeIsloading(true);
    this.httpService.updateStep(step).subscribe({
      next: (res: Step) => {
        step = res;
        this.loadingService.changeIsloading(false);
      }, error: (err) => {
        this.loadingService.changeIsloading(false);
      }
    })
  }

  openStepModal(step?: Step) {
    const dialogRef = this.dialog.open(StepModalComponent, { data: { step: step, project: this.project() } });

    dialogRef.afterClosed().subscribe(res => {
      if (res) { // should reload
        this.loadProject();
      }
    })
  }

  showDeleteStepModal(step: Step) {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, { data: step.name });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.deleteStep(step);
      }
    })
  }

  deleteStep(step: Step) {
    if (step.id) {
      this.loadingService.changeIsloading(true);
      this.httpService.deleteStep(step.id).subscribe({
        next: (res) => {
          const stepIndex = this.project()?.steps?.indexOf(step);
          if (stepIndex !== undefined) {
            this.project()?.steps?.splice(stepIndex, 1);
          }
          this.loadingService.changeIsloading(false);
        },
        error: (err) => {
          this.loadingService.changeIsloading(false);
          // show error with toaster
        }
      });
    }
  }

  calculatePrice() {
    return this.project()?.steps?.filter(s => s.isComplete).reduce((sum, item) => sum + item.price, 0);
  }
}
