"use server";

import { getUserId } from "@/lib/constants";
import { getErrorMessage, serializeForClient } from "@/lib/utils";
import { updateFollowUpSchema } from "@/lib/validations";
import { ensureContactWorkflow, getContactName } from "@/lib/workflow-helpers";
import { SerializedFollowUp } from "@/models/serialized";
import { FollowUpService } from "@/server/services/FollowUpService";
import { OutreachService } from "@/server/services/OutreachService";
import { getTemporalClientInstance } from "@/server/temporal/client/TemporalClient";
import { revalidatePath } from "next/cache";

const followUpService = new FollowUpService();
const outreachService = new OutreachService();
const temporalClient = getTemporalClientInstance();

export async function markComplete(followUpId: string, completedDate?: Date) {
     try {
          const userId = getUserId();

          // Get the follow-up to find the outreach and contact
          const followUp = await followUpService.getFollowUpById(followUpId);
          if (!followUp) {
               return { success: false, error: "Follow-up not found" };
          }

          // Get contact name and ensure workflow exists
          const contactName = await getContactName(followUp.contactId);
          const workflowId = await ensureContactWorkflow(
               followUp.contactId,
               contactName,
               userId
          );

          // Execute mark follow-up done via workflow Update
          await temporalClient.executeMarkFollowUpDone(
               workflowId,
               followUpId,
               followUp.outreachId,
               (completedDate || new Date()).toISOString()
          );

          // Get the updated follow-up from DB
          const updatedFollowUp = await followUpService.getFollowUpById(
               followUpId
          );

          revalidatePath("/dashboard");
          revalidatePath("/dashboard/contacts");
          revalidatePath(`/dashboard/contacts/${followUp.contactId}`);
          return {
               success: true,
               followUp: updatedFollowUp
                    ? serializeForClient(updatedFollowUp)
                    : null,
          };
     } catch (error) {
          return { success: false, error: getErrorMessage(error) };
     }
}

export async function updateFollowUp(id: string, formData: FormData) {
     try {
          const userId = getUserId();
          const data: Record<string, unknown> = {};

          const method = formData.get("method");
          if (method) data.method = method;

          const scheduledDate = formData.get("scheduledDate");
          if (scheduledDate) data.scheduledDate = scheduledDate;

          const notes = formData.get("notes");
          if (notes !== null) data.notes = notes || undefined;

          const validated = updateFollowUpSchema.parse(data);

          // Get the follow-up to find the outreach and contact
          const followUp = await followUpService.getFollowUpById(id);
          if (!followUp) {
               return { success: false, error: "Follow-up not found" };
          }

          // Get the outreach to recalculate schedule
          const outreach = await outreachService.getOutreachById(
               followUp.outreachId
          );
          if (!outreach) {
               return { success: false, error: "Outreach not found" };
          }

          // Get all follow-ups for this outreach to recalculate schedule
          const allFollowUps = await followUpService.getFollowUpsByOutreach(
               followUp.outreachId
          );

          // Update the follow-up in DB first (for immediate UI response)
          const updatedFollowUp = await followUpService.updateFollowUp(
               id,
               validated
          );

          // Recalculate the reminder schedule based on updated follow-ups
          // The schedule is in days from outreach date
          const outreachDate = new Date(outreach.dateTime);
          const updatedFollowUps = allFollowUps.map((f) =>
               f.id === id
                    ? {
                           ...f,
                           scheduledDate: new Date(
                                validated.scheduledDate || f.scheduledDate
                           ),
                      }
                    : f
          );

          // Sort by scheduled date
          updatedFollowUps.sort(
               (a, b) =>
                    new Date(a.scheduledDate).getTime() -
                    new Date(b.scheduledDate).getTime()
          );

          // Calculate new schedule (days from outreach date for each reminder)
          const newSchedule: number[] = [];
          let previousDate = outreachDate;
          for (const f of updatedFollowUps) {
               if (!f.completed) {
                    const daysDiff = Math.ceil(
                         (new Date(f.scheduledDate).getTime() -
                              previousDate.getTime()) /
                              (24 * 60 * 60 * 1000)
                    );
                    newSchedule.push(Math.max(1, daysDiff)); // At least 1 day
                    previousDate = new Date(f.scheduledDate);
               }
          }

          // Update the workflow with the new schedule (if there are pending reminders)
          if (newSchedule.length > 0) {
               try {
                    const contactName = await getContactName(
                         followUp.contactId
                    );
                    const workflowId = await ensureContactWorkflow(
                         followUp.contactId,
                         contactName,
                         userId
                    );

                    await temporalClient.executeUpdateReminderSchedule(
                         workflowId,
                         followUp.outreachId,
                         newSchedule
                    );
               } catch (error) {
                    // Workflow might not exist for legacy contacts - that's okay
                    console.log("Could not update workflow schedule:", error);
               }
          }

          revalidatePath("/dashboard");
          revalidatePath("/dashboard/contacts");
          revalidatePath(`/dashboard/contacts/${followUp.contactId}`);
          return {
               success: true,
               followUp: serializeForClient(updatedFollowUp),
          };
     } catch (error) {
          return { success: false, error: getErrorMessage(error) };
     }
}

export interface ReminderWithContact {
     followUp: SerializedFollowUp;
     contact: {
          id: string;
          firstName: string;
          lastName?: string;
     };
}

export async function getTriggeredReminders(): Promise<{
     success: boolean;
     error?: string;
     reminders: ReminderWithContact[];
}> {
     try {
          const userId = getUserId();
          const reminders = await followUpService.getTriggeredReminders(userId);

          return {
               success: true,
               reminders: reminders.map((r) => ({
                    followUp: serializeForClient(
                         r.followUp
                    ) as SerializedFollowUp,
                    contact: r.contact,
               })),
          };
     } catch (error) {
          return {
               success: false,
               error: getErrorMessage(error),
               reminders: [],
          };
     }
}
