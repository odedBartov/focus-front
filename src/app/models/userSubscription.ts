import { subscriptionEnum } from "./enums";

export class UserSubscription {
    title!: string;
    subscription!: subscriptionEnum;
    text!: string;
    price?: number;
}