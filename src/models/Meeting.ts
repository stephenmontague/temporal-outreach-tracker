export enum MeetingType {
     SOLO = "SOLO",
     WITH_AE = "WITH_AE",
}

export enum MeetingOutcome {
     POSITIVE = "POSITIVE",
     NEGATIVE = "NEGATIVE",
     RESCHEDULED = "RESCHEDULED",
     NO_SHOW = "NO_SHOW",
}

export class Meeting {
     id: string;
     contactId: string;
     userId: string;
     scheduledDate: Date;
     meetingType: MeetingType;
     duration?: number;
     location?: string;
     notes?: string;
     outcome?: MeetingOutcome;
     createdAt: Date;
     updatedAt: Date;

     constructor(data: {
          id: string;
          contactId: string;
          userId: string;
          scheduledDate: Date;
          meetingType: MeetingType;
          duration?: number;
          location?: string;
          notes?: string;
          outcome?: MeetingOutcome;
          createdAt: Date;
          updatedAt: Date;
     }) {
          this.id = data.id;
          this.contactId = data.contactId;
          this.userId = data.userId;
          this.scheduledDate = data.scheduledDate;
          this.meetingType = data.meetingType;
          this.duration = data.duration;
          this.location = data.location;
          this.notes = data.notes;
          this.outcome = data.outcome;
          this.createdAt = data.createdAt;
          this.updatedAt = data.updatedAt;
     }
}
