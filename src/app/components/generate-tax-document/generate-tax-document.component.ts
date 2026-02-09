import { AfterViewInit, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Project } from '../../models/project';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../services/http.service';
import { createDocumentResponse, taxDocumentEnum, taxDocumentLabels, TaxDocumentRequest } from '../../models/taxSystem';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CantConnectToTaxComponent } from '../../modals/cant-connect-to-tax/cant-connect-to-tax.component';
import { AnimationsService } from '../../services/animations.service';

@Component({
  selector: 'app-generate-tax-document',
  imports: [FormsModule, CommonModule],
  templateUrl: './generate-tax-document.component.html',
  styleUrl: './generate-tax-document.component.scss'
})
export class GenerateTaxDocumentComponent implements AfterViewInit {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  @Input() project!: Project;
  @Input() paymentName!: string;
  @Input() paymentPriceInput!: number;
  @Input() taxManagementApiKey!: string;
  @Output() documentCreated = new EventEmitter<void>();
  serviceName = '';
  clientName = '';
  paymentPrice = 0;
  clientMail = '';
  selectedDocumentType: taxDocumentEnum = taxDocumentEnum.invoice;
  disclaimerConfirmed = false;
  readonly documentTypeOptions: { label: string; apiValue: taxDocumentEnum }[] = [
    { label: taxDocumentLabels[taxDocumentEnum.requestForPayment], apiValue: taxDocumentEnum.requestForPayment },
    { label: taxDocumentLabels[taxDocumentEnum.receipt], apiValue: taxDocumentEnum.receipt },
    { label: taxDocumentLabels[taxDocumentEnum.invoice], apiValue: taxDocumentEnum.invoice },
    { label: taxDocumentLabels[taxDocumentEnum.invoiceReceipt], apiValue: taxDocumentEnum.invoiceReceipt }
  ];
  dialog = inject(MatDialog);



  ngAfterViewInit(): void {
    this.clientName = this.project.clientName;
    this.serviceName = this.project.name + ' - ' + this.paymentName;
    this.paymentPrice = this.paymentPriceInput;
    this.clientMail = this.project.clientMail ?? '';
    this.disclaimerConfirmed = localStorage.getItem('disclaimerConfirmed') === 'true';
  }


  confirmDisclaimer() {
    localStorage.setItem('disclaimerConfirmed', 'true');
    this.disclaimerConfirmed = true;
  }

  createAndSendDocument() {
    const request: TaxDocumentRequest = {
      apiKey: this.taxManagementApiKey,
      document: this.selectedDocumentType,
      clientName: this.clientName,
      price: this.paymentPrice,
      clientMail: this.clientMail,
      description: this.serviceName
    };

    this.animationsService.isLoading.set(true);
    this.httpService.createTaxDocument(request).subscribe((res: createDocumentResponse) => {
      this.animationsService.isLoading.set(false);
      if (res.isSuccess) {
        this.documentCreated.emit();
      } else {
        this.dialog.open(CantConnectToTaxComponent, { data: { systemName: this.documentTypeOptions[this.selectedDocumentType].label, apiKeyPage: res.apiKeyPage } });
      }
    });
  }
}
