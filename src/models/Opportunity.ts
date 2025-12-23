export enum OpportunityStage {
     CREATED = "CREATED",
     STAGE_1 = "STAGE_1",
}

export class Opportunity {
     id: string;
     contactId: string;
     userId: string;
     salesforceOpportunityId?: string;
     stage: OpportunityStage;
     stage1Date?: Date;
     value?: number;
     probability?: number;
     notes?: string;
     createdAt: Date;
     updatedAt: Date;

     constructor(data: {
          id: string;
          contactId: string;
          userId: string;
          salesforceOpportunityId?: string;
          stage: OpportunityStage;
          stage1Date?: Date;
          value?: number;
          probability?: number;
          notes?: string;
          createdAt: Date;
          updatedAt: Date;
     }) {
          this.id = data.id;
          this.contactId = data.contactId;
          this.userId = data.userId;
          this.salesforceOpportunityId = data.salesforceOpportunityId;
          this.stage = data.stage;
          this.stage1Date = data.stage1Date;
          this.value = data.value;
          this.probability = data.probability;
          this.notes = data.notes;
          this.createdAt = data.createdAt;
          this.updatedAt = data.updatedAt;
     }
}
