import { Project } from "./project";
import { Step } from "./step";

export class UserProjects {
    activeProjects: Project[];
    unActiveProjects: Project[];
    noProject: Project;

    constructor() {
        this.activeProjects = [];
        this.unActiveProjects = [];
        this.noProject = new Project();
    }
}