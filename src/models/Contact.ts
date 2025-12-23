import { FunnelStage } from "./FunnelStage";

export class Contact {
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
     originalOutreachDateTime?: Date;
     createdAt: Date;
     updatedAt: Date;

     constructor(data: {
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
          originalOutreachDateTime?: Date;
          createdAt: Date;
          updatedAt: Date;
     }) {
          this.id = data.id;
          this.userId = data.userId;
          this.firstName = data.firstName;
          this.lastName = data.lastName;
          this.company = data.company;
          this.email = data.email;
          this.slackUsername = data.slackUsername;
          this.phoneNumber = data.phoneNumber;
          this.linkedinUrl = data.linkedinUrl;
          this.notes = data.notes;
          this.currentFunnelStage = data.currentFunnelStage;
          this.isInSalesforceCadence = data.isInSalesforceCadence;
          this.originalOutreachDateTime = data.originalOutreachDateTime;
          this.createdAt = data.createdAt;
          this.updatedAt = data.updatedAt;
     }

     // Validation: firstName OR slackUsername must be provided
     static validate(data: Partial<Contact>): boolean {
          return !!(data.firstName || data.slackUsername);
     }
}
