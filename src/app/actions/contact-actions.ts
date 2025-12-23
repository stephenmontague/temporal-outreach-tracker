"use server";

import { formatContactName, getUserId } from "@/lib/constants";
import {
     createContactSchema,
     outreachSchema,
     updateContactSchema,
} from "@/lib/validations";
import { ensureContactWorkflow, getContactName } from "@/lib/workflow-helpers";
import { FunnelStage } from "@/models/FunnelStage";
import { OutreachMethod } from "@/models/OutreachMethod";
import { ContactService } from "@/server/services/ContactService";
import { OutreachService } from "@/server/services/OutreachService";
import { getTemporalClientInstance } from "@/server/temporal/client/TemporalClient";
import { revalidatePath } from "next/cache";

const contactService = new ContactService();
const outreachService = new OutreachService();
const temporalClient = getTemporalClientInstance();

export async function createContact(formData: FormData) {
     try {
          const userId = getUserId();
          const originalOutreachDateTimeStr = formData.get(
               "originalOutreachDateTime"
          ) as string | null;
          const originalOutreachDateTime = originalOutreachDateTimeStr
               ? new Date(originalOutreachDateTimeStr)
               : undefined;

          const data = {
               firstName: formData.get("firstName") as string,
               lastName: formData.get("lastName") as string | undefined,
               company: formData.get("company") as string | undefined,
               email: formData.get("email") as string | undefined,
               slackUsername: formData.get("slackUsername") as
                    | string
                    | undefined,
               phoneNumber: formData.get("phoneNumber") as string | undefined,
               linkedinUrl: formData.get("linkedinUrl") as string | undefined,
               notes: formData.get("notes") as string | undefined,
               isInSalesforceCadence:
                    formData.get("isInSalesforceCadence") === "true",
               originalOutreachDateTime,
          };

          const validated = createContactSchema.parse({ ...data, userId });
          const contact = await contactService.createContact(validated as any);

          // Start the ContactLifecycleWorkflow for this contact
          const contactName =
               formatContactName(
                    contact.firstName,
                    contact.lastName,
                    contact.slackUsername
               ) ||
               contact.firstName ||
               "unknown";
          await temporalClient.startContactLifecycleWorkflow({
               contactId: contact.id,
               contactName,
               userId,
               initialStage: FunnelStage.OUTREACH,
          });

          revalidatePath("/dashboard/contacts");
          return {
               success: true,
               contact: JSON.parse(JSON.stringify(contact)),
          };
     } catch (error: any) {
          return {
               success: false,
               error: error.message || "Failed to create contact",
          };
     }
}

export async function updateContact(id: string, formData: FormData) {
     try {
          const data = {
               firstName: formData.get("firstName") as string | undefined,
               lastName: formData.get("lastName") as string | undefined,
               company: formData.get("company") as string | undefined,
               email: formData.get("email") as string | undefined,
               slackUsername: formData.get("slackUsername") as
                    | string
                    | undefined,
               phoneNumber: formData.get("phoneNumber") as string | undefined,
               linkedinUrl: formData.get("linkedinUrl") as string | undefined,
               notes: formData.get("notes") as string | undefined,
               isInSalesforceCadence:
                    formData.get("isInSalesforceCadence") === "true",
          };

          const validated = updateContactSchema.parse(data);
          const contact = await contactService.updateContact(id, validated);

          revalidatePath("/dashboard/contacts");
          revalidatePath(`/dashboard/contacts/${id}`);
          return {
               success: true,
               contact: JSON.parse(JSON.stringify(contact)),
          };
     } catch (error: any) {
          return {
               success: false,
               error: error.message || "Failed to update contact",
          };
     }
}

export async function deleteContact(id: string) {
     try {
          // Cancel the workflow if it's running
          const contact = await contactService.getContactById(id);
          if (contact) {
               const contactName =
                    formatContactName(
                         contact.firstName,
                         contact.lastName,
                         contact.slackUsername
                    ) ||
                    contact.firstName ||
                    "unknown";
               const workflowId = temporalClient.getContactWorkflowId(
                    id,
                    contactName
               );
               try {
                    await temporalClient.signalCancelWorkflow(workflowId);
               } catch {
                    // Workflow might not exist - that's okay
               }
          }

          await contactService.deleteContact(id);
          revalidatePath("/dashboard/contacts");
          return { success: true };
     } catch (error: any) {
          return {
               success: false,
               error: error.message || "Failed to delete contact",
          };
     }
}

