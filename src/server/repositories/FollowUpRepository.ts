import { toDate, toDateOrUndefined } from "@/lib/utils";
import { FollowUp } from "@/models/FollowUp";
import { OutreachMethod } from "@/models/OutreachMethod";
import { db } from "@/server/database/connection";
import { followUps, contacts, outreaches } from "@/server/database/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export class FollowUpRepository {
     async create(
          data: Omit<FollowUp, "id" | "createdAt" | "updatedAt">
     ): Promise<FollowUp> {
          const [followUp] = await db
               .insert(followUps)
               .values({
                    outreachId: data.outreachId,
                    contactId: data.contactId,
                    scheduledDate: data.scheduledDate,
                    method: data.method,
                    notes: data.notes,
                    completed: data.completed,
                    completedDate: data.completedDate,
                    isSalesforceManaged: data.isSalesforceManaged,
                    workflowTimerId: data.workflowTimerId,
               })
               .returning();

          return this.mapToFollowUp(followUp);
     }

     async findById(id: string): Promise<FollowUp | null> {
          const [followUp] = await db
               .select()
               .from(followUps)
               .where(eq(followUps.id, id))
               .limit(1);

          return followUp ? this.mapToFollowUp(followUp) : null;
     }

     async findByOutreachId(outreachId: string): Promise<FollowUp[]> {
          const results = await db
               .select()
               .from(followUps)
               .where(eq(followUps.outreachId, outreachId))
               .orderBy(followUps.scheduledDate);

          return results.map((f) => this.mapToFollowUp(f));
     }

     async findByContactId(contactId: string): Promise<FollowUp[]> {
          const results = await db
               .select()
               .from(followUps)
               .where(eq(followUps.contactId, contactId))
               .orderBy(followUps.scheduledDate);

          return results.map((f) => this.mapToFollowUp(f));
     }

      async findUpcoming(userId: string, days: number = 7): Promise<FollowUp[]> {
           const now = new Date();
           const endDate = new Date();
           endDate.setDate(endDate.getDate() + days);

           // Join with outreaches to filter by userId and with contacts to get contact info
           const results = await db
                .select({
                     followUp: followUps,
                     contact: contacts,
                })
                .from(followUps)
                .innerJoin(outreaches, eq(followUps.outreachId, outreaches.id))
                .innerJoin(contacts, eq(followUps.contactId, contacts.id))
                .where(
                     and(
                          eq(outreaches.userId, userId),
                          eq(followUps.completed, false),
                          gte(followUps.scheduledDate, now),
                          lte(followUps.scheduledDate, endDate)
                     )
                )
                .orderBy(followUps.scheduledDate);

           return results.map((r) => this.mapToFollowUp(r.followUp));
      }

      async findUpcomingWithContacts(userId: string, days: number = 7): Promise<Array<{ followUp: FollowUp; contact: { id: string; firstName: string; lastName?: string } }>> {
           const now = new Date();
           const endDate = new Date();
           endDate.setDate(endDate.getDate() + days);

           // Join with outreaches to filter by userId and with contacts to get contact info
           const results = await db
                .select({
                     followUp: followUps,
                     contact: {
                          id: contacts.id,
                          firstName: contacts.firstName,
                          lastName: contacts.lastName,
                     },
                })
                .from(followUps)
                .innerJoin(outreaches, eq(followUps.outreachId, outreaches.id))
                .innerJoin(contacts, eq(followUps.contactId, contacts.id))
                .where(
                     and(
                          eq(outreaches.userId, userId),
                          eq(followUps.completed, false),
                          gte(followUps.scheduledDate, now),
                          lte(followUps.scheduledDate, endDate)
                     )
                )
                .orderBy(followUps.scheduledDate);

           return results.map((r) => ({
                followUp: this.mapToFollowUp(r.followUp),
                contact: {
                     id: r.contact.id,
                     firstName: r.contact.firstName,
                     lastName: r.contact.lastName ?? undefined,
                },
           }));
      }

     async markCompleted(
          id: string,
          completedDate: Date = new Date()
     ): Promise<FollowUp> {
          const [updated] = await db
               .update(followUps)
               .set({
                    completed: true,
                    completedDate,
                    updatedAt: new Date(),
               })
               .where(eq(followUps.id, id))
               .returning();

          return this.mapToFollowUp(updated);
     }

     async update(
          id: string,
          data: Partial<Omit<FollowUp, "id" | "createdAt" | "updatedAt">>
     ): Promise<FollowUp> {
          const [updated] = await db
               .update(followUps)
               .set({
                    ...data,
                    updatedAt: new Date(),
               })
               .where(eq(followUps.id, id))
               .returning();

          return this.mapToFollowUp(updated);
     }

     async delete(id: string): Promise<void> {
          await db.delete(followUps).where(eq(followUps.id, id));
     }

     async markCompletedByOutreachId(
          outreachId: string,
          reason?: string
     ): Promise<FollowUp[]> {
          const now = new Date();
          const existingFollowUps = await this.findByOutreachId(outreachId);
          const incompleteFollowUps = existingFollowUps.filter(
               (f) => !f.completed
          );

          // Update all incomplete follow-ups
          const updated = await db
               .update(followUps)
               .set({
                    completed: true,
                    completedDate: now,
                    updatedAt: now,
               })
               .where(
                    and(
                         eq(followUps.outreachId, outreachId),
                         eq(followUps.completed, false)
                    )
               )
               .returning();

          // Update notes separately if reason provided
          if (reason) {
               await Promise.all(
                    incompleteFollowUps.map(async (originalFollowUp) => {
                         const currentNotes = originalFollowUp.notes || "";
                         const newNotes = `${currentNotes}${
                              currentNotes ? " | " : ""
                         }Cancelled - ${reason}`;
                         await db
                              .update(followUps)
                              .set({ notes: newNotes })
                              .where(eq(followUps.id, originalFollowUp.id));
                    })
               );
          }

          // Fetch updated records
          const results = await this.findByOutreachId(outreachId);
          return results.filter((f) =>
               incompleteFollowUps.some((orig) => orig.id === f.id)
          );
     }

     async markCompletedByContactId(
          contactId: string,
          reason?: string
     ): Promise<FollowUp[]> {
          const now = new Date();
          const existingFollowUps = await this.findByContactId(contactId);
          const incompleteFollowUps = existingFollowUps.filter(
               (f) => !f.completed
          );

          // Update all incomplete follow-ups
          await db
               .update(followUps)
               .set({
                    completed: true,
                    completedDate: now,
                    updatedAt: now,
               })
               .where(
                    and(
                         eq(followUps.contactId, contactId),
                         eq(followUps.completed, false)
                    )
               );

          // Update notes separately if reason provided
          if (reason) {
               await Promise.all(
                    incompleteFollowUps.map(async (originalFollowUp) => {
                         const currentNotes = originalFollowUp.notes || "";
                         const newNotes = `${currentNotes}${
                              currentNotes ? " | " : ""
                         }Cancelled - ${reason}`;
                         await db
                              .update(followUps)
                              .set({ notes: newNotes })
                              .where(eq(followUps.id, originalFollowUp.id));
                    })
               );
          }

          // Fetch updated records
          const results = await this.findByContactId(contactId);
          return results.filter((f) =>
               incompleteFollowUps.some((orig) => orig.id === f.id)
          );
     }

     async deleteByOutreachId(
          outreachId: string,
          onlyAutoGenerated: boolean
     ): Promise<void> {
          if (onlyAutoGenerated) {
               // Delete only auto-generated follow-ups (those with notes starting with "Auto-generated reminder")
               const allFollowUps = await this.findByOutreachId(outreachId);
               const autoGeneratedIds = allFollowUps
                    .filter(
                         (f) =>
                              f.notes?.startsWith("Auto-generated reminder") &&
                              !f.completed
                    )
                    .map((f) => f.id);

               if (autoGeneratedIds.length > 0) {
                    // Drizzle doesn't have a direct IN operator, so we'll delete one by one
                    // In a real scenario, you might want to use sql template for better performance
                    await Promise.all(
                         autoGeneratedIds.map((id) => this.delete(id))
                    );
               }
          } else {
               // Delete all follow-ups for this outreach
               await db
                    .delete(followUps)
                    .where(eq(followUps.outreachId, outreachId));
          }
     }

     async findTriggeredReminders(userId: string): Promise<Array<{
          followUp: FollowUp;
          contact: { id: string; firstName: string; lastName?: string };
     }>> {
          const results = await db
               .select({
                    followUp: followUps,
                    contact: {
                         id: contacts.id,
                         firstName: contacts.firstName,
                         lastName: contacts.lastName,
                    },
               })
               .from(followUps)
               .innerJoin(outreaches, eq(followUps.outreachId, outreaches.id))
               .innerJoin(contacts, eq(followUps.contactId, contacts.id))
               .where(
                    and(
                         eq(outreaches.userId, userId),
                         eq(followUps.reminderSent, true),
                         eq(followUps.completed, false)
                    )
               )
               .orderBy(followUps.scheduledDate);

          return results.map((r) => ({
               followUp: this.mapToFollowUp(r.followUp),
               contact: {
                    id: r.contact.id,
                    firstName: r.contact.firstName,
                    lastName: r.contact.lastName ?? undefined,
               },
          }));
     }

     async markReminderSent(id: string): Promise<FollowUp> {
          const [updated] = await db
               .update(followUps)
               .set({
                    reminderSent: true,
                    updatedAt: new Date(),
               })
               .where(eq(followUps.id, id))
               .returning();

          return this.mapToFollowUp(updated);
     }

     private mapToFollowUp(row: typeof followUps.$inferSelect): FollowUp {
          return new FollowUp({
               id: row.id,
               outreachId: row.outreachId,
               contactId: row.contactId,
               scheduledDate: toDate(row.scheduledDate),
               method: row.method as OutreachMethod,
               notes: row.notes ?? undefined,
               completed: row.completed,
               completedDate: toDateOrUndefined(row.completedDate),
               isSalesforceManaged: row.isSalesforceManaged,
               workflowTimerId: row.workflowTimerId ?? undefined,
               reminderSent: row.reminderSent,
               createdAt: toDate(row.createdAt),
               updatedAt: toDate(row.updatedAt),
          });
     }
}
