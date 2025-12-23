import { Contact } from "@/models/Contact";
import { FunnelStage } from "@/models/FunnelStage";
import { ContactRepository } from "@/server/repositories/ContactRepository";

export class ContactService {
     private contactRepository: ContactRepository;

     constructor() {
          this.contactRepository = new ContactRepository();
     }

     async createContact(
          data: Omit<Contact, "id" | "createdAt" | "updatedAt">
     ): Promise<Contact> {
          // Validate: firstName OR slackUsername must be provided
          if (!Contact.validate(data)) {
               throw new Error(
                    "Either firstName or slackUsername must be provided"
               );
          }

          const currentFunnelStage =
               data.currentFunnelStage || FunnelStage.OUTREACH;

          // Create contact directly in database
          const contact = await this.contactRepository.create({
               ...data,
               currentFunnelStage,
               isInSalesforceCadence: data.isInSalesforceCadence || false,
          });

          return contact;
     }

     async getContactById(id: string): Promise<Contact | null> {
          return this.contactRepository.findById(id);
     }

     async getAllContacts(userId: string): Promise<Contact[]> {
          return this.contactRepository.findByUserId(userId);
     }

     async updateContact(
          id: string,
          data: Partial<Omit<Contact, "id" | "createdAt" | "updatedAt">>
     ): Promise<Contact> {
          // Validate if firstName/slackUsername is being updated
          if (
               data.firstName !== undefined ||
               data.slackUsername !== undefined
          ) {
               const existing = await this.contactRepository.findById(id);
               if (!existing) {
                    throw new Error("Contact not found");
               }
               const updated = { ...existing, ...data };
               if (!Contact.validate(updated)) {
                    throw new Error(
                         "Either firstName or slackUsername must be provided"
                    );
               }
          }

          return this.contactRepository.update(id, data);
     }

     async deleteContact(id: string): Promise<void> {
          await this.contactRepository.delete(id);
     }
}