export async function createContactWithOutreach(formData: FormData) {
     try {
          const userId = getUserId();

          // Parse contact data
          const originalOutreachDateTimeStr = formData.get(
               "originalOutreachDateTime"
          ) as string | null;
          const originalOutreachDateTime = originalOutreachDateTimeStr
               ? new Date(originalOutreachDateTimeStr)
               : undefined;

          const contactData = {
               firstName: formData.get("firstName") as string,
               lastName: formData.get("lastName") as string | undefined,
               company: formData.get("company") as string | undefined,
               email: formData.get("email") as string | undefined,
               slackUsername: formData.get("slackUsername") as
                    | string
                    | undefined,
               phoneNumber: formData.get("phoneNumber") as string | undefined,
               linkedinUrl: formData.get("linkedinUrl") as string | undefined,
               notes: formData.get("notes") as string | undefined,
               isInSalesforceCadence:
                    formData.get("isInSalesforceCadence") === "true",
               originalOutreachDateTime,
               currentFunnelStage: FunnelStage.OUTREACH,
          };

          // Validate and create contact
          const validated = createContactSchema.parse({
               ...contactData,
               userId,
          });
          const contact = await contactService.createContact(validated as any);

          // Parse outreach data
          const outreachMethod = formData.get(
               "outreachMethod"
          ) as OutreachMethod;
          const reminderScheduleStr = formData.get(
               "reminderSchedule"
          ) as string;
          const reminderSchedule: number[] = reminderScheduleStr
               ? JSON.parse(reminderScheduleStr)
               : [];

          // Create the initial outreach - use original outreach date/time if provided, otherwise use now
          const outreachDateTime = originalOutreachDateTime || new Date();

          // Get contact name for workflow
          const contactName =
               formatContactName(
                    contact.firstName,
                    contact.lastName,
                    contact.slackUsername
               ) ||
               contact.firstName ||
               "unknown";

          // Start the ContactLifecycleWorkflow
          const workflowId = await temporalClient.startContactLifecycleWorkflow(
               {
                    contactId: contact.id,
                    contactName,
                    userId,
                    initialStage: FunnelStage.OUTREACH,
               }
          );

          // Add the outreach via workflow Update (this persists to DB via activity)
          const outreachResult = await temporalClient.executeAddOutreach(
               workflowId,
               {
                    method: outreachMethod,
                    dateTime: outreachDateTime.toISOString(),
                    subject: `Initial ${outreachMethod.toLowerCase()} outreach`,
                    reminderSchedule,
               }
          );

          // Get the created outreach for the response
          const outreach = await outreachService.getOutreachById(
               outreachResult.outreachId
          );

          revalidatePath("/dashboard/contacts");
          revalidatePath("/dashboard");
          return {
               success: true,
               contact: JSON.parse(JSON.stringify(contact)),
               outreach: outreach ? JSON.parse(JSON.stringify(outreach)) : null,
          };
     } catch (error: any) {
          console.error("Error creating contact with outreach:", error);
          return {
               success: false,
               error: error.message || "Failed to create contact",
          };
     }
}

export async function updateContactStage(
     contactId: string,
     newStage: FunnelStage,
     occurredAt?: Date
) {
     try {
          const userId = getUserId();

          // Read current contact to get name and current stage
          const contact = await contactService.getContactById(contactId);
          if (!contact) {
               return {
                    success: false,
                    error: "Contact not found",
               };
          }

          const fromStage = contact.currentFunnelStage;

          // If stage hasn't changed, return early
          if (fromStage === newStage) {
               return {
                    success: true,
                    contact: JSON.parse(JSON.stringify(contact)),
               };
          }

          // Get contact name for workflow
          const contactName =
               formatContactName(
                    contact.firstName,
                    contact.lastName,
                    contact.slackUsername
               ) ||
               contact.firstName ||
               "unknown";

          // Ensure workflow exists (may need to start if contact was created before migration)
          const workflowId = await ensureContactWorkflow(
               contactId,
               contactName,
               userId,
               fromStage
          );

          // Execute stage change via workflow Update (this persists to DB via activity)
          await temporalClient.executeChangeStage(
               workflowId,
               newStage,
               occurredAt?.toISOString(),
               undefined
          );

          // Fetch updated contact
          const updatedContact = await contactService.getContactById(contactId);

          revalidatePath("/dashboard/contacts");
          revalidatePath(`/dashboard/contacts/${contactId}`);
          revalidatePath("/dashboard");
          return {
               success: true,
               contact: JSON.parse(JSON.stringify(updatedContact)),
          };
     } catch (error: any) {
          return {
               success: false,
               error: error.message || "Failed to update contact stage",
          };
     }
}

export async function recordContactResponse(
     contactId: string,
     outreachId: string,
     responseDate: Date,
     responseContext?: string
) {
     try {
          const userId = getUserId();
          const contactName = await getContactName(contactId);
          const workflowId = await ensureContactWorkflow(
               contactId,
               contactName,
               userId
          );

          // Execute contact responded via workflow Update (this persists to DB via activity)
          await temporalClient.executeContactResponded(
               workflowId,
               outreachId,
               responseDate.toISOString(),
               responseContext
          );

          revalidatePath("/dashboard/contacts");
          revalidatePath(`/dashboard/contacts/${contactId}`);
          revalidatePath("/dashboard");
          return { success: true };
     } catch (error: any) {
          console.error("Error recording contact response:", error);
          return {
               success: false,
               error: error.message || "Failed to record contact response",
          };
     }
}

