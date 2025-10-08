export class HourlyWorkSession {
    id!: string;
    projectId!: string;
    name!: string;
    workTime!: number;
    price!: number;
    date!: Date;

    constructor() {
        this.id = '';
        this.date = new Date();
    }
}