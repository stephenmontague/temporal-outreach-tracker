import { formatContactName } from "@/lib/constants";
import { FunnelStage } from "@/models/FunnelStage";
import { ContactService } from "@/server/services/ContactService";
import { getTemporalClientInstance } from "@/server/temporal/client/TemporalClient";

const contactService = new ContactService();
const temporalClient = getTemporalClientInstance();

/**
 * Get the formatted contact name for use in workflow IDs
 * @param contactId - The contact's database ID
 * @returns The formatted contact name (slugified)
 * @throws Error if contact is not found
 */
export async function getContactName(contactId: string): Promise<string> {
     const contact = await contactService.getContactById(contactId);
     if (!contact) {
          throw new Error(`Contact ${contactId} not found`);
     }
     const name = formatContactName(
          contact.firstName,
          contact.lastName,
          contact.slackUsername
     );
     return name || contact.firstName || "unknown";
}

/**
 * Ensure a ContactLifecycleWorkflow is running for a contact.
 * If no workflow exists, starts a new one.
 * @param contactId - The contact's database ID
 * @param contactName - The formatted contact name (from getContactName)
 * @param userId - The current user's ID
 * @param initialStage - Optional initial funnel stage for new workflows
 * @returns The workflow ID
 */
export async function ensureContactWorkflow(
     contactId: string,
     contactName: string,
     userId: string,
     initialStage?: FunnelStage
): Promise<string> {
     const workflowId = temporalClient.getContactWorkflowId(
          contactId,
          contactName
     );

     // Check if workflow is already running
     const isRunning = await temporalClient.isWorkflowRunning(workflowId);
     if (!isRunning) {
          // Start a new workflow
          await temporalClient.startContactLifecycleWorkflow({
               contactId,
               contactName,
               userId,
               initialStage,
          });
     }

     return workflowId;
}