export async function cancelOutreachReminders(
     contactId: string,
     outreachId: string
) {
     try {
          const userId = getUserId();
          const contactName = await getContactName(contactId);
          const workflowId = await ensureContactWorkflow(
               contactId,
               contactName,
               userId
          );

          // Execute cancel reminders via workflow Update
          await temporalClient.executeCancelOutreachReminders(
               workflowId,
               outreachId,
               "User cancelled reminders"
          );

          revalidatePath("/dashboard/contacts");
          revalidatePath(`/dashboard/contacts/${contactId}`);
          return { success: true };
     } catch (error: any) {
          console.error("Error cancelling reminders:", error);
          return {
               success: false,
               error: error.message || "Failed to cancel reminders",
          };
     }
}

export async function updateReminderSchedule(
     contactId: string,
     outreachId: string,
     newSchedule: number[]
) {
     try {
          const userId = getUserId();
          const contactName = await getContactName(contactId);
          const workflowId = await ensureContactWorkflow(
               contactId,
               contactName,
               userId
          );

          // Execute update reminder schedule via workflow Update
          await temporalClient.executeUpdateReminderSchedule(
               workflowId,
               outreachId,
               newSchedule
          );

          revalidatePath("/dashboard/contacts");
          revalidatePath(`/dashboard/contacts/${contactId}`);
          revalidatePath("/dashboard");
          return { success: true };
     } catch (error: any) {
          console.error("Error updating reminder schedule:", error);
          return {
               success: false,
               error: error.message || "Failed to update reminder schedule",
          };
     }
}

export async function createResponseOutreach(
     contactId: string,
     originalOutreachId: string,
     formData: FormData
) {
     try {
          const userId = getUserId();

          // Get the original outreach
          const originalOutreach = await outreachService.getOutreachById(
               originalOutreachId
          );
          if (!originalOutreach) {
               return {
                    success: false,
                    error: "Original outreach not found",
               };
          }

          // Parse outreach data for the user's response message
          const data = {
               contactId,
               userId,
               method: formData.get("method") as string,
               dateTime: formData.get("dateTime") as string,
               subject: formData.get("subject") as string | undefined,
               messagePreview: formData.get("messagePreview") as
                    | string
                    | undefined,
               notes: formData.get("notes") as string | undefined,
          };

          // Validate outreach data
          const validated = outreachSchema.parse({
               contactId,
               method: data.method,
               dateTime: data.dateTime,
               subject: data.subject,
               messagePreview: data.messagePreview,
               notes: data.notes,
               responseReceived: false,
          });

          const responseDateTime = new Date(validated.dateTime);

          // Get contact name and ensure workflow exists
          const contactName = await getContactName(contactId);
          const workflowId = await ensureContactWorkflow(
               contactId,
               contactName,
               userId
          );

          // First, record the response to the original outreach via workflow Update
          await temporalClient.executeContactResponded(
               workflowId,
               originalOutreachId,
               responseDateTime.toISOString()
          );

          // Parse reminder schedule if provided
          const reminderScheduleStr = formData.get(
               "reminderSchedule"
          ) as string;
          const reminderSchedule: number[] = reminderScheduleStr
               ? JSON.parse(reminderScheduleStr)
               : [];

          // Add the new outreach (user's response message) via workflow Update
          const outreachResult = await temporalClient.executeAddOutreach(
               workflowId,
               {
                    method: validated.method as OutreachMethod,
                    dateTime: responseDateTime.toISOString(),
                    subject: validated.subject,
                    messagePreview: validated.messagePreview,
                    notes: validated.notes,
                    reminderSchedule,
               }
          );

          // Get the created outreach for the response
          const responseOutreach = await outreachService.getOutreachById(
               outreachResult.outreachId
          );

          revalidatePath("/dashboard/contacts");
          revalidatePath(`/dashboard/contacts/${contactId}`);
          revalidatePath("/dashboard");
          return {
               success: true,
               outreach: responseOutreach
                    ? JSON.parse(JSON.stringify(responseOutreach))
                    : null,
          };
     } catch (error: any) {
          console.error("Error creating response outreach:", error);
          return {
               success: false,
               error: error.message || "Failed to create response outreach",
          };
     }
}

// Query the workflow state for a contact (useful for debugging/UI)
export async function getContactWorkflowState(contactId: string) {
     try {
          const contactName = await getContactName(contactId);
          const workflowId = temporalClient.getContactWorkflowId(
               contactId,
               contactName
          );
          const state = await temporalClient.queryContactState(workflowId);
          return { success: true, state };
     } catch (error: any) {
          return { success: true, state: null };
     }
}
