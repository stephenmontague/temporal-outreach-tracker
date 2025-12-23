import { toDate } from "@/lib/utils";
import { ContactEventType } from "@/models/ContactEvent";
import type {
     CancelOutreachRemindersArgs,
     CancelOutreachRemindersResult,
     PersistContactResponseParams,
     PersistContactResponseResult,
     PersistFollowUpCompletionParams,
     PersistFollowUpCompletionResult,
     PersistOutreachParams,
     PersistOutreachResult,
     PersistStageChangeParams,
     PersistStageChangeResult,
} from "@/models/ContactLifecycle";
import { OutreachMethod } from "@/models/OutreachMethod";
import { ContactEventRepository } from "@/server/repositories/ContactEventRepository";
import { ContactRepository } from "@/server/repositories/ContactRepository";
import { FollowUpRepository } from "@/server/repositories/FollowUpRepository";
import { OutreachRepository } from "@/server/repositories/OutreachRepository";
import { exec } from "child_process";

// Re-export types from model for convenience
export type {
     CancelOutreachRemindersResult,
     PersistContactResponseParams,
     PersistContactResponseResult,
     PersistFollowUpCompletionParams,
     PersistFollowUpCompletionResult,
     PersistOutreachParams,
     PersistOutreachResult,
     PersistStageChangeParams,
     PersistStageChangeResult,
} from "@/models/ContactLifecycle";

// ============================================
// Activity-Only Types
// These are internal to the workflow and not exposed via Updates
// ============================================

/**
 * Params for syncReminderScheduleActivity
 * Needs outreach metadata that isn't in UpdateReminderScheduleArgs
 */
export interface SyncReminderScheduleParams {
     contactId: string;
     outreachId: string;
     outreachDateTime: string;
     outreachMethod: OutreachMethod;
     newSchedule: number[];
}

export interface SyncReminderScheduleResult {
     success: boolean;
     followUpIds: string[];
}

/**
 * Params for sendReminderNotificationActivity
 * Internal workflow activity, not exposed to UI
 */
export interface SendReminderNotificationParams {
     contactId: string;
     contactName: string;
     outreachId: string;
     followUpId: string;
     reminderNumber: number;
     totalReminders: number;
}

export interface SendReminderNotificationResult {
     success: boolean;
}

// ============================================
// Activity Implementations
// ============================================

const contactRepository = new ContactRepository();
const contactEventRepository = new ContactEventRepository();
const followUpRepository = new FollowUpRepository();
const outreachRepository = new OutreachRepository();

/**
 * Creates an outreach record and its associated follow-up reminders in the database
 */
export async function persistOutreachActivity(
     params: PersistOutreachParams
): Promise<PersistOutreachResult> {
     const {
          contactId,
          userId,
          workflowId,
          method,
          dateTime,
          subject,
          messagePreview,
          notes,
          reminderSchedule,
     } = params;

     const outreachDateTime = toDate(dateTime);

     // Create the outreach record
     const outreach = await outreachRepository.create({
          contactId,
          userId,
          method,
          dateTime: outreachDateTime,
          subject,
          messagePreview,
          notes,
          responseReceived: false,
          workflowId,
     });

     // Create follow-up records for each reminder
     const followUpIds: string[] = [];
     const now = new Date();
     let cumulativeDays = 0;

     for (let i = 0; i < reminderSchedule.length; i++) {
          cumulativeDays += reminderSchedule[i];
          const scheduledDate = new Date(outreachDateTime);
          scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);

          // Only create if the date is in the future
          if (scheduledDate > now) {
               const followUp = await followUpRepository.create({
                    outreachId: outreach.id,
                    contactId,
                    scheduledDate,
                    method,
                    completed: false,
                    isSalesforceManaged: false,
                    reminderSent: false,
                    notes: `Auto-generated reminder (${i + 1}/${
                         reminderSchedule.length
                    })`,
               });
               followUpIds.push(followUp.id);
          }
     }

     // Create OUTREACH_CREATED event
     await contactEventRepository.create({
          contactId,
          userId,
          eventType: ContactEventType.OUTREACH_CREATED,
          metadata: { method, subject },
          outreachId: outreach.id,
          workflowId,
          occurredAt: outreachDateTime,
     });

     console.log(
          `[ACTIVITY] Created outreach ${outreach.id} with ${followUpIds.length} follow-ups`
     );

     return {
          outreachId: outreach.id,
          followUpIds,
     };
}

