import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

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

  constructor(@Inject(MAT_DIALOG_DATA) public data: { systemName: string, apiKeyPage: string }) {
    this.systemName = data.systemName;
    this.apiKeyPage = data.apiKeyPage ?? '';
  }

  openApiKeyPage() {
    if (this.apiKeyPage) {
      window.open(this.apiKeyPage, '_blank');
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
