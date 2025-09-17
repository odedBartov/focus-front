import { retainerPaymentTypeEnum } from "./enums";

export class RetainerPayment {
    id!: string;
    projectId!: string;
    name!: string;
    type!: retainerPaymentTypeEnum;
    price!: number;
    date!: Date;
}