import { Project } from "./project";

export type ProjectTab = {
    id: string;
    label?: string;
    icon?: string;
    disabledIcon?: string;
    project?: Project;
    projects?: Project[];
}