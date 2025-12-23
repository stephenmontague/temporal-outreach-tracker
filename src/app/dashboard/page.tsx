import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { getUserId } from "@/lib/constants";
import { serializeForClient } from "@/lib/utils";
import { FollowUpService } from "@/server/services/FollowUpService";
import { MetricsService } from "@/server/services/MetricsService";

const metricsService = new MetricsService();
const followUpService = new FollowUpService();

export default async function DashboardPage() {
     const userId = getUserId();
     const [
          metrics,
          followUpsWithContacts,
          multiQuarterMetrics,
          multiMonthMetrics,
          multiYearMetrics,
     ] = await Promise.all([
          metricsService.getAllMetrics(userId),
          followUpService.getUpcomingFollowUpsWithContacts(userId, 7),
          metricsService.getMultiQuarterMetrics(userId, 6),
          metricsService.getMultiMonthMetrics(userId, 12),
          metricsService.getMultiYearMetrics(userId, 3),
     ]);

     return (
          <DashboardClient
               initialMetrics={metrics}
               followUpsWithContacts={serializeForClient(followUpsWithContacts)}
               multiQuarterMetrics={serializeForClient(multiQuarterMetrics)}
               multiMonthMetrics={serializeForClient(multiMonthMetrics)}
               multiYearMetrics={serializeForClient(multiYearMetrics)}
          />
     );
}
