import * as wf from "@temporalio/workflow";
import type * as activities from "../activities/ContactLifecycleActivities";
// Note: Using relative imports because Temporal's webpack bundler doesn't support @/ aliases
import type {
     AddOutreachArgs,
     AddOutreachResult,
     CancelOutreachRemindersArgs,
     CancelOutreachRemindersResult,
     ChangeStageArgs,
     ChangeStageResult,
     ContactLifecycleParams,
     ContactLifecycleResult,
     ContactLifecycleState,
     ContactRespondedArgs,
     ContactRespondedResult,
     MarkFollowUpDoneArgs,
     MarkFollowUpDoneResult,
     OutreachState,
     UpdateReminderScheduleArgs,
     UpdateReminderScheduleResult,
} from "../../../models/ContactLifecycle";
import { FunnelStage } from "../../../models/FunnelStage";

// Proxy activities
const {
     persistOutreachActivity,
     persistStageChangeActivity,
     persistFollowUpCompletionActivity,
     syncReminderScheduleActivity,
     cancelOutreachRemindersActivity,
     sendReminderNotificationActivity,
     persistContactResponseActivity,
} = wf.proxyActivities<typeof activities>({
     startToCloseTimeout: "1 minute",
});

// ============================================
// Signal Definitions
// ============================================
const cancelSignal = wf.defineSignal("cancel");

// ============================================
// Query Definitions
// ============================================
const getStateQuery = wf.defineQuery<ContactLifecycleState>("getState");

// ============================================
// Update Definitions
// ============================================
const addOutreachUpdate = wf.defineUpdate<AddOutreachResult, [AddOutreachArgs]>(
     "addOutreach"
);

const updateReminderScheduleUpdate = wf.defineUpdate<
     UpdateReminderScheduleResult,
     [UpdateReminderScheduleArgs]
>("updateReminderSchedule");

const markFollowUpDoneUpdate = wf.defineUpdate<
     MarkFollowUpDoneResult,
     [MarkFollowUpDoneArgs]
>("markFollowUpDone");

const changeStageUpdate = wf.defineUpdate<ChangeStageResult, [ChangeStageArgs]>(
     "changeStage"
);

const contactRespondedUpdate = wf.defineUpdate<
     ContactRespondedResult,
     [ContactRespondedArgs]
>("contactResponded");

const cancelOutreachRemindersUpdate = wf.defineUpdate<
     CancelOutreachRemindersResult,
     [CancelOutreachRemindersArgs]
>("cancelOutreachReminders");

// ============================================
// Helper Functions
// ============================================

function calculateNextReminder(
     outreaches: Record<string, OutreachState>
): { outreachId: string; reminderIndex: number; time: number } | null {
     let earliest: {
          outreachId: string;
          reminderIndex: number;
          time: number;
     } | null = null;

     for (const [outreachId, outreach] of Object.entries(outreaches)) {
          if (outreach.responded || outreach.cancelled) continue;
          if (outreach.currentReminderIndex >= outreach.reminderSchedule.length)
               continue;
          if (!outreach.nextReminderAt) continue;

          const reminderTime = new Date(outreach.nextReminderAt).getTime();
          if (!earliest || reminderTime < earliest.time) {
               earliest = {
                    outreachId,
                    reminderIndex: outreach.currentReminderIndex,
                    time: reminderTime,
               };
          }
     }

     return earliest;
}

function calculateNextReminderTime(
     reminderBaseTime: string, // When the reminder schedule was created (NOW at creation time)
     reminderSchedule: number[],
     currentReminderIndex: number
): string | undefined {
     if (currentReminderIndex >= reminderSchedule.length) {
          return undefined;
     }

     const baseDate = new Date(reminderBaseTime);
     let cumulativeDays = 0;
     for (let i = 0; i <= currentReminderIndex; i++) {
          cumulativeDays += reminderSchedule[i];
     }

     const reminderDate = new Date(baseDate);
     reminderDate.setDate(reminderDate.getDate() + cumulativeDays);
     return reminderDate.toISOString();
}

function isTerminalStage(stage: FunnelStage): boolean {
     return (
          stage === FunnelStage.STAGE_1 ||
          stage === FunnelStage.LOST ||
          stage === FunnelStage.INACTIVE
     );
}

// ============================================
// Main Workflow
// ============================================

