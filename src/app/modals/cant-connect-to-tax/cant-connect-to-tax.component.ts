import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-cant-connect-to-tax',
  imports: [],
  templateUrl: './cant-connect-to-tax.component.html',
  styleUrl: './cant-connect-to-tax.component.scss'
})
export class CantConnectToTaxComponent {
  systemName = 'test';
  dialogRef = inject(MatDialogRef<CantConnectToTaxComponent>);
  apiKeyPage = '';
  arielsNumber = environment.arielsNumber;
  userName = '';
  authenticationService = inject(AuthenticationService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { systemName: string, apiKeyPage: string }) {
    this.systemName = data.systemName;
    this.apiKeyPage = data.apiKeyPage ?? '';
    this.userName = this.authenticationService.getUserName() ?? '';
  }

  openApiKeyPage() {
    if (this.apiKeyPage) {
      window.open(this.apiKeyPage, '_blank');
    }
  }

  openWhatsapp() {
    const message = `היי, כאן ${this.userName}. נתקלתי בבעיה ביצירת מסמך חשבונאי`;
    const url = `https://wa.me/${this.arielsNumber}?text=${message}`;
    window.open(url, '_blank');
  }

  closeModal() {
    this.dialogRef.close();
  }
}
