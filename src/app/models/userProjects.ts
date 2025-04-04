import { Project } from "./project";

export class UserProjects {
    activeProjects: Project[];
    frozenProjects: Project[];
    finishedProjects: Project[];

    constructor() {
        this.activeProjects = [];
        this.frozenProjects = [];
        this.finishedProjects = [];
    }
}