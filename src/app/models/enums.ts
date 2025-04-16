export enum StepType {
    work,
    payment,
    other
}

export const stepTypeLabels = {
    [StepType.work]: 'עבודה',
    [StepType.payment]: 'תשלום',
    [StepType.other]: 'אחר',
  };

export enum ProjectStatus {
    active,
    frozen,
    finished
}