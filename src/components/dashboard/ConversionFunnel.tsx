"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, Users, Trophy } from "lucide-react";

interface ConversionFunnelProps {
     outreaches: number;
     meetings: number;
     aeMeetings: number;
     stage1: number;
     uniqueContacts?: number; // Optional - will be calculated from outreaches if not provided
}

export function ConversionFunnel({
     outreaches,
     meetings,
     aeMeetings,
     stage1,
     uniqueContacts,
}: ConversionFunnelProps) {
     // Calculate efficiency metrics
     // Meetings: avg outreaches per meeting (lower is better)
     const outreachesPerMeeting = meetings > 0 ? outreaches / meetings : 0;
     
     // AE Meetings: avg outreaches per AE meeting (lower is better)
     const outreachesPerAEMeeting = aeMeetings > 0 ? outreaches / aeMeetings : 0;
     
     // Stage 1: % of unique contacts that became Stage 1
     // If uniqueContacts not provided, use outreaches as a proxy (may overcount if multiple outreaches per contact)
     const contactsReached = uniqueContacts ?? outreaches;
     const stage1ConversionRate = contactsReached > 0 ? (stage1 / contactsReached) * 100 : 0;

     const metrics = [
          {
               label: "Outreaches per Meeting",
               value: outreachesPerMeeting,
               displayValue: outreachesPerMeeting > 0 ? outreachesPerMeeting.toFixed(1) : "—",
               subtext: meetings > 0 ? `${outreaches} outreaches → ${meetings} meetings` : "No meetings yet",
               icon: Calendar,
               color: "text-blue-600",
               bgColor: "bg-blue-100 dark:bg-blue-950",
          },
          {
               label: "Outreaches per AE Meeting",
               value: outreachesPerAEMeeting,
               displayValue: outreachesPerAEMeeting > 0 ? outreachesPerAEMeeting.toFixed(1) : "—",
               subtext: aeMeetings > 0 ? `${outreaches} outreaches → ${aeMeetings} AE meetings` : "No AE meetings yet",
               icon: Users,
               color: "text-purple-600",
               bgColor: "bg-purple-100 dark:bg-purple-950",
          },
          {
               label: "Contact → Stage 1 Rate",
               value: stage1ConversionRate,
               displayValue: `${stage1ConversionRate.toFixed(1)}%`,
               subtext: contactsReached > 0 ? `${stage1} of ${contactsReached} contacts` : "No contacts yet",
               icon: Trophy,
               color: "text-amber-600",
               bgColor: "bg-amber-100 dark:bg-amber-950",
          },
     ];

     return (
          <Card>
               <CardHeader>
                    <CardTitle>Conversion Efficiency</CardTitle>
               </CardHeader>
               <CardContent>
                    <div className="space-y-4">
                         {metrics.map((metric, index) => {
                              const Icon = metric.icon;
                              return (
                                   <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                                        <div className={`p-2.5 rounded-full ${metric.bgColor}`}>
                                             <Icon className={`h-5 w-5 ${metric.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                             <div className="flex items-center justify-between">
                                                  <span className="text-sm font-medium">
                                                       {metric.label}
                                                  </span>
                                                  <span className="text-xl font-bold">
                                                       {metric.displayValue}
                                                  </span>
                                             </div>
                                             <p className="text-xs text-muted-foreground mt-0.5">
                                                  {metric.subtext}
                                             </p>
                                        </div>
                                   </div>
                              );
                         })}
                    </div>
                    
                    {/* Summary insight */}
                    <div className="mt-4 pt-4 border-t">
                         <p className="text-xs text-muted-foreground">
                              {outreachesPerMeeting > 0 && outreachesPerMeeting <= 10 && (
                                   <span className="text-green-600">Great efficiency! </span>
                              )}
                              {outreachesPerMeeting > 10 && outreachesPerMeeting <= 20 && (
                                   <span className="text-amber-600">Good progress. </span>
                              )}
                              {outreachesPerMeeting > 20 && (
                                   <span className="text-red-600">Room for improvement. </span>
                              )}
                              Lower outreaches per meeting indicates better targeting and messaging effectiveness.
                         </p>
                    </div>
               </CardContent>
          </Card>
     );
}
