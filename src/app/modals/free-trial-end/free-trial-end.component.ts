import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { HttpService } from '../../services/http.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-free-trial-end',
  imports: [],
  templateUrl: './free-trial-end.component.html',
  styleUrl: './free-trial-end.component.scss'
})
export class FreeTrialEndComponent {
  dialogRef = inject(MatDialogRef<FreeTrialEndComponent>);
  httpService = inject(HttpService);
  router = inject(Router);

  subscribe() {
    window.location.href = environment.subscriptionUrl;
  }

  cancel() {
    this.httpService.endFreeTrial().subscribe({
      next: () => {
        this.dialogRef.close();
        this.router.navigate(['/home']);
      }
    });
  }
}
