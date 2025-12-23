// Activity functions
export {
     cancelOutreachRemindersActivity,
     persistContactResponseActivity,
     persistFollowUpCompletionActivity,
     persistOutreachActivity,
     persistStageChangeActivity,
     sendReminderNotificationActivity,
     syncReminderScheduleActivity
} from "./ContactLifecycleActivities";

// Types from model (re-exported via activities file)
export type {
     CancelOutreachRemindersResult,
     PersistContactResponseParams,
     PersistContactResponseResult,
     PersistFollowUpCompletionParams,
     PersistFollowUpCompletionResult,
     PersistOutreachParams,
     PersistOutreachResult,
     PersistStageChangeParams,
     PersistStageChangeResult
} from "./ContactLifecycleActivities";

// Activity-only types (defined in activities file)
export type {
     SendReminderNotificationParams,
     SendReminderNotificationResult,
     SyncReminderScheduleParams,
     SyncReminderScheduleResult
} from "./ContactLifecycleActivities";

// Re-export CancelOutreachRemindersArgs as the activity param type
// (they are identical, activity uses the model type directly)
export type { CancelOutreachRemindersArgs as CancelOutreachRemindersParams } from "@/models/ContactLifecycle";
