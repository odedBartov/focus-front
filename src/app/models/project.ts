export class Project {
    id: string;
    name: string;
    description: string;
    progress: number;

    constructor() {
        this.id = '';
        this.name = '';
        this.description = '';
        this.progress = 30;
    }
}