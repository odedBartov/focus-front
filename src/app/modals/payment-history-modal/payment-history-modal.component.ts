import { Component, Inject, inject } from '@angular/core';
import { RetainerPayment } from '../../models/RetainerPayment';
import { HourlyWorkSession } from '../../models/hourlyWorkSession';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { retainerPaymentTypeEnum } from '../../models/enums';

@Component({
  selector: 'app-payment-history-modal',
  imports: [CommonModule],
  templateUrl: './payment-history-modal.component.html',
  styleUrl: './payment-history-modal.component.scss'
})
export class PaymentHistoryModalComponent {
  dialogRef = inject(MatDialogRef<PaymentHistoryModalComponent>);
  retainerPaymentTypeEnum = retainerPaymentTypeEnum;
  payments: (RetainerPayment | HourlyWorkSession)[] = [];
  isPaymentModelHourly = false;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { payments: (RetainerPayment | HourlyWorkSession)[], isPaymentModelHourly: boolean }) {
    this.payments = data.payments;
    this.isPaymentModelHourly = data.isPaymentModelHourly;
  }

  getHourlyWorkSession(payment: RetainerPayment | HourlyWorkSession): HourlyWorkSession {
    return payment as HourlyWorkSession;
  }

  getRetainerPayment(payment: RetainerPayment | HourlyWorkSession): RetainerPayment {
    return payment as RetainerPayment;
  }

  getretainerPaymentText(paymentType: retainerPaymentTypeEnum) {
    return paymentType === retainerPaymentTypeEnum.mothly ? 'חודשי' : 'חד פעמי';
  }

  getTotalPayments() {
    return this.payments.reduce((acc, curr) => acc + curr.price, 0);
  }

  deletePayment(payment: RetainerPayment | HourlyWorkSession) {
    const index = this.payments.indexOf(payment);
    if (index > -1) {
      this.payments.splice(index, 1);
    }

    //call http
  }
}
