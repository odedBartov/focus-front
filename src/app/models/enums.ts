export enum StepType {
    task,
    payment
}

export const stepTypeLabels = {
    [StepType.task]: 'משימה',
    [StepType.payment]: 'תשלום'
  };

export enum ProjectStatus {
    active,
    frozen,
    finished
}

export enum subscriptionEnum {
    free,
    partial,
    full
}