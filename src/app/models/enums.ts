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
    free = 1,
    partial = 2,
    full = 3,
    trial = 4
}

export enum projectTypeEnum {
    proccess,
    retainer
}

export enum paymentModelEnum {
    hourly,
    monthly
}