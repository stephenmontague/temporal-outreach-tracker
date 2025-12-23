import { ContactEventType } from "@/models/ContactEvent";
import { FunnelStage } from "@/models/FunnelStage";
import { Opportunity, OpportunityStage } from "@/models/Opportunity";
import { ContactRepository } from "@/server/repositories/ContactRepository";
import { OpportunityRepository } from "@/server/repositories/OpportunityRepository";
import { ContactEventService } from "@/server/services/ContactEventService";

export class OpportunityService {
     private opportunityRepository: OpportunityRepository;
     private contactRepository: ContactRepository;
     private contactEventService: ContactEventService;

     constructor() {
          this.opportunityRepository = new OpportunityRepository();
          this.contactRepository = new ContactRepository();
          this.contactEventService = new ContactEventService();
     }

     async createOpportunity(
          data: Omit<Opportunity, "id" | "createdAt" | "updatedAt">
     ): Promise<Opportunity> {
          // Create opportunity directly in database
          const opportunity = await this.opportunityRepository.create({
               contactId: data.contactId,
               userId: data.userId,
               salesforceOpportunityId: data.salesforceOpportunityId,
               stage: OpportunityStage.CREATED,
               value: data.value,
               probability: data.probability,
               notes: data.notes,
          });

          // Update contact stage
          await this.contactRepository.update(data.contactId, {
               currentFunnelStage: FunnelStage.OPPORTUNITY_CREATED,
          });

          // Record opportunity created event
          await this.contactEventService.recordEvent({
               contactId: data.contactId,
               userId: data.userId,
               eventType: ContactEventType.OPPORTUNITY_CREATED,
               metadata: {
                    stage: OpportunityStage.CREATED,
                    value: data.value,
                    probability: data.probability,
               },
               opportunityId: opportunity.id,
          });

          return opportunity;
     }

     async markStage1(
          opportunityId: string,
          stage1Date: Date = new Date()
     ): Promise<Opportunity> {
          const opportunity = await this.opportunityRepository.findById(
               opportunityId
          );
          if (!opportunity) {
               throw new Error("Opportunity not found");
          }

          const previousStage = opportunity.stage;

          const updated = await this.opportunityRepository.update(
               opportunityId,
               {
                    stage: OpportunityStage.STAGE_1,
                    stage1Date,
               }
          );

          // Update contact stage to STAGE_1
          await this.contactRepository.update(opportunity.contactId, {
               currentFunnelStage: FunnelStage.STAGE_1,
          });

          // Record OPPORTUNITY_STAGE_CHANGED event
          await this.contactEventService.recordEvent({
               contactId: opportunity.contactId,
               userId: opportunity.userId,
               eventType: ContactEventType.OPPORTUNITY_STAGE_CHANGED,
               metadata: {
                    fromStage: previousStage,
                    toStage: OpportunityStage.STAGE_1,
               },
               occurredAt: stage1Date,
               opportunityId: opportunity.id,
          });

          return updated;
     }

     async getOpportunityById(id: string): Promise<Opportunity | null> {
          return this.opportunityRepository.findById(id);
     }

     async getOpportunitiesByContact(
          contactId: string
     ): Promise<Opportunity[]> {
          return this.opportunityRepository.findByContactId(contactId);
     }

     async getStage1Opportunities(userId: string): Promise<Opportunity[]> {
          return this.opportunityRepository.findStage1Opportunities(userId);
     }

     async updateOpportunity(
          id: string,
          data: Partial<Omit<Opportunity, "id" | "createdAt" | "updatedAt">>
     ): Promise<Opportunity> {
          return this.opportunityRepository.update(id, data);
     }
}
