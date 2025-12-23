import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCard } from "./MetricsCard";

interface VelocityMetricsProps {
     avgDaysOutreachToMeeting: number;
     avgDaysMeetingToStage1: number;
     avgDaysOutreachToStage1: number;
}

export function VelocityMetrics({
     avgDaysOutreachToMeeting,
     avgDaysMeetingToStage1,
     avgDaysOutreachToStage1,
}: VelocityMetricsProps) {
     return (
          <div className="grid gap-4 md:grid-cols-3">
               <MetricsCard
                    title="Avg: Outreach → Meeting"
                    value={`${avgDaysOutreachToMeeting.toFixed(1)} days`}
                    description="Average time from outreach to meeting"
               />
               <MetricsCard
                    title="Avg: Meeting → Stage 1"
                    value={`${avgDaysMeetingToStage1.toFixed(1)} days`}
                    description="Average time from meeting to Stage 1"
               />
               <MetricsCard
                    title="Avg: Outreach → Stage 1"
                    value={`${avgDaysOutreachToStage1.toFixed(1)} days`}
                    description="Average time from outreach to Stage 1"
               />
          </div>
     );
}
