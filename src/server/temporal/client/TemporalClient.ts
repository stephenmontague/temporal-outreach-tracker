import type {
     AddOutreachArgs,
     AddOutreachResult,
     CancelOutreachRemindersResult,
     ChangeStageResult,
     ContactLifecycleState,
     ContactRespondedResult,
     MarkFollowUpDoneResult,
     UpdateReminderScheduleResult,
} from "@/models/ContactLifecycle";
import { FunnelStage } from "@/models/FunnelStage";
import { Client, Connection } from "@temporalio/client";

let client: Client | null = null;

export async function getTemporalClient(): Promise<Client> {
     if (client) {
          return client;
     }

     const connection = await Connection.connect({
          address: process.env.TEMPORAL_ADDRESS || "localhost:7233",
          tls: process.env.TEMPORAL_TLS === "true" ? {} : undefined,
          apiKey: process.env.TEMPORAL_API_KEY,
     });

     client = new Client({
          connection,
          namespace: process.env.TEMPORAL_NAMESPACE || "default",
     });

     return client;
}

// Helper to generate deterministic workflow ID with readable name
function shortId(id: string): string {
     return id.substring(0, 6);
}

/**
 * Sanitize a name for use in workflow IDs.
 * Similar to formatContactName/slugify in @/lib/constants, but kept local
 * to avoid circular dependencies between temporal client and lib modules.
 */
function sanitizeName(name: string): string {
     return name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-");
}

export class TemporalClient {
     private clientPromise: Promise<Client>;

     constructor() {
          this.clientPromise = getTemporalClient();
     }

     // ============================================
     // Workflow ID Helpers
     // ============================================

     /**
      * Generate a deterministic workflow ID for a contact
      * e.g., "contact-lifecycle-803829-john-smith"
      */
     getContactWorkflowId(contactId: string, contactName: string): string {
          return `contact-lifecycle-${shortId(contactId)}-${sanitizeName(
               contactName
          )}`;
     }

     // ============================================
     // ContactLifecycle Workflow Methods
     // ============================================

     /**
      * Start a new ContactLifecycleWorkflow for a contact
      */
     async startContactLifecycleWorkflow(params: {
          contactId: string;
          contactName: string;
          userId: string;
          initialStage?: FunnelStage;
     }): Promise<string> {
          const client = await this.clientPromise;
          const workflowId = this.getContactWorkflowId(
               params.contactId,
               params.contactName
          );

          await client.workflow.start("ContactLifecycleWorkflow", {
               taskQueue: "outreach-tracking",
               workflowId,
               args: [params],
          });

          return workflowId;
     }

     /**
      * Add an outreach to the contact's workflow
      */
     async executeAddOutreach(
          workflowId: string,
          args: AddOutreachArgs
     ): Promise<AddOutreachResult> {
          const client = await this.clientPromise;
          const handle = client.workflow.getHandle(workflowId);
          return await handle.executeUpdate("addOutreach", { args: [args] });
     }

     /**
      * Update the reminder schedule for an outreach
      */
     async executeUpdateReminderSchedule(
          workflowId: string,
          outreachId: string,
          newSchedule: number[]
     ): Promise<UpdateReminderScheduleResult> {
          const client = await this.clientPromise;
          const handle = client.workflow.getHandle(workflowId);
          return await handle.executeUpdate("updateReminderSchedule", {
               args: [{ outreachId, newSchedule }],
          });
     }

     /**
      * Mark a follow-up as done
      */
     async executeMarkFollowUpDone(
          workflowId: string,
          followUpId: string,
          outreachId: string,
          completedDate?: string
     ): Promise<MarkFollowUpDoneResult> {
          const client = await this.clientPromise;
          const handle = client.workflow.getHandle(workflowId);
          return await handle.executeUpdate("markFollowUpDone", {
               args: [{ followUpId, outreachId, completedDate }],
          });
     }

     /**
      * Change the contact's funnel stage
      */
     async executeChangeStage(
          workflowId: string,
          newStage: FunnelStage,
          occurredAt?: string,
          reason?: string
     ): Promise<ChangeStageResult> {
          const client = await this.clientPromise;
          const handle = client.workflow.getHandle(workflowId);
          return await handle.executeUpdate("changeStage", {
               args: [{ newStage, occurredAt, reason }],
          });
     }

     /**
      * Record that a contact responded to an outreach
      */
     async executeContactResponded(
          workflowId: string,
          outreachId: string,
          responseDate: string,
          responseContext?: string
     ): Promise<ContactRespondedResult> {
          const client = await this.clientPromise;
          const handle = client.workflow.getHandle(workflowId);
          return await handle.executeUpdate("contactResponded", {
               args: [{ outreachId, responseDate, responseContext }],
          });
     }

     /**
      * Cancel all reminders for an outreach
      */
     async executeCancelOutreachReminders(
          workflowId: string,
          outreachId: string,
          reason?: string
     ): Promise<CancelOutreachRemindersResult> {
          const client = await this.clientPromise;
          const handle = client.workflow.getHandle(workflowId);
          return await handle.executeUpdate("cancelOutreachReminders", {
               args: [{ outreachId, reason }],
          });
     }

     /**
      * Query the current state of a contact's workflow
      */
     async queryContactState(
          workflowId: string
     ): Promise<ContactLifecycleState | null> {
          try {
               const client = await this.clientPromise;
               const handle = client.workflow.getHandle(workflowId);
               return await handle.query("getState");
          } catch {
               return null;
          }
     }

     /**
      * Signal the workflow to cancel (fire-and-forget)
      */
     async signalCancelWorkflow(workflowId: string): Promise<void> {
          const client = await this.clientPromise;
          const handle = client.workflow.getHandle(workflowId);
          await handle.signal("cancel");
     }

     /**
      * Check if a workflow exists and is running
      */
     async isWorkflowRunning(workflowId: string): Promise<boolean> {
          try {
               const client = await this.clientPromise;
               const handle = client.workflow.getHandle(workflowId);
               const description = await handle.describe();
               return description.status.name === "RUNNING";
          } catch {
               return false;
          }
     }
}

export function getTemporalClientInstance(): TemporalClient {
     return new TemporalClient();
}
