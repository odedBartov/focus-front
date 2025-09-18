import { paymentModelEnum, ProjectStatus, projectTypeEnum } from "./enums";
import { HourlyWorkSession } from "./hourlyWorkSession";
import { RetainerPayment } from "./RetainerPayment";
import { Step } from "./step";

export class Project {
    id?: string;
    name: string;
    userId?: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    updateClient: boolean;
    status: ProjectStatus;
    isPriority: boolean;
    steps: Step[];
    positionInList: number;
    clientName: string;
    clientMail: string;
    links:{name: string, url: string}[];
    notes: string;
    ownerPicture?: string;
    projectType?: projectTypeEnum;
    paymentModel?: paymentModelEnum;
    reccuringPayment?: number;
    monthlyPaymentDay?: number;
    retainerPayment: RetainerPayment[];
    hourlyWorkSession: HourlyWorkSession[];

    constructor() {
        this.id = '';
        this.name = '';
        this.description = '';
        this.startDate = new Date();
        this.endDate = undefined;
        this.updateClient = true;
        this.status = ProjectStatus.active;
        this.isPriority = false;
        this.steps = [];
        this.positionInList = 0;
        this.clientName = '';
        this.clientMail = '';
        this.links = [];
        this.notes = '';
        this.retainerPayment = [];
        this.hourlyWorkSession = [];
    }
}