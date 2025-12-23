export enum OutreachMethod {
     EMAIL = "EMAIL",
     SLACK = "SLACK",
     PHONE = "PHONE",
     LINKEDIN = "LINKEDIN",
     OTHER = "OTHER",
}

export type OutreachMethodType = keyof typeof OutreachMethod;
