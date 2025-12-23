import {
     ContactEvent,
     ContactEventType,
     ContactEventMetadata,
} from "@/models/ContactEvent";
import { ContactEventRepository } from "@/server/repositories/ContactEventRepository";

export interface RecordEventParams {
     contactId: string;
     userId: string;
     eventType: ContactEventType;
     metadata?: ContactEventMetadata | null;
     occurredAt?: Date;
     outreachId?: string;
     meetingId?: string;
     opportunityId?: string;
     followUpId?: string;
     workflowId?: string;
}

export class ContactEventService {
     private contactEventRepository: ContactEventRepository;

     constructor() {
          this.contactEventRepository = new ContactEventRepository();
     }

     async recordEvent(params: RecordEventParams): Promise<ContactEvent> {
          const occurredAt = params.occurredAt || new Date();

          // First, check for idempotency - if an identical event exists, return it
          const existingEvent = await this.contactEventRepository.findByCharacteristics({
               contactId: params.contactId,
               eventType: params.eventType,
               workflowId: params.workflowId,
               outreachId: params.outreachId,
               meetingId: params.meetingId,
               opportunityId: params.opportunityId,
               followUpId: params.followUpId,
               metadata: (params.metadata as Record<string, unknown> | null) || null,
          });

          if (existingEvent) {
               // Event already exists, return it (idempotent)
               return existingEvent;
          }

          // Get the latest event to determine the correct timestamp
          const latestEvent =
               await this.contactEventRepository.findLatestByContactId(
                    params.contactId
               );

          // If the provided timestamp is before the latest event, adjust it deterministically
          // Use latest event time + 1ms to maintain chronological order
          const adjustedOccurredAt =
               latestEvent && occurredAt < latestEvent.occurredAt
                    ? new Date(latestEvent.occurredAt.getTime() + 1)
                    : occurredAt;

          const event = await this.contactEventRepository.create({
               contactId: params.contactId,
               userId: params.userId,
               eventType: params.eventType,
               metadata: params.metadata || null,
               occurredAt: adjustedOccurredAt,
               outreachId: params.outreachId,
               meetingId: params.meetingId,
               opportunityId: params.opportunityId,
               followUpId: params.followUpId,
               workflowId: params.workflowId,
          });

          return event;
     }

     async getTimeline(contactId: string): Promise<ContactEvent[]> {
          // Get events ordered by occurredAt (oldest first for timeline display)
          const events = await this.contactEventRepository.findByContactId(
               contactId
          );

          // Reverse to show oldest first (chronological order)
          return events.reverse();
     }

     async getEventsByType(
          contactId: string,
          eventType: ContactEventType
     ): Promise<ContactEvent[]> {
          return this.contactEventRepository.findByContactIdAndType(
               contactId,
               eventType
          );
     }
}
