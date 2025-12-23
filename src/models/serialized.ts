import { FunnelStage } from "./FunnelStage";
import { OutreachMethod } from "./OutreachMethod";

// Serialized types for data passed from Server Components to Client Components
// Date fields become strings after JSON.parse(JSON.stringify()) serialization

export interface SerializedContact {
     id: string;
     userId: string;
     firstName: string;
     lastName?: string;
     company?: string;
     email?: string;
     slackUsername?: string;
     phoneNumber?: string;
     linkedinUrl?: string;
     notes?: string;
     currentFunnelStage: FunnelStage;
     isInSalesforceCadence: boolean;
     createdAt: string;
     updatedAt: string;
}

export interface SerializedFollowUp {
     id: string;
     outreachId: string;
     contactId: string;
     scheduledDate: string;
     method: OutreachMethod | string;
     notes?: string | null;
     completed: boolean;
     completedDate?: string | null;
     isSalesforceManaged: boolean;
     workflowTimerId?: string | null;
     reminderSent: boolean;
     createdAt: string;
     updatedAt: string;
}

export interface SerializedOutreach {
     id: string;
     contactId: string;
     userId: string;
     method: OutreachMethod | string;
     dateTime: string;
     subject?: string | null;
     messagePreview?: string | null;
     notes?: string | null;
     responseReceived: boolean;
     responseDate?: string | null;
     workflowId?: string | null;
     createdAt: string;
     updatedAt: string;
}

export interface SerializedContactEvent {
     id: string;
     contactId: string;
     userId: string;
     eventType: string;
     metadata: Record<string, unknown> | null;
     outreachId?: string | null;
     meetingId?: string | null;
     opportunityId?: string | null;
     followUpId?: string | null;
     workflowId?: string | null;
     occurredAt: string;
     createdAt: string;
}
