export enum FunnelStage {
     OUTREACH = "OUTREACH",
     MEETING_BOOKED = "MEETING_BOOKED",
     AE_MEETING = "AE_MEETING",
     OPPORTUNITY_CREATED = "OPPORTUNITY_CREATED",
     STAGE_1 = "STAGE_1",
     LOST = "LOST",
     INACTIVE = "INACTIVE",
}

export type FunnelStageType = keyof typeof FunnelStage;
