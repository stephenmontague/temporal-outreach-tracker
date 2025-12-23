import { MetricsService } from '@/server/services/MetricsService';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { ConversionFunnel } from '@/components/dashboard/ConversionFunnel';
import { VelocityMetrics } from '@/components/dashboard/VelocityMetrics';
import { ThroughputChart } from '@/components/dashboard/ThroughputChart';
import { getUserId } from '@/lib/constants';

const metricsService = new MetricsService();

export default async function MetricsPage() {
  const userId = getUserId();
  const metrics = await metricsService.getAllMetrics(userId);

  // Mock data for throughput chart - in production, you'd calculate this from actual data
  const throughputData = [
    { date: 'Week 1', value: metrics.throughput.weeklyOutreach },
    { date: 'Week 2', value: Math.max(0, metrics.throughput.weeklyOutreach - 2) },
    { date: 'Week 3', value: Math.max(0, metrics.throughput.weeklyOutreach - 1) },
    { date: 'Week 4', value: metrics.throughput.weeklyOutreach },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Metrics</h1>
        <p className="text-muted-foreground">
          Detailed analytics and performance metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Outreach → Meeting"
          value={`${metrics.conversionRates.outreachToMeeting.toFixed(1)}%`}
          description="Conversion rate"
        />
        <MetricsCard
          title="Meeting → AE Meeting"
          value={`${metrics.conversionRates.meetingToAEMeeting.toFixed(1)}%`}
          description="Conversion rate"
        />
        <MetricsCard
          title="AE Meeting → Stage 1"
          value={`${metrics.conversionRates.aeMeetingToStage1.toFixed(1)}%`}
          description="Conversion rate"
        />
        <MetricsCard
          title="Overall: Outreach → Stage 1"
          value={`${metrics.conversionRates.overallOutreachToStage1.toFixed(1)}%`}
          description="Overall conversion rate"
        />
      </div>

      <ConversionFunnel
        outreaches={100}
        meetings={Math.round((metrics.conversionRates.outreachToMeeting / 100) * 100)}
        aeMeetings={Math.round((metrics.conversionRates.meetingToAEMeeting / 100) * 45)}
        stage1={metrics.totalStage1Opportunities}
      />

      <VelocityMetrics
        avgDaysOutreachToMeeting={metrics.velocity.avgDaysOutreachToMeeting}
        avgDaysMeetingToStage1={metrics.velocity.avgDaysMeetingToStage1}
        avgDaysOutreachToStage1={metrics.velocity.avgDaysOutreachToStage1}
      />

      <ThroughputChart
        data={throughputData}
        title="Weekly Outreach Volume"
      />
    </div>
  );
}

