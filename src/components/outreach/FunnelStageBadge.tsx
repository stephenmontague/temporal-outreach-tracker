import { Badge } from "@/components/ui/badge";
import { FunnelStage } from "@/models/FunnelStage";
import { cn } from "@/lib/utils";

const stageColors: Record<FunnelStage, string> = {
     [FunnelStage.OUTREACH]: "bg-blue-500",
     [FunnelStage.MEETING_BOOKED]: "bg-yellow-500",
     [FunnelStage.AE_MEETING]: "bg-orange-500",
     [FunnelStage.OPPORTUNITY_CREATED]: "bg-purple-500",
     [FunnelStage.STAGE_1]: "bg-green-500",
     [FunnelStage.LOST]: "bg-red-500",
     [FunnelStage.INACTIVE]: "bg-gray-500",
};

const stageLabels: Record<FunnelStage, string> = {
     [FunnelStage.OUTREACH]: "Outreach",
     [FunnelStage.MEETING_BOOKED]: "Meeting Booked",
     [FunnelStage.AE_MEETING]: "AE Meeting",
     [FunnelStage.OPPORTUNITY_CREATED]: "Opportunity Created",
     [FunnelStage.STAGE_1]: "Stage 1",
     [FunnelStage.LOST]: "Lost",
     [FunnelStage.INACTIVE]: "Inactive",
};

interface FunnelStageBadgeProps {
     stage: FunnelStage;
     className?: string;
}

export function FunnelStageBadge({ stage, className }: FunnelStageBadgeProps) {
     return (
          <Badge
               variant="outline"
               className={cn(
                    "border-0 text-white",
                    stageColors[stage],
                    className
               )}
          >
               {stageLabels[stage]}
          </Badge>
     );
}
