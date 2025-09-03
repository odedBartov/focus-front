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
  arielsNumber = environment.arielsNumber;
  msg = "היי, אני רוצה לקבל חודש נוסף של פוקוס על מלא";

  subscribe() {
    window.location.href = environment.subscriptionUrl;
  }

  sendWhatsapp() {
    window.open(`https://wa.me/${this.arielsNumber}?text=${encodeURIComponent(this.msg)}`);
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
