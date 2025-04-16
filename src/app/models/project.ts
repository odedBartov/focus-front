import { ProjectStatus } from "./enums";
import { Step } from "./step";

export class Project {
    id?: string;
    name: string;
    userEmail: string;
    description: string;
    progress: number;
    startDate: Date;
    endDate: Date;
    updateClient: boolean;
    basePrice: number;
    paidMoney: number;
    status: ProjectStatus;
    steps?: Step[];

    constructor() {
        this.id = '';
        this.name = '';
        this.userEmail = '';
        this.description = '';
        this.progress = 30;
        this.startDate = new Date();
        this.endDate = new Date();
        this.updateClient = false;
        this.basePrice = 10000;
        this.paidMoney = 30;
        this.status = ProjectStatus.active;
    }
}