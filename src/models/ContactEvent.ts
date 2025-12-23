export enum ContactEventType {
     OUTREACH_CREATED = "OUTREACH_CREATED",
     OUTREACH_RESPONSE_RECEIVED = "OUTREACH_RESPONSE_RECEIVED",
     STAGE_CHANGED = "STAGE_CHANGED",
     MEETING_CREATED = "MEETING_CREATED",
     MEETING_COMPLETED = "MEETING_COMPLETED",
     OPPORTUNITY_CREATED = "OPPORTUNITY_CREATED",
     OPPORTUNITY_STAGE_CHANGED = "OPPORTUNITY_STAGE_CHANGED",
     FOLLOW_UP_SCHEDULED = "FOLLOW_UP_SCHEDULED",
     FOLLOW_UP_COMPLETED = "FOLLOW_UP_COMPLETED",
     NOTE_ADDED = "NOTE_ADDED",
     CONTACT_UPDATED = "CONTACT_UPDATED",
}

// Metadata interfaces for different event types
export interface StageChangedMetadata {
     fromStage: string;
     toStage: string;
}

export interface OutreachCreatedMetadata {
     method: string;
     subject?: string;
}

export interface OutreachResponseReceivedMetadata {
     method: string;
     responseDate: string;
}

export interface MeetingCreatedMetadata {
     meetingType: string;
     duration?: number;
     location?: string;
}

export interface MeetingCompletedMetadata {
     outcome: string;
     notes?: string;
}

export interface OpportunityCreatedMetadata {
     stage: string;
     value?: number;
     probability?: number;
}

export interface OpportunityStageChangedMetadata {
     fromStage: string;
     toStage: string;
}

export interface FollowUpScheduledMetadata {
     method: string;
     scheduledDate: string;
}

export interface FollowUpCompletedMetadata {
     method: string;
     completedDate: string;
}

export interface NoteAddedMetadata {
     note: string;
}

export interface ContactUpdatedMetadata {
     fields: string[];
}

export type ContactEventMetadata =
     | StageChangedMetadata
     | OutreachCreatedMetadata
     | OutreachResponseReceivedMetadata
     | MeetingCreatedMetadata
     | MeetingCompletedMetadata
     | OpportunityCreatedMetadata
     | OpportunityStageChangedMetadata
     | FollowUpScheduledMetadata
     | FollowUpCompletedMetadata
     | NoteAddedMetadata
     | ContactUpdatedMetadata
     | Record<string, unknown>;

export class ContactEvent {
     id: string;
     contactId: string;
     userId: string;
     eventType: ContactEventType;
     metadata: ContactEventMetadata | null;
     outreachId?: string;
     meetingId?: string;
     opportunityId?: string;
     followUpId?: string;
     workflowId?: string;
     occurredAt: Date;
     createdAt: Date;

     constructor(data: {
          id: string;
          contactId: string;
          userId: string;
          eventType: ContactEventType;
          metadata: ContactEventMetadata | null;
          outreachId?: string;
          meetingId?: string;
          opportunityId?: string;
          followUpId?: string;
          workflowId?: string;
          occurredAt: Date;
          createdAt: Date;
     }) {
          this.id = data.id;
          this.contactId = data.contactId;
          this.userId = data.userId;
          this.eventType = data.eventType;
          this.metadata = data.metadata;
          this.outreachId = data.outreachId;
          this.meetingId = data.meetingId;
          this.opportunityId = data.opportunityId;
          this.followUpId = data.followUpId;
          this.workflowId = data.workflowId;
          this.occurredAt = data.occurredAt;
          this.createdAt = data.createdAt;
     }
}

