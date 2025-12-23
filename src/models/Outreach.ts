import { OutreachMethod } from "./OutreachMethod";

export class Outreach {
     id: string;
     contactId: string;
     userId: string;
     method: OutreachMethod;
     dateTime: Date;
     subject?: string;
     messagePreview?: string;
     notes?: string;
     responseReceived: boolean;
     responseDate?: Date;
     workflowId?: string;
     createdAt: Date;
     updatedAt: Date;

     constructor(data: {
          id: string;
          contactId: string;
          userId: string;
          method: OutreachMethod;
          dateTime: Date;
          subject?: string;
          messagePreview?: string;
          notes?: string;
          responseReceived: boolean;
          responseDate?: Date;
          workflowId?: string;
          createdAt: Date;
          updatedAt: Date;
     }) {
          this.id = data.id;
          this.contactId = data.contactId;
          this.userId = data.userId;
          this.method = data.method;
          this.dateTime = data.dateTime;
          this.subject = data.subject;
          this.messagePreview = data.messagePreview;
          this.notes = data.notes;
          this.responseReceived = data.responseReceived;
          this.responseDate = data.responseDate;
          this.workflowId = data.workflowId;
          this.createdAt = data.createdAt;
          this.updatedAt = data.updatedAt;
     }
}
