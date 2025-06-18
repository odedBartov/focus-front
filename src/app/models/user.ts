export class User {
    firstName = '';
    lastName = '';
    status?: UserStatus;
    profession?: profession;
    email?: string;
}

export enum UserStatus {
    exemptDealer,
    authorizedDealer,
    company
}

export const userStatusesWithText: { status: UserStatus, text: string, icon: string }[] = [
                                   { status: UserStatus.exemptDealer, text: "עוסק פטור", icon: "assets/icons/laptop.svg" }, 
                                   { status: UserStatus.authorizedDealer, text: "עוסק מורשה", icon: "assets/icons/desktop.svg" }, 
                                   { status: UserStatus.company, text: `חברה בע"מ`, icon: "assets/icons/robot_astromech.svg" }]

export enum profession {
    design,
    tech,
    content,
    selling,
    media,
    management
}

export const userProfessionsWithText: {profession: profession, text: string, icon: string}[] = [
                                      {profession: profession.design, text: "עיצוב וקריאייטיב", icon: "assets/icons/palette.svg"},
                                      {profession: profession.tech, text: "פיתוח וטכנולוגיה", icon: "assets/icons/server.svg"},
                                      {profession: profession.content, text: "תוכן, כתיבה ותרגום", icon: "assets/icons/keyboard.svg"},
                                      {profession: profession.selling, text: "שיווק ומכירות", icon: "assets/icons/chart_simple.svg"},
                                      {profession: profession.media, text: "צילום, וידאו וסאונד", icon: "assets/icons/camera_retro.svg"},
                                      {profession: profession.management, text: "ייעוץ, ניהול ותפעול", icon: "assets/icons/chair_office.svg"},
]