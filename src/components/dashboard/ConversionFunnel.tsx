"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConversionFunnelProps {
     outreaches: number;
     meetings: number;
     aeMeetings: number;
     stage1: number;
}

export function ConversionFunnel({
     outreaches,
     meetings,
     aeMeetings,
     stage1,
}: ConversionFunnelProps) {
     const stages = [
          { label: "Outreaches", value: outreaches, percentage: 100 },
          {
               label: "Meetings",
               value: meetings,
               percentage: outreaches > 0 ? (meetings / outreaches) * 100 : 0,
          },
          {
               label: "AE Meetings",
               value: aeMeetings,
               percentage: meetings > 0 ? (aeMeetings / meetings) * 100 : 0,
          },
          {
               label: "Stage 1",
               value: stage1,
               percentage: aeMeetings > 0 ? (stage1 / aeMeetings) * 100 : 0,
          },
     ];

     return (
          <Card>
               <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
               </CardHeader>
               <CardContent>
                    <div className="space-y-4">
                         {stages.map((stage, index) => (
                              <div key={index} className="space-y-2">
                                   <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                             {stage.label}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                             {stage.value} (
                                             {stage.percentage.toFixed(1)}%)
                                        </span>
                                   </div>
                                   <div className="h-8 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                             className="h-full bg-primary transition-all"
                                             style={{
                                                  width: `${stage.percentage}%`,
                                             }}
                                        />
                                   </div>
                              </div>
                         ))}
                    </div>
               </CardContent>
          </Card>
     );
}
