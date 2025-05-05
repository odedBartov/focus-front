export enum StepType {
    task,
    payment,
    coomunication
}

export const stepTypeLabels = {
    [StepType.task]: 'משימה',
    [StepType.payment]: 'תשלום',
    [StepType.coomunication]: 'תקשורת',
  };

export enum ProjectStatus {
    active,
    frozen,
    finished
}