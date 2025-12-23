import { toDate } from "@/lib/utils";
import { Contact } from "@/models/Contact";
import { FunnelStage } from "@/models/FunnelStage";
import { db } from "@/server/database/connection";
import { contacts } from "@/server/database/schema";
import { eq } from "drizzle-orm";

export class ContactRepository {
     async create(
          data: Omit<Contact, "id" | "createdAt" | "updatedAt">
     ): Promise<Contact> {
          const [contact] = await db
               .insert(contacts)
               .values({
                    userId: data.userId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    company: data.company,
                    email: data.email,
                    slackUsername: data.slackUsername,
                    phoneNumber: data.phoneNumber,
                    linkedinUrl: data.linkedinUrl,
                    notes: data.notes,
                    currentFunnelStage: data.currentFunnelStage,
                    isInSalesforceCadence: data.isInSalesforceCadence,
                    originalOutreachDateTime: data.originalOutreachDateTime,
               })
               .returning();

          return this.mapToContact(contact);
     }

     async createWithId(
          id: string,
          data: Omit<Contact, "id" | "createdAt" | "updatedAt">
     ): Promise<Contact> {
          const [contact] = await db
               .insert(contacts)
               .values({
                    id,
                    userId: data.userId,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    company: data.company,
                    email: data.email,
                    slackUsername: data.slackUsername,
                    phoneNumber: data.phoneNumber,
                    linkedinUrl: data.linkedinUrl,
                    notes: data.notes,
                    currentFunnelStage: data.currentFunnelStage,
                    isInSalesforceCadence: data.isInSalesforceCadence,
                    originalOutreachDateTime: data.originalOutreachDateTime,
               })
               .returning();

          return this.mapToContact(contact);
     }

     async findById(id: string): Promise<Contact | null> {
          const [contact] = await db
               .select()
               .from(contacts)
               .where(eq(contacts.id, id))
               .limit(1);

          return contact ? this.mapToContact(contact) : null;
     }

     async findByUserId(userId: string): Promise<Contact[]> {
          const results = await db
               .select()
               .from(contacts)
               .where(eq(contacts.userId, userId))
               .orderBy(contacts.createdAt);

          return results.map((c) => this.mapToContact(c));
     }

     async update(
          id: string,
          data: Partial<Omit<Contact, "id" | "createdAt" | "updatedAt">>
     ): Promise<Contact> {
          const [updated] = await db
               .update(contacts)
               .set({
                    ...data,
                    updatedAt: new Date(),
               })
               .where(eq(contacts.id, id))
               .returning();

          if (!updated) {
               throw new Error(`Contact with id ${id} not found`);
          }

          return this.mapToContact(updated);
     }

     async delete(id: string): Promise<void> {
          await db.delete(contacts).where(eq(contacts.id, id));
     }

     private mapToContact(row: typeof contacts.$inferSelect): Contact {
          return new Contact({
               id: row.id,
               userId: row.userId,
               firstName: row.firstName,
               lastName: row.lastName ?? undefined,
               company: row.company ?? undefined,
               email: row.email ?? undefined,
               slackUsername: row.slackUsername ?? undefined,
               phoneNumber: row.phoneNumber ?? undefined,
               linkedinUrl: row.linkedinUrl ?? undefined,
               notes: row.notes ?? undefined,
               currentFunnelStage: row.currentFunnelStage as FunnelStage,
               isInSalesforceCadence: row.isInSalesforceCadence,
               originalOutreachDateTime: row.originalOutreachDateTime
                    ? toDate(row.originalOutreachDateTime)
                    : undefined,
               createdAt: toDate(row.createdAt),
               updatedAt: toDate(row.updatedAt),
          });
     }
}
