import { toDate } from "@/lib/utils";
import { Meeting, MeetingType, MeetingOutcome } from "@/models/Meeting";
import { db } from "@/server/database/connection";
import { meetings } from "@/server/database/schema";
import { eq, and, gte } from "drizzle-orm";

export class MeetingRepository {
     async create(
          data: Omit<Meeting, "id" | "createdAt" | "updatedAt">
     ): Promise<Meeting> {
          const [meeting] = await db
               .insert(meetings)
               .values({
                    contactId: data.contactId,
                    userId: data.userId,
                    scheduledDate: data.scheduledDate,
                    meetingType: data.meetingType,
                    duration: data.duration,
                    location: data.location,
                    notes: data.notes,
                    outcome: data.outcome,
               })
               .returning();

          return this.mapToMeeting(meeting);
     }

     async createWithId(
          id: string,
          data: Omit<Meeting, "id" | "createdAt" | "updatedAt">
     ): Promise<Meeting> {
          const [meeting] = await db
               .insert(meetings)
               .values({
                    id,
                    contactId: data.contactId,
                    userId: data.userId,
                    scheduledDate: data.scheduledDate,
                    meetingType: data.meetingType,
                    duration: data.duration,
                    location: data.location,
                    notes: data.notes,
                    outcome: data.outcome,
               })
               .returning();

          return this.mapToMeeting(meeting);
     }

     async findById(id: string): Promise<Meeting | null> {
          const [meeting] = await db
               .select()
               .from(meetings)
               .where(eq(meetings.id, id))
               .limit(1);

          return meeting ? this.mapToMeeting(meeting) : null;
     }

     async findByContactId(contactId: string): Promise<Meeting[]> {
          const results = await db
               .select()
               .from(meetings)
               .where(eq(meetings.contactId, contactId))
               .orderBy(meetings.scheduledDate);

          return results.map((m) => this.mapToMeeting(m));
     }

     async findUpcoming(
          userId: string,
          fromDate: Date = new Date()
     ): Promise<Meeting[]> {
          const results = await db
               .select()
               .from(meetings)
               .where(
                    and(
                         eq(meetings.userId, userId),
                         gte(meetings.scheduledDate, fromDate)
                    )
               )
               .orderBy(meetings.scheduledDate);

          return results.map((m) => this.mapToMeeting(m));
     }

     async findByUserId(userId: string): Promise<Meeting[]> {
          const results = await db
               .select()
               .from(meetings)
               .where(eq(meetings.userId, userId))
               .orderBy(meetings.scheduledDate);

          return results.map((m) => this.mapToMeeting(m));
     }

     async findByType(
          userId: string,
          meetingType: MeetingType
     ): Promise<Meeting[]> {
          const results = await db
               .select()
               .from(meetings)
               .where(
                    and(
                         eq(meetings.userId, userId),
                         eq(meetings.meetingType, meetingType)
                    )
               )
               .orderBy(meetings.scheduledDate);

          return results.map((m) => this.mapToMeeting(m));
     }

     async update(
          id: string,
          data: Partial<Omit<Meeting, "id" | "createdAt" | "updatedAt">>
     ): Promise<Meeting> {
          const [updated] = await db
               .update(meetings)
               .set({
                    ...data,
                    updatedAt: new Date(),
               })
               .where(eq(meetings.id, id))
               .returning();

          return this.mapToMeeting(updated);
     }

     async delete(id: string): Promise<void> {
          await db.delete(meetings).where(eq(meetings.id, id));
     }

     private mapToMeeting(row: typeof meetings.$inferSelect): Meeting {
          return new Meeting({
               id: row.id,
               contactId: row.contactId,
               userId: row.userId,
               scheduledDate: toDate(row.scheduledDate),
               meetingType: row.meetingType as MeetingType,
               duration: row.duration ?? undefined,
               location: row.location ?? undefined,
               notes: row.notes ?? undefined,
               outcome: row.outcome as MeetingOutcome | undefined,
               createdAt: toDate(row.createdAt),
               updatedAt: toDate(row.updatedAt),
          });
     }
}
