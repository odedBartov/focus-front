export class Project {
    id: string;
    name: string;
    description: string;
    completion: number;

    constructor() {
        this.id = '';
        this.name = '';
        this.description = '';
        this.completion = 50;
    }
}