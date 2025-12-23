"use server";

import { revalidatePath } from "next/cache";
import { OutreachService } from "@/server/services/OutreachService";
import { updateOutreachSchema } from "@/lib/validations";
import { getErrorMessage, serializeForClient } from "@/lib/utils";

const outreachService = new OutreachService();

/**
 * Update outreach metadata (subject, notes, etc.).
 *
 * NOTE: This directly updates the database without going through the Temporal workflow.
 * This is intentional because these are simple metadata changes that don't affect
 * workflow state (reminder schedules, timers, etc.). Changes that affect workflow
 * state should use the workflow Update handlers via TemporalClient instead.
 */
export async function updateOutreach(id: string, formData: FormData) {
     try {
          const data: Record<string, unknown> = {};

          const method = formData.get("method");
          if (method) data.method = method;

          const dateTime = formData.get("dateTime");
          if (dateTime) data.dateTime = dateTime;

          const subject = formData.get("subject");
          if (subject !== null) data.subject = subject || undefined;

          const messagePreview = formData.get("messagePreview");
          if (messagePreview !== null)
               data.messagePreview = messagePreview || undefined;

          const notes = formData.get("notes");
          if (notes !== null) data.notes = notes || undefined;

          const validated = updateOutreachSchema.parse(data);
          const outreach = await outreachService.updateOutreach(id, validated);

          revalidatePath("/dashboard/outreaches");
          revalidatePath("/dashboard/contacts");
          return { success: true, outreach: serializeForClient(outreach) };
     } catch (error) {
          return { success: false, error: getErrorMessage(error) };
     }
}
