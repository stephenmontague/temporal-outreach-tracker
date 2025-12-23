import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";

async function run() {
     const address = process.env.TEMPORAL_ADDRESS || "localhost:7233";
     const isCloud =
          address.includes("api.temporal.io") ||
          address.includes("tmprl.cloud");

     // For Temporal Cloud, require API key
     if (isCloud && !process.env.TEMPORAL_API_KEY) {
          throw new Error(
               "TEMPORAL_API_KEY environment variable is required for Temporal Cloud. " +
                    "Please set it in your .env.local file."
          );
     }

     const connection = await NativeConnection.connect({
          address,
          tls: process.env.TEMPORAL_TLS === "true" ? {} : undefined,
          apiKey: process.env.TEMPORAL_API_KEY,
     });

     const worker = await Worker.create({
          connection,
          namespace: process.env.TEMPORAL_NAMESPACE || "default",
          taskQueue: "outreach-tracking",
          workflowsPath: require.resolve("./workflows"),
          activities: {
               persistOutreachActivity: activities.persistOutreachActivity,
               persistStageChangeActivity:
                    activities.persistStageChangeActivity,
               persistFollowUpCompletionActivity:
                    activities.persistFollowUpCompletionActivity,
               syncReminderScheduleActivity:
                    activities.syncReminderScheduleActivity,
               cancelOutreachRemindersActivity:
                    activities.cancelOutreachRemindersActivity,
               sendReminderNotificationActivity:
                    activities.sendReminderNotificationActivity,
               persistContactResponseActivity:
                    activities.persistContactResponseActivity,
          },
     });

     await worker.run();
}

run().catch((err) => {
     console.error(err);
     process.exit(1);
});
