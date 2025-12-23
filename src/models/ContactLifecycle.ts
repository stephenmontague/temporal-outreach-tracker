import { FunnelStage } from "./FunnelStage";
import { OutreachMethod } from "./OutreachMethod";

/**
 * Parameters for starting a ContactLifecycleWorkflow
 */
export interface ContactLifecycleParams {
     contactId: string;
     contactName: string;
     userId: string;
     initialStage?: FunnelStage;
}

/**
 * Outreach state tracked within the workflow
 */
export interface OutreachState {
     id: string;
     method: OutreachMethod;
     dateTime: string;
     reminderSchedule: number[];
     currentReminderIndex: number;
     nextReminderAt?: string;
     responded: boolean;
     cancelled: boolean;
}

/**
 * Stage history entry for audit trail
 */
export interface StageHistoryEntry {
     stage: FunnelStage;
     timestamp: string;
     reason?: string;
}

/**
 * State of a ContactLifecycleWorkflow (queryable)
 */
export interface ContactLifecycleState {
     contactId: string;
     contactName: string;
     userId: string;
     currentStage: FunnelStage;
     stageHistory: StageHistoryEntry[];
     outreaches: Record<string, OutreachState>;
     isActive: boolean;
     completionReason?: "stage1" | "lost" | "inactive";
}

/**
 * Result of a completed ContactLifecycleWorkflow
 */
export interface ContactLifecycleResult {
     completed: boolean;
     reason: "stage1" | "lost" | "inactive" | "cancelled";
     finalStage: FunnelStage;
}

// ============================================
// Update Handler Argument Types
// ============================================

export interface AddOutreachArgs {
     method: OutreachMethod;
     dateTime: string;
     subject?: string;
     messagePreview?: string;
     notes?: string;
     reminderSchedule: number[];
}

export interface AddOutreachResult {
     outreachId: string;
     followUpIds: string[];
}

export interface UpdateReminderScheduleArgs {
     outreachId: string;
     newSchedule: number[];
}

export interface UpdateReminderScheduleResult {
     success: boolean;
     followUpIds: string[];
}

export interface MarkFollowUpDoneArgs {
     followUpId: string;
     outreachId: string;
     completedDate?: string;
}

export interface MarkFollowUpDoneResult {
     success: boolean;
}

export interface ChangeStageArgs {
     newStage: FunnelStage;
     occurredAt?: string;
     reason?: string;
}

export interface ChangeStageResult {
     success: boolean;
     previousStage: FunnelStage;
}

export interface ContactRespondedArgs {
     outreachId: string;
     responseDate: string;
     responseContext?: string;
}

export interface ContactRespondedResult {
     success: boolean;
}

export interface CancelOutreachRemindersArgs {
     outreachId: string;
     reason?: string;
}

export interface CancelOutreachRemindersResult {
     success: boolean;
     cancelledCount: number;
}

// ============================================
// Workflow Context (for activities)
// ============================================

/**
 * Context passed from workflow to activities
 * Contains identifiers needed to persist data
 */
export interface WorkflowContext {
     contactId: string;
     userId: string;
     workflowId: string;
}

// ============================================
// Activity Parameter Types
// Activities receive workflow-enriched versions of the update args
// ============================================

/**
 * Params for persistOutreachActivity
 * Extends AddOutreachArgs with workflow context
 */
export type PersistOutreachParams = AddOutreachArgs & WorkflowContext;

/**
 * Result from persistOutreachActivity
 * Same as AddOutreachResult
 */
export type PersistOutreachResult = AddOutreachResult;

/**
 * Params for persistStageChangeActivity
 * Extends ChangeStageArgs with workflow context and fromStage
 */
export type PersistStageChangeParams = WorkflowContext & {
     fromStage: FunnelStage;
     toStage: FunnelStage;
     occurredAt: string;
     reason?: string;
};

/**
 * Result from persistStageChangeActivity
 */
export interface PersistStageChangeResult {
     success: boolean;
     eventId: string;
}

/**
 * Params for persistFollowUpCompletionActivity
 * Subset of MarkFollowUpDoneArgs (doesn't need outreachId for DB operation)
 */
export interface PersistFollowUpCompletionParams {
     followUpId: string;
     completedDate: string;
}

/**
 * Result from persistFollowUpCompletionActivity
 */
export type PersistFollowUpCompletionResult = MarkFollowUpDoneResult;

/**
 * Params for persistContactResponseActivity
 * Extends ContactRespondedArgs with workflow context
 */
export type PersistContactResponseParams = ContactRespondedArgs & WorkflowContext;

/**
 * Result from persistContactResponseActivity
 */
export type PersistContactResponseResult = ContactRespondedResult;
