import { AfterViewInit, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Project } from '../../models/project';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../services/http.service';
import { createDocumentResponse, taxDocumentEnum, taxDocumentLabels, TaxDocumentRequest, taxManagementSystemEnum } from '../../models/taxSystem';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CantConnectToTaxComponent } from '../../modals/cant-connect-to-tax/cant-connect-to-tax.component';
import { AnimationsService } from '../../services/animations.service';
import { Step } from '../../models/step';
import { UserStatus } from '../../models/user';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-generate-tax-document',
  imports: [FormsModule, CommonModule],
  templateUrl: './generate-tax-document.component.html',
  styleUrl: './generate-tax-document.component.scss'
})
export class GenerateTaxDocumentComponent implements AfterViewInit {
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  authenticationService = inject(AuthenticationService);
  @Input() project!: Project;
  @Input() paymentName!: string;
  @Input() paymentPriceInput!: number;
  @Input() step!: Step;
  @Output() documentCreated = new EventEmitter<void>();
  taxManagementApiKey!: string;
  companyId?: number;
  taxManagementSystem!: taxManagementSystemEnum;
  userStatus!: UserStatus;
  serviceName = '';
  clientName = '';
  paymentPrice = 0;
  clientMail = '';
  selectedDocumentType?: taxDocumentEnum;
  disclaimerConfirmed = false;
  documentTypeOptions: { label: string; apiValue: taxDocumentEnum }[] = [];
  dialog = inject(MatDialog);

  ngAfterViewInit(): void {
    this.clientName = this.project.clientName;
    this.serviceName = this.project.name + ' - ' + this.paymentName;
    this.paymentPrice = this.paymentPriceInput;
    this.clientMail = this.project.clientMail ?? '';
    this.disclaimerConfirmed = localStorage.getItem('disclaimerConfirmed') === 'true';
    this.userStatus = this.authenticationService.getUserStatus();
    this.taxManagementSystem = this.authenticationService.getUserTaxManagementSystem() ?? taxManagementSystemEnum.iCount;
    this.taxManagementApiKey = this.authenticationService.getUserApiKey() ?? '';
    this.companyId = this.authenticationService.getUserTaxManagementCompanyId() ?? 0;
    this.initDocumentTypeOptions();
  }

  confirmDisclaimer() {
    localStorage.setItem('disclaimerConfirmed', 'true');
    this.disclaimerConfirmed = true;
  }

  private readonly documentTypeToRelatedDocKey: Record<taxDocumentEnum, keyof NonNullable<Step['relatedDocuments']>> = {
    [taxDocumentEnum.requestForPayment]: 'requestForPayment',
    [taxDocumentEnum.receipt]: 'receipt',
    [taxDocumentEnum.invoice]: 'invoice',
    [taxDocumentEnum.invoiceReceipt]: 'invoiceReceipt',
  };

  isDocumentTypeAlreadyCreated(apiValue?: taxDocumentEnum): boolean {
    if (apiValue === undefined || apiValue === null) {
      return false;
    }
    const key = this.documentTypeToRelatedDocKey[apiValue];
    return !!(this.step?.relatedDocuments?.[key]);
  }

  initDocumentTypeOptions() {
    this.documentTypeOptions = [];
    const requestForPaymentOption = { label: taxDocumentLabels[taxDocumentEnum.requestForPayment], apiValue: taxDocumentEnum.requestForPayment };
    const receiptOption = { label: taxDocumentLabels[taxDocumentEnum.receipt], apiValue: taxDocumentEnum.receipt };
    const invoiceOption = { label: taxDocumentLabels[taxDocumentEnum.invoice], apiValue: taxDocumentEnum.invoice };
    const invoiceReceiptOption = { label: taxDocumentLabels[taxDocumentEnum.invoiceReceipt], apiValue: taxDocumentEnum.invoiceReceipt };

    this.documentTypeOptions.push(requestForPaymentOption);
    if (this.userStatus.toString() === UserStatus.exemptDealer.toString()) {
      this.documentTypeOptions.push(receiptOption);
    } else {
      this.documentTypeOptions.push(invoiceReceiptOption);
    }

    // If current selection is already created, switch to first available option
    if (this.isDocumentTypeAlreadyCreated(this.selectedDocumentType)) {
      const firstAvailable = this.documentTypeOptions.find(opt => !this.isDocumentTypeAlreadyCreated(opt.apiValue));
      if (firstAvailable) {
        this.selectedDocumentType = firstAvailable.apiValue;
      }
    }
  }

  createAndSendDocument() {
    const request: TaxDocumentRequest = {
      apiKey: this.taxManagementApiKey,
      document: this.selectedDocumentType!,
      clientName: this.clientName,
      price: this.paymentPrice,
      clientMail: this.clientMail,
      description: this.serviceName,
      system: this.taxManagementSystem,
      stepId: this.step.id,
      CompanyID: this.companyId
    };
    if (this.step.relatedDocuments?.requestForPayment) {
      request.relatedDocument = this.step.relatedDocuments.requestForPayment;
    }

    this.animationsService.isLoading.set(true);
    this.httpService.createTaxDocument(request).subscribe((res: createDocumentResponse) => {
      this.animationsService.isLoading.set(false);
      if (res.isSuccess) {
        this.documentCreated.emit();
      } else {
        this.dialog.open(CantConnectToTaxComponent, { data: { systemName: this.documentTypeOptions.find(opt => opt.apiValue === this.selectedDocumentType)?.label ?? '', apiKeyPage: res.apiKeyPage } });
      }
    });
  }
}
