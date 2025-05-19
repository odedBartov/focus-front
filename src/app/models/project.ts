import { ProjectStatus } from "./enums";
import { Step } from "./step";

export class Project {
    id?: string;
    name: string;
    subTitle: string;
    userId?: string;
    description: string;
    startDate: Date;
    endDate: Date;
    updateClient: boolean;
    basePrice: number;
    paidMoney: number;
    status: ProjectStatus;
    isPriority: boolean;
    steps: Step[];
    positionInList: number;
    totalWorkingTime: number;
    totalWorkingSessions: number;
    clientName: string;
    clientMail: string;
    links:{name: string, url: string}[];
    notes: string;

    constructor() {
        this.id = '';
        this.name = '';
        this.subTitle = '';
        this.description = '';
        this.startDate = new Date();
        this.endDate = new Date();
        this.updateClient = true;
        this.basePrice = 0;
        this.paidMoney = 0;
        this.status = ProjectStatus.active;
        this.isPriority = false;
        this.steps = [];
        this.positionInList = 0;
        this.totalWorkingTime = 1000;
        this.totalWorkingSessions = 0;
        this.clientName = '';
        this.clientMail = '';
        this.links = [];
        this.notes = '';
    }
}