/**
 * Updates the contact's stage and creates an audit event
 */
export async function persistStageChangeActivity(
     params: PersistStageChangeParams
): Promise<PersistStageChangeResult> {
     const {
          contactId,
          userId,
          workflowId,
          fromStage,
          toStage,
          occurredAt,
          reason,
     } = params;

     const occurredAtDate = toDate(occurredAt);

     // Update the contact's current stage
     await contactRepository.update(contactId, {
          currentFunnelStage: toStage,
     });

     // Create STAGE_CHANGED event
     const event = await contactEventRepository.create({
          contactId,
          userId,
          eventType: ContactEventType.STAGE_CHANGED,
          metadata: {
               fromStage,
               toStage,
               reason,
          },
          workflowId,
          occurredAt: occurredAtDate,
     });

     console.log(
          `[ACTIVITY] Changed stage for contact ${contactId}: ${fromStage} → ${toStage}`
     );

     return {
          success: true,
          eventId: event.id,
     };
}

/**
 * Marks a follow-up as completed in the database
 */
export async function persistFollowUpCompletionActivity(
     params: PersistFollowUpCompletionParams
): Promise<PersistFollowUpCompletionResult> {
     const { followUpId, completedDate } = params;

     const completedDateObj = toDate(completedDate);

     await followUpRepository.markCompleted(followUpId, completedDateObj);

     console.log(`[ACTIVITY] Marked follow-up ${followUpId} as completed`);

     return { success: true };
}

/**
 * Updates follow-up records when the reminder schedule changes
 */
export async function syncReminderScheduleActivity(
     params: SyncReminderScheduleParams
): Promise<SyncReminderScheduleResult> {
     const {
          contactId,
          outreachId,
          outreachDateTime,
          outreachMethod,
          newSchedule,
     } = params;

     const outreachDate = toDate(outreachDateTime);

     // Delete existing incomplete auto-generated follow-ups
     await followUpRepository.deleteByOutreachId(outreachId, true);

     // Create new follow-up records
     const followUpIds: string[] = [];
     const now = new Date();
     let cumulativeDays = 0;

     for (let i = 0; i < newSchedule.length; i++) {
          cumulativeDays += newSchedule[i];
          const scheduledDate = new Date(outreachDate);
          scheduledDate.setDate(scheduledDate.getDate() + cumulativeDays);

          // Only create if the date is in the future
          if (scheduledDate > now) {
               const followUp = await followUpRepository.create({
                    outreachId,
                    contactId,
                    scheduledDate,
                    method: outreachMethod,
                    completed: false,
                    isSalesforceManaged: false,
                    reminderSent: false,
                    notes: `Auto-generated reminder (${i + 1}/${
                         newSchedule.length
                    })`,
               });
               followUpIds.push(followUp.id);
          }
     }

     console.log(
          `[ACTIVITY] Synced reminder schedule for outreach ${outreachId}: ${followUpIds.length} follow-ups created`
     );

     return {
          success: true,
          followUpIds,
     };
}

/**
 * Cancels all reminders for an outreach by marking follow-ups as completed
 */
export async function cancelOutreachRemindersActivity(
     params: CancelOutreachRemindersArgs
): Promise<CancelOutreachRemindersResult> {
     const { outreachId, reason } = params;

     const cancelled = await followUpRepository.markCompletedByOutreachId(
          outreachId,
          reason || "Reminders cancelled"
     );

     console.log(
          `[ACTIVITY] Cancelled ${cancelled.length} reminders for outreach ${outreachId}`
     );

     return {
          success: true,
          cancelledCount: cancelled.length,
     };
}

/**
 * Sends reminder notification (macOS, Slack, etc.) and marks the follow-up as sent
 */