export async function ContactLifecycleWorkflow(
     params: ContactLifecycleParams
): Promise<ContactLifecycleResult> {
     const { contactId, contactName, userId, initialStage } = params;

     // Get workflow ID for activities
     const workflowId = wf.workflowInfo().workflowId;

     // Initialize state
     const state: ContactLifecycleState = {
          contactId,
          contactName,
          userId,
          currentStage: initialStage || FunnelStage.OUTREACH,
          stageHistory: [
               {
                    stage: initialStage || FunnelStage.OUTREACH,
                    timestamp: new Date().toISOString(),
               },
          ],
          outreaches: {},
          isActive: true,
          completionReason: undefined,
     };

     // Track if we need to wake up for processing
     let hasUpdate = false;

     // ============================================
     // Signal Handlers
     // ============================================
     wf.setHandler(cancelSignal, () => {
          state.isActive = false;
          state.completionReason = "inactive";
          hasUpdate = true;
     });

     // ============================================
     // Query Handlers
     // ============================================
     wf.setHandler(getStateQuery, () => state);

     // ============================================
     // Update Handlers
     // ============================================

     wf.setHandler(addOutreachUpdate, async (args: AddOutreachArgs) => {
          const {
               method,
               dateTime,
               subject,
               messagePreview,
               notes,
               reminderSchedule,
          } = args;

          // Persist to database via activity
          const result = await persistOutreachActivity({
               contactId,
               userId,
               workflowId,
               method,
               dateTime,
               subject,
               messagePreview,
               notes,
               reminderSchedule,
          });

          // Add to workflow state
          // Use current time as the base for reminder calculations (reminders are relative to NOW, not outreach date)
          const reminderBaseTime = new Date().toISOString();
          const nextReminderAt = calculateNextReminderTime(
               reminderBaseTime,
               reminderSchedule,
               0
          );
          const outreachState: OutreachState = {
               id: result.outreachId,
               method,
               dateTime,
               reminderSchedule,
               currentReminderIndex: 0,
               reminderBaseTime,
               nextReminderAt,
               responded: false,
               cancelled: false,
          };

          state.outreaches[result.outreachId] = outreachState;
          hasUpdate = true;

          return {
               outreachId: result.outreachId,
               followUpIds: result.followUpIds,
          };
     });

     wf.setHandler(
          updateReminderScheduleUpdate,
          async (args: UpdateReminderScheduleArgs) => {
               const { outreachId, newSchedule } = args;

               const outreach = state.outreaches[outreachId];
               if (!outreach) {
                    return { success: false, followUpIds: [] };
               }

               // Sync to database via activity
               const result = await syncReminderScheduleActivity({
                    contactId,
                    outreachId,
                    outreachMethod: outreach.method,
                    newSchedule,
               });

               // Update workflow state - reset base time to NOW when schedule is updated
               outreach.reminderSchedule = newSchedule;
               outreach.currentReminderIndex = 0;
               outreach.reminderBaseTime = new Date().toISOString();
               outreach.nextReminderAt = calculateNextReminderTime(
                    outreach.reminderBaseTime,
                    newSchedule,
                    0
               );
               hasUpdate = true;

               return {
                    success: true,
                    followUpIds: result.followUpIds,
               };
          }
     );

     wf.setHandler(
          markFollowUpDoneUpdate,
          async (args: MarkFollowUpDoneArgs) => {
               const { followUpId, outreachId, completedDate } = args;

               // Persist to database via activity
               await persistFollowUpCompletionActivity({
                    followUpId,
                    completedDate: completedDate || new Date().toISOString(),
               });

               // Update workflow state - advance reminder index
               const outreach = state.outreaches[outreachId];
               if (outreach) {
                    outreach.currentReminderIndex++;
                    outreach.nextReminderAt = calculateNextReminderTime(
                         outreach.reminderBaseTime,
                         outreach.reminderSchedule,
                         outreach.currentReminderIndex
                    );
                    hasUpdate = true;
               }

               return { success: true };
          }
     );

     wf.setHandler(changeStageUpdate, async (args: ChangeStageArgs) => {
          const { newStage, occurredAt, reason } = args;

          const previousStage = state.currentStage;

          // Persist to database via activity
          await persistStageChangeActivity({
               contactId,
               userId,
               workflowId,
               fromStage: previousStage,
               toStage: newStage,
               occurredAt: occurredAt || new Date().toISOString(),
               reason,
          });

          // Update workflow state
          state.currentStage = newStage;
          state.stageHistory.push({
               stage: newStage,
               timestamp: occurredAt || new Date().toISOString(),
               reason,
          });

          // Check for terminal stages
          if (isTerminalStage(newStage)) {
               state.isActive = false;
               if (newStage === FunnelStage.STAGE_1) {
                    state.completionReason = "stage1";
               } else if (newStage === FunnelStage.LOST) {
                    state.completionReason = "lost";
               } else if (newStage === FunnelStage.INACTIVE) {
                    state.completionReason = "inactive";
               }
          }

          hasUpdate = true;

          return { success: true, previousStage };
     });

     wf.setHandler(
          contactRespondedUpdate,
          async (args: ContactRespondedArgs) => {
               const { outreachId, responseDate, responseContext } = args;

               // Persist to database via activity
               await persistContactResponseActivity({
                    contactId,
                    userId,
                    workflowId,
                    outreachId,
                    responseDate,
                    responseContext,
               });

               // Update workflow state - mark outreach as responded
               const outreach = state.outreaches[outreachId];
               if (outreach) {
                    outreach.responded = true;
                    outreach.nextReminderAt = undefined;
               }

               hasUpdate = true;

               return { success: true };
          }
     );

     wf.setHandler(
          cancelOutreachRemindersUpdate,
          async (args: CancelOutreachRemindersArgs) => {
               const { outreachId, reason } = args;

               const outreach = state.outreaches[outreachId];
               if (!outreach) {
                    return { success: false, cancelledCount: 0 };
               }

               // Cancel in database via activity
               const result = await cancelOutreachRemindersActivity({
                    outreachId,
                    reason,
               });

               // Update workflow state
               outreach.cancelled = true;
               outreach.nextReminderAt = undefined;
               hasUpdate = true;

               return {
                    success: true,
                    cancelledCount: result.cancelledCount,
               };
          }
     );

     // ============================================
     // Main Event Loop
     // ============================================
     while (state.isActive) {
          // Calculate next wake time
          const nextReminder = calculateNextReminder(state.outreaches);
          const now = Date.now();
          const rawSleepMs = nextReminder
               ? Math.max(0, nextReminder.time - now)
               : undefined;
          // Ensure minimum sleep time to prevent tight loops if reminder time is in the past
          const sleepMs =
               rawSleepMs !== undefined ? Math.max(1000, rawSleepMs) : undefined;

          // Reset update flag
          hasUpdate = false;

          // Sleep until next reminder OR update received
          // wf.condition returns true if condition was satisfied, false if timeout elapsed
          const conditionMet = await wf.condition(
               () => hasUpdate || !state.isActive,
               sleepMs
          );

          // If we woke up due to timeout (timer fired, not signal/update), fire the reminder
          if (!conditionMet && nextReminder && state.isActive) {
               const outreach = state.outreaches[nextReminder.outreachId];
               if (outreach && !outreach.responded && !outreach.cancelled) {
                    // Find the follow-up ID for this reminder
                    // The activity will look up the follow-up by outreach and reminder number
                    await sendReminderNotificationActivity({
                         contactId,
                         contactName,
                         outreachId: nextReminder.outreachId,
                         followUpId: "", // Activity will find the right follow-up
                         reminderNumber: nextReminder.reminderIndex + 1,
                         totalReminders: outreach.reminderSchedule.length,
                    });

                    // Advance to next reminder
                    outreach.currentReminderIndex++;
                    outreach.nextReminderAt = calculateNextReminderTime(
                         outreach.reminderBaseTime,
                         outreach.reminderSchedule,
                         outreach.currentReminderIndex
                    );
               }
          }

          // Check for completion conditions
          if (isTerminalStage(state.currentStage)) {
               state.isActive = false;
          }

          // continueAsNew if history getting large
          if (wf.workflowInfo().historyLength > 1000) {
               await wf.continueAsNew<typeof ContactLifecycleWorkflow>({
                    contactId,
                    contactName,
                    userId,
                    initialStage: state.currentStage,
               });
          }
     }

     // Determine completion reason
     let reason: ContactLifecycleResult["reason"] = "inactive";
     if (state.completionReason === "stage1") {
          reason = "stage1";
     } else if (state.completionReason === "lost") {
          reason = "lost";
     } else if (state.completionReason === "inactive") {
          reason = "inactive";
     }

     return {
          completed: true,
          reason,
          finalStage: state.currentStage,
     };
}
