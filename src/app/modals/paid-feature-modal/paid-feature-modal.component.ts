import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { subscriptionEnum } from '../../models/enums';

@Component({
  selector: 'app-paid-feature-modal',
  imports: [],
  templateUrl: './paid-feature-modal.component.html',
  styleUrl: './paid-feature-modal.component.scss'
})
export class PaidFeatureModalComponent {
  dialogRef = inject(MatDialogRef<PaidFeatureModalComponent>);
  text = 'הפיצ׳ר הזה פתוח למנויים בתשלום בלבד.';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { subscription: subscriptionEnum }) {
    if (data?.subscription === subscriptionEnum.full) {
      this.text = 'הפיצ׳ר הזה פתוח למנויי ׳פוקוס על מלא׳ בלבד.';
    }
  }

  upgrade() {
    window.location.href = environment.subscriptionUrl;
  }

  close() {
    this.dialogRef.close();
  }
}
