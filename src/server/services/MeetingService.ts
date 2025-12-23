import { ContactEventType } from "@/models/ContactEvent";
import { FunnelStage } from "@/models/FunnelStage";
import { Meeting, MeetingType } from "@/models/Meeting";
import { ContactRepository } from "@/server/repositories/ContactRepository";
import { MeetingRepository } from "@/server/repositories/MeetingRepository";
import { ContactEventService } from "@/server/services/ContactEventService";
import { FollowUpService } from "@/server/services/FollowUpService";

export class MeetingService {
     private meetingRepository: MeetingRepository;
     private contactRepository: ContactRepository;
     private contactEventService: ContactEventService;
     private followUpService: FollowUpService;

     constructor() {
          this.meetingRepository = new MeetingRepository();
          this.contactRepository = new ContactRepository();
          this.contactEventService = new ContactEventService();
          this.followUpService = new FollowUpService();
     }

     async createMeeting(
          data: Omit<Meeting, "id" | "createdAt" | "updatedAt">
     ): Promise<Meeting> {
          // Create meeting directly in database
          const meeting = await this.meetingRepository.create({
               contactId: data.contactId,
               userId: data.userId,
               scheduledDate: data.scheduledDate,
               meetingType: data.meetingType,
               duration: data.duration,
               location: data.location,
               notes: data.notes,
          });

          // Update contact stage based on meeting type
          const newStage =
               data.meetingType === MeetingType.SOLO
                    ? FunnelStage.MEETING_BOOKED
                    : FunnelStage.AE_MEETING;

          await this.contactRepository.update(data.contactId, {
               currentFunnelStage: newStage,
          });

          // Mark all incomplete follow-ups for the contact as completed
          await this.followUpService.markCompletedByContact(
               data.contactId,
               "meeting booked"
          );

          // Record meeting created event
          await this.contactEventService.recordEvent({
               contactId: data.contactId,
               userId: data.userId,
               eventType: ContactEventType.MEETING_CREATED,
               metadata: {
                    meetingType: data.meetingType,
                    duration: data.duration,
                    location: data.location,
               },
               occurredAt: data.scheduledDate,
               meetingId: meeting.id,
          });

          return meeting;
     }

     async getMeetingById(id: string): Promise<Meeting | null> {
          return this.meetingRepository.findById(id);
     }

     async getMeetingsByContact(contactId: string): Promise<Meeting[]> {
          return this.meetingRepository.findByContactId(contactId);
     }

     async getUpcomingMeetings(userId: string): Promise<Meeting[]> {
          return this.meetingRepository.findUpcoming(userId);
     }

     async updateMeeting(
          id: string,
          data: Partial<Omit<Meeting, "id" | "createdAt" | "updatedAt">>
     ): Promise<Meeting> {
          return this.meetingRepository.update(id, data);
     }
}
