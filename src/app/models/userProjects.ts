import { Project } from "./project";

export class UserProjects {
    activeProjects: Project[];
    unActiveProjects: Project[];

    constructor() {
        this.activeProjects = [];
        this.unActiveProjects = [];
    }
}