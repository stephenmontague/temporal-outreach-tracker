import { toDate } from "@/lib/utils";
import { ContactEvent, ContactEventType } from "@/models/ContactEvent";
import { db } from "@/server/database/connection";
import { contactEvents } from "@/server/database/schema";
import { eq, and, desc, or, sql, SQL, gte, lte } from "drizzle-orm";

export class ContactEventRepository {
     async create(
          data: Omit<ContactEvent, "id" | "createdAt">
     ): Promise<ContactEvent> {
          const [event] = await db
               .insert(contactEvents)
               .values({
                    contactId: data.contactId,
                    userId: data.userId,
                    eventType: data.eventType,
                    metadata: data.metadata as Record<string, unknown> | null,
                    outreachId: data.outreachId,
                    meetingId: data.meetingId,
                    opportunityId: data.opportunityId,
                    followUpId: data.followUpId,
                    workflowId: data.workflowId,
                    occurredAt: data.occurredAt,
               })
               .returning();

          return this.mapToContactEvent(event);
     }

     async createWithId(
          id: string,
          data: Omit<ContactEvent, "id" | "createdAt">
     ): Promise<ContactEvent> {
          const [event] = await db
               .insert(contactEvents)
               .values({
                    id,
                    contactId: data.contactId,
                    userId: data.userId,
                    eventType: data.eventType,
                    metadata: data.metadata as Record<string, unknown> | null,
                    outreachId: data.outreachId,
                    meetingId: data.meetingId,
                    opportunityId: data.opportunityId,
                    followUpId: data.followUpId,
                    workflowId: data.workflowId,
                    occurredAt: data.occurredAt,
               })
               .returning();

          return this.mapToContactEvent(event);
     }

     async findByContactId(contactId: string): Promise<ContactEvent[]> {
          const results = await db
               .select()
               .from(contactEvents)
               .where(eq(contactEvents.contactId, contactId))
               .orderBy(desc(contactEvents.occurredAt), desc(contactEvents.createdAt));

          return results.map((e) => this.mapToContactEvent(e));
     }

     async findLatestByContactId(contactId: string): Promise<ContactEvent | null> {
          const [event] = await db
               .select()
               .from(contactEvents)
               .where(eq(contactEvents.contactId, contactId))
               .orderBy(desc(contactEvents.occurredAt), desc(contactEvents.createdAt))
               .limit(1);

          return event ? this.mapToContactEvent(event) : null;
     }

     async findByContactIdAndType(
          contactId: string,
          eventType: ContactEventType
     ): Promise<ContactEvent[]> {
          const results = await db
               .select()
               .from(contactEvents)
               .where(
                    and(
                         eq(contactEvents.contactId, contactId),
                         eq(contactEvents.eventType, eventType)
                    )
               )
               .orderBy(desc(contactEvents.occurredAt), desc(contactEvents.createdAt));

          return results.map((e) => this.mapToContactEvent(e));
     }

     async findByUserIdAndDateRange(
          userId: string,
          startDate: Date,
          endDate: Date,
          eventType?: ContactEventType
     ): Promise<ContactEvent[]> {
          const conditions = [
               eq(contactEvents.userId, userId),
               gte(contactEvents.occurredAt, startDate),
               lte(contactEvents.occurredAt, endDate),
          ];

          if (eventType) {
               conditions.push(eq(contactEvents.eventType, eventType));
          }

          const results = await db
               .select()
               .from(contactEvents)
               .where(and(...conditions))
               .orderBy(contactEvents.occurredAt);

          return results.map((e) => this.mapToContactEvent(e));
     }

     async findByCharacteristics(params: {
          contactId: string;
          eventType: ContactEventType;
          workflowId?: string;
          outreachId?: string;
          meetingId?: string;
          opportunityId?: string;
          followUpId?: string;
          metadata?: Record<string, unknown> | null;
     }): Promise<ContactEvent | null> {
          const {
               contactId,
               eventType,
               workflowId,
               outreachId,
               meetingId,
               opportunityId,
               followUpId,
               metadata,
          } = params;

          // Build base conditions
          const conditions = [
               eq(contactEvents.contactId, contactId),
               eq(contactEvents.eventType, eventType),
          ];

          // For STAGE_CHANGED events, match on workflowId + metadata (fromStage/toStage)
          if (eventType === ContactEventType.STAGE_CHANGED && metadata) {
               const stageMetadata = metadata as { fromStage?: string; toStage?: string };
               
               if (workflowId && stageMetadata.fromStage && stageMetadata.toStage) {
                    // Strongest match: workflowId + fromStage + toStage
                    conditions.push(eq(contactEvents.workflowId, workflowId));
                    conditions.push(
                         sql`${contactEvents.metadata}->>'fromStage' = ${stageMetadata.fromStage}`
                    );
                    conditions.push(
                         sql`${contactEvents.metadata}->>'toStage' = ${stageMetadata.toStage}`
                    );
               } else if (stageMetadata.fromStage && stageMetadata.toStage) {
                    // Fallback: fromStage + toStage (no workflowId)
                    conditions.push(
                         sql`${contactEvents.metadata}->>'fromStage' = ${stageMetadata.fromStage}`
                    );
                    conditions.push(
                         sql`${contactEvents.metadata}->>'toStage' = ${stageMetadata.toStage}`
                    );
               }
          } else {
               // For other event types, match on workflowId + entity ID
               if (workflowId) {
                    conditions.push(eq(contactEvents.workflowId, workflowId));
               }

               // Match on entity IDs (at least one must match)
               const entityConditions: SQL<unknown>[] = [];
               if (outreachId) {
                    entityConditions.push(eq(contactEvents.outreachId, outreachId));
               }
               if (meetingId) {
                    entityConditions.push(eq(contactEvents.meetingId, meetingId));
               }
               if (opportunityId) {
                    entityConditions.push(eq(contactEvents.opportunityId, opportunityId));
               }
               if (followUpId) {
                    entityConditions.push(eq(contactEvents.followUpId, followUpId));
               }

               // If we have entity IDs, require at least one to match
               if (entityConditions.length > 0) {
                    conditions.push(or(...entityConditions) as SQL<unknown>);
               } else if (!workflowId) {
                    // If no workflowId and no entity IDs, we can't uniquely identify the event
                    // Return null to indicate no match
                    return null;
               }
          }

          const [event] = await db
               .select()
               .from(contactEvents)
               .where(and(...conditions))
               .orderBy(desc(contactEvents.occurredAt), desc(contactEvents.createdAt))
               .limit(1);

          return event ? this.mapToContactEvent(event) : null;
     }

     private mapToContactEvent(
          row: typeof contactEvents.$inferSelect
     ): ContactEvent {
          return new ContactEvent({
               id: row.id,
               contactId: row.contactId,
               userId: row.userId,
               eventType: row.eventType as ContactEventType,
               metadata: row.metadata as ContactEvent["metadata"],
               outreachId: row.outreachId ?? undefined,
               meetingId: row.meetingId ?? undefined,
               opportunityId: row.opportunityId ?? undefined,
               followUpId: row.followUpId ?? undefined,
               workflowId: row.workflowId ?? undefined,
               occurredAt: toDate(row.occurredAt),
               createdAt: toDate(row.createdAt),
          });
     }
}

