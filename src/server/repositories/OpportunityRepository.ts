import { toDate, toDateOrUndefined } from "@/lib/utils";
import { Opportunity, OpportunityStage } from "@/models/Opportunity";
import { db } from "@/server/database/connection";
import { opportunities } from "@/server/database/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export class OpportunityRepository {
     async create(
          data: Omit<Opportunity, "id" | "createdAt" | "updatedAt">
     ): Promise<Opportunity> {
          const [opportunity] = await db
               .insert(opportunities)
               .values({
                    contactId: data.contactId,
                    userId: data.userId,
                    salesforceOpportunityId: data.salesforceOpportunityId,
                    stage: data.stage,
                    stage1Date: data.stage1Date,
                    value: data.value,
                    probability: data.probability,
                    notes: data.notes,
               })
               .returning();

          return this.mapToOpportunity(opportunity);
     }

     async createWithId(
          id: string,
          data: Omit<Opportunity, "id" | "createdAt" | "updatedAt">
     ): Promise<Opportunity> {
          const [opportunity] = await db
               .insert(opportunities)
               .values({
                    id,
                    contactId: data.contactId,
                    userId: data.userId,
                    salesforceOpportunityId: data.salesforceOpportunityId,
                    stage: data.stage,
                    stage1Date: data.stage1Date,
                    value: data.value,
                    probability: data.probability,
                    notes: data.notes,
               })
               .returning();

          return this.mapToOpportunity(opportunity);
     }

     async findById(id: string): Promise<Opportunity | null> {
          const [opportunity] = await db
               .select()
               .from(opportunities)
               .where(eq(opportunities.id, id))
               .limit(1);

          return opportunity ? this.mapToOpportunity(opportunity) : null;
     }

     async findByContactId(contactId: string): Promise<Opportunity[]> {
          const results = await db
               .select()
               .from(opportunities)
               .where(eq(opportunities.contactId, contactId))
               .orderBy(opportunities.createdAt);

          return results.map((o) => this.mapToOpportunity(o));
     }

     async findByStage(
          userId: string,
          stage: OpportunityStage
     ): Promise<Opportunity[]> {
          const results = await db
               .select()
               .from(opportunities)
               .where(
                    and(
                         eq(opportunities.userId, userId),
                         eq(opportunities.stage, stage)
                    )
               )
               .orderBy(opportunities.createdAt);

          return results.map((o) => this.mapToOpportunity(o));
     }

     async findStage1Opportunities(userId: string): Promise<Opportunity[]> {
          const results = await db
               .select()
               .from(opportunities)
               .where(
                    and(
                         eq(opportunities.userId, userId),
                         eq(opportunities.stage, OpportunityStage.STAGE_1),
                         isNotNull(opportunities.stage1Date)
                    )
               )
               .orderBy(opportunities.stage1Date);

          return results.map((o) => this.mapToOpportunity(o));
     }

     async update(
          id: string,
          data: Partial<Omit<Opportunity, "id" | "createdAt" | "updatedAt">>
     ): Promise<Opportunity> {
          const [updated] = await db
               .update(opportunities)
               .set({
                    ...data,
                    updatedAt: new Date(),
               })
               .where(eq(opportunities.id, id))
               .returning();

          return this.mapToOpportunity(updated);
     }

     async delete(id: string): Promise<void> {
          await db.delete(opportunities).where(eq(opportunities.id, id));
     }

     private mapToOpportunity(
          row: typeof opportunities.$inferSelect
     ): Opportunity {
          return new Opportunity({
               id: row.id,
               contactId: row.contactId,
               userId: row.userId,
               salesforceOpportunityId: row.salesforceOpportunityId ?? undefined,
               stage: row.stage as OpportunityStage,
               stage1Date: toDateOrUndefined(row.stage1Date),
               value: row.value ?? undefined,
               probability: row.probability ?? undefined,
               notes: row.notes ?? undefined,
               createdAt: toDate(row.createdAt),
               updatedAt: toDate(row.updatedAt),
          });
     }
}