export async function sendReminderNotificationActivity(
     params: SendReminderNotificationParams
): Promise<SendReminderNotificationResult> {
     const {
          contactId,
          contactName,
          outreachId,
          followUpId: providedFollowUpId,
          reminderNumber,
          totalReminders,
     } = params;

     const reminderInfo = ` (${reminderNumber}/${totalReminders})`;

     // Find the follow-up ID if not provided
     let followUpId = providedFollowUpId;
     if (!followUpId) {
          // Look up follow-ups for this outreach and find the one matching the reminder number
          const followUps = await followUpRepository.findByOutreachId(outreachId);
          const incompleteFollowUps = followUps
               .filter((f) => !f.completed && !f.reminderSent)
               .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

          if (incompleteFollowUps.length > 0) {
               // Get the first incomplete follow-up (earliest scheduled)
               followUpId = incompleteFollowUps[0].id;
          }
     }

     // Mark the follow-up as reminder sent (only if we have a valid ID)
     if (followUpId) {
          await followUpRepository.update(followUpId, {
               reminderSent: true,
          });
     }

     // Log the reminder
     console.log(`[REMINDER${reminderInfo}] Follow up with ${contactName}`);
     console.log(`  Contact ID: ${contactId}`);
     console.log(`  Outreach ID: ${outreachId}`);
     console.log(`  Follow-up ID: ${followUpId || "(not found)"}`);

     // macOS native notification
     sendMacOSNotification(contactName, reminderInfo);

     // Slack webhook notification
     if (process.env.SLACK_WEBHOOK_URL) {
          await sendSlackNotification(contactName, reminderInfo);
     }

     return { success: true };
}

/**
 * Persists the contact response and marks outreach as responded
 */
export async function persistContactResponseActivity(
     params: PersistContactResponseParams
): Promise<PersistContactResponseResult> {
     const {
          contactId,
          userId,
          workflowId,
          outreachId,
          responseDate,
          responseContext,
     } = params;

     const responseDateObj = toDate(responseDate);

     // Update the outreach with response information
     await outreachRepository.update(outreachId, {
          responseReceived: true,
          responseDate: responseDateObj,
          notes: responseContext,
     });

     // Mark all incomplete follow-ups for this outreach as completed
     await followUpRepository.markCompletedByOutreachId(
          outreachId,
          "Contact responded"
     );

     // Create OUTREACH_RESPONSE_RECEIVED event
     const outreach = await outreachRepository.findById(outreachId);
     await contactEventRepository.create({
          contactId,
          userId,
          eventType: ContactEventType.OUTREACH_RESPONSE_RECEIVED,
          metadata: {
               method: outreach?.method,
               responseDate: responseDateObj.toISOString(),
               responseContext,
          },
          outreachId,
          workflowId,
          occurredAt: responseDateObj,
     });

     console.log(`[ACTIVITY] Recorded response for outreach ${outreachId}`);

     return { success: true };
}

// ============================================
// Helper Functions
// ============================================

function sendMacOSNotification(
     contactName: string,
     reminderInfo: string
): void {
     if (process.platform !== "darwin") {
          return;
     }

     try {
          const title = "Outreach Reminder";
          const message = `Follow up with ${contactName}${reminderInfo}`;
          const escapedMessage = message.replace(/'/g, "'\\''");
          const escapedTitle = title.replace(/'/g, "'\\''");

          exec(
               `osascript -e 'display notification "${escapedMessage}" with title "${escapedTitle}"'`,
               (error) => {
                    if (error) {
                         console.error(
                              "Failed to send macOS notification:",
                              error
                         );
                    }
               }
          );
     } catch (error) {
          console.error("Failed to send macOS notification:", error);
     }
}

async function sendSlackNotification(
     contactName: string,
     reminderInfo: string
): Promise<void> {
     try {
          const webhookUrl = process.env.SLACK_WEBHOOK_URL!;
          await fetch(webhookUrl, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                    text: `🔔 Reminder${reminderInfo}: Follow up with *${contactName}*`,
               }),
          });
     } catch (error) {
          console.error("Failed to send Slack notification:", error);
     }
}
