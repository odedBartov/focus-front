import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AutofocusDirective } from '../../helpers/AutofocusDirective';
import { taxManagementSystemEnum } from '../../models/taxSystem';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpService } from '../../services/http.service';
import { AnimationsService } from '../../services/animations.service';
import { simpleResponse } from '../../models/simpleResponse';

@Component({
  selector: 'app-connection-to-tax',
  imports: [AutofocusDirective, FormsModule, CommonModule],
  templateUrl: './connection-to-tax.component.html',
  styleUrl: './connection-to-tax.component.scss'
})
export class ConnectionToTaxComponent {
  @Output() taxSystemEmitter = new EventEmitter<taxSystemConnection>();
  httpService = inject(HttpService);
  animationsService = inject(AnimationsService);
  taxManagementSystem!: taxManagementSystemEnum;
  taxManagementSystemEnum = taxManagementSystemEnum;
  taxManagementApiKey = "";
  taxManagementCompanyId = 0;
  taxManagemantStep = 1;
  wrongCredentialsError = false;

  pickTaxManagementSystem(system: taxManagementSystemEnum) {
    this.taxManagementSystem = system;
    this.taxManagemantStep = 2;
  }

  confirmApiUrl() {
    this.wrongCredentialsError = false;
    this.animationsService.isLoading.set(true);
    this.httpService.loginToTaxManagement(this.taxManagementApiKey ?? '', this.taxManagementCompanyId, this.taxManagementSystem).subscribe((res: simpleResponse) => {
      this.animationsService.isLoading.set(false);
      if (res.success) {
        this.taxSystemEmitter.emit({taxManagementApiKey: this.taxManagementApiKey, taxManagementCompanyId: this.taxManagementCompanyId, taxManagementSystem: this.taxManagementSystem});
      } else {
        this.wrongCredentialsError = true;
      }
    });
  }
}

export interface taxSystemConnection {
  taxManagementSystem: taxManagementSystemEnum;
  taxManagementApiKey: string;
  taxManagementCompanyId: number;
}