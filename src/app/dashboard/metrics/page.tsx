import { MetricsPageClient } from "@/components/dashboard/MetricsPageClient";
import { getUserId } from "@/lib/constants";
import { serializeForClient } from "@/lib/utils";
import { MetricsService } from "@/server/services/MetricsService";

const metricsService = new MetricsService();

export default async function MetricsPage() {
     const userId = getUserId();

     const [
          metrics,
          multiQuarterMetrics,
          multiMonthMetrics,
          multiYearMetrics,
          outreachEfficiency,
          meetingPaths,
          funnelPaths,
     ] = await Promise.all([
          metricsService.getAllMetrics(userId),
          metricsService.getMultiQuarterMetrics(userId, 6),
          metricsService.getMultiMonthMetrics(userId, 12),
          metricsService.getMultiYearMetrics(userId, 3),
          metricsService.getOutreachEfficiencyMetrics(userId),
          metricsService.getMeetingPathMetrics(userId),
          metricsService.getFunnelPathMetrics(userId),
     ]);

     return (
          <MetricsPageClient
               initialMetrics={metrics}
               multiQuarterMetrics={serializeForClient(multiQuarterMetrics)}
               multiMonthMetrics={serializeForClient(multiMonthMetrics)}
               multiYearMetrics={serializeForClient(multiYearMetrics)}
               outreachEfficiency={outreachEfficiency}
               meetingPaths={meetingPaths}
               funnelPaths={funnelPaths}
          />
     );
}
