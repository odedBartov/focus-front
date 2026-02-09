export enum taxManagementSystemEnum {
    iCount,
    morning,
    sumit
}

export enum taxDocumentEnum {
    requestForPayment = 0,
    receipt = 1,
    invoice = 2,
    invoiceReceipt = 3
}

export const taxDocumentLabels: Record<taxDocumentEnum, string> = {
    [taxDocumentEnum.requestForPayment]: 'חשבון עסקה',
    [taxDocumentEnum.receipt]: 'קבלה',
    [taxDocumentEnum.invoice]: 'חשבונית מס',
    [taxDocumentEnum.invoiceReceipt]: 'חשבונית מס קבלה'
};

export class TaxDocumentRequest {
    apiKey!: string;
    document!: taxDocumentEnum;
    clientName!: string;
    price!: number;
    clientMail!: string;
    description!: string;
}

export class createDocumentResponse {
    isSuccess!: boolean;
    apiKeyPage?: string;
}