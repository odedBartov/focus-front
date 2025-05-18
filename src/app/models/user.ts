export class User {
    firstName = '';
    lastName = '';
}

export enum UserStatus {
    exemptDealer,
    authorizedDealer,
    company
}

export const userStatusesWithText: { status: UserStatus, text: string, icon: string }[] = [
                                   { status: UserStatus.exemptDealer, text: "עוסק פטור", icon: "assets/icons/laptop.svg" }, 
                                   { status: UserStatus.authorizedDealer, text: "עוסק מורשה", icon: "assets/icons/laptop.svg" }, 
                                   { status: UserStatus.company, text: `חברה בע"ם`, icon: "assets/icons/laptop.svg" }]

export enum profession {
    design,
    tech,
    content,
    selling,
    media,
    management
}
