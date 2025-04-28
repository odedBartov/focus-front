import { Project } from "./project";

export type ProjectTab = {
    id: string;
    label?: string;
    icon?: string;
    project?: Project;
}