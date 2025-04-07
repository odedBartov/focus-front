import { Step } from "./step";

export class Project {
    id: string;
    name: string;
    description: string;
    progress: number;
    startDate: Date;
    EndDate: Date;
    updateClient: boolean;
    basePrice: number;
    paidMoney: number;
    steps: Step[];

    constructor() {
        this.id = '';
        this.name = '';
        this.description = '';
        this.progress = 30;
        this.startDate = new Date();
        this.EndDate = new Date();
        this.updateClient = false;
        this.basePrice = 10000;
        this.paidMoney = 30;
        const t1 = new Step();
        const t2 = new Step();
        t1.name = "חוזה חתום";
        t2.name = "תשלום 1";
        this.steps = [t1, t2];
    }
}