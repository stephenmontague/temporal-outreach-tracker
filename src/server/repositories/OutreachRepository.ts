import { toDate, toDateOrUndefined } from "@/lib/utils";
import { Outreach } from "@/models/Outreach";
import { OutreachMethod } from "@/models/OutreachMethod";
import { db } from "@/server/database/connection";
import { outreaches } from "@/server/database/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export class OutreachRepository {
     async create(
          data: Omit<Outreach, "id" | "createdAt" | "updatedAt">
     ): Promise<Outreach> {
          const [outreach] = await db
               .insert(outreaches)
               .values({
                    contactId: data.contactId,
                    userId: data.userId,
                    method: data.method,
                    dateTime: data.dateTime,
                    subject: data.subject,
                    messagePreview: data.messagePreview,
                    notes: data.notes,
                    responseReceived: data.responseReceived,
                    responseDate: data.responseDate,
                    workflowId: data.workflowId,
               })
               .returning();

          return this.mapToOutreach(outreach);
     }

     async createWithId(
          id: string,
          data: Omit<Outreach, "id" | "createdAt" | "updatedAt">
     ): Promise<Outreach> {
          const [outreach] = await db
               .insert(outreaches)
               .values({
                    id,
                    contactId: data.contactId,
                    userId: data.userId,
                    method: data.method,
                    dateTime: data.dateTime,
                    subject: data.subject,
                    messagePreview: data.messagePreview,
                    notes: data.notes,
                    responseReceived: data.responseReceived,
                    responseDate: data.responseDate,
                    workflowId: data.workflowId,
               })
               .returning();

          return this.mapToOutreach(outreach);
     }

     async findById(id: string): Promise<Outreach | null> {
          const [outreach] = await db
               .select()
               .from(outreaches)
               .where(eq(outreaches.id, id))
               .limit(1);

          return outreach ? this.mapToOutreach(outreach) : null;
     }

     async findByContactId(contactId: string): Promise<Outreach[]> {
          const results = await db
               .select()
               .from(outreaches)
               .where(eq(outreaches.contactId, contactId))
               .orderBy(outreaches.dateTime);

          return results.map((o) => this.mapToOutreach(o));
     }

     async findByUserId(userId: string): Promise<Outreach[]> {
          const results = await db
               .select()
               .from(outreaches)
               .where(eq(outreaches.userId, userId))
               .orderBy(outreaches.dateTime);

          return results.map((o) => this.mapToOutreach(o));
     }

     async findByDateRange(
          userId: string,
          startDate: Date,
          endDate: Date
     ): Promise<Outreach[]> {
          const results = await db
               .select()
               .from(outreaches)
               .where(
                    and(
                         eq(outreaches.userId, userId),
                         gte(outreaches.dateTime, startDate),
                         lte(outreaches.dateTime, endDate)
                    )
               )
               .orderBy(outreaches.dateTime);

          return results.map((o) => this.mapToOutreach(o));
     }

     async update(
          id: string,
          data: Partial<Omit<Outreach, "id" | "createdAt" | "updatedAt">>
     ): Promise<Outreach> {
          const [updated] = await db
               .update(outreaches)
               .set({
                    ...data,
                    updatedAt: new Date(),
               })
               .where(eq(outreaches.id, id))
               .returning();

          return this.mapToOutreach(updated);
     }

     async delete(id: string): Promise<void> {
          await db.delete(outreaches).where(eq(outreaches.id, id));
     }

     private mapToOutreach(row: typeof outreaches.$inferSelect): Outreach {
          return new Outreach({
               id: row.id,
               contactId: row.contactId,
               userId: row.userId,
               method: row.method as OutreachMethod,
               dateTime: toDate(row.dateTime),
               subject: row.subject ?? undefined,
               messagePreview: row.messagePreview ?? undefined,
               notes: row.notes ?? undefined,
               responseReceived: row.responseReceived,
               responseDate: toDateOrUndefined(row.responseDate),
               workflowId: row.workflowId ?? undefined,
               createdAt: toDate(row.createdAt),
               updatedAt: toDate(row.updatedAt),
          });
     }
}
