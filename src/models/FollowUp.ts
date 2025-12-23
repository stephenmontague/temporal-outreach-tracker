import { OutreachMethod } from "./OutreachMethod";

export class FollowUp {
     id: string;
     outreachId: string;
     contactId: string;
     scheduledDate: Date;
     method: OutreachMethod;
     notes?: string;
     completed: boolean;
     completedDate?: Date;
     isSalesforceManaged: boolean;
     workflowTimerId?: string;
     reminderSent: boolean;
     createdAt: Date;
     updatedAt: Date;

     constructor(data: {
          id: string;
          outreachId: string;
          contactId: string;
          scheduledDate: Date;
          method: OutreachMethod;
          notes?: string;
          completed: boolean;
          completedDate?: Date;
          isSalesforceManaged: boolean;
          workflowTimerId?: string;
          reminderSent: boolean;
          createdAt: Date;
          updatedAt: Date;
     }) {
          this.id = data.id;
          this.outreachId = data.outreachId;
          this.contactId = data.contactId;
          this.scheduledDate = data.scheduledDate;
          this.method = data.method;
          this.notes = data.notes;
          this.completed = data.completed;
          this.completedDate = data.completedDate;
          this.isSalesforceManaged = data.isSalesforceManaged;
          this.workflowTimerId = data.workflowTimerId;
          this.reminderSent = data.reminderSent;
          this.createdAt = data.createdAt;
          this.updatedAt = data.updatedAt;
     }
}
