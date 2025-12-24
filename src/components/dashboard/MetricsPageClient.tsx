"use client";

import { useState, useMemo } from "react";
import { ConversionFunnel } from "@/components/dashboard/ConversionFunnel";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { VelocityMetrics } from "@/components/dashboard/VelocityMetrics";
import { ThroughputChart } from "@/components/dashboard/ThroughputChart";
import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
} from "@/components/ui/select";
import type {
     AllMetrics,
     MultiQuarterMetrics,
     MultiPeriodMetrics,
     PeriodMetrics,
     TimePeriodType,
     OutreachEfficiencyMetrics,
     MeetingPathMetrics,
     FunnelPathMetrics,
} from "@/server/services/MetricsService";
import { TrendingUp, TrendingDown, Calendar, Target, Zap, Route, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface MetricsPageClientProps {
     initialMetrics: AllMetrics;
     multiQuarterMetrics: MultiQuarterMetrics;
     multiMonthMetrics: MultiPeriodMetrics;
     multiYearMetrics: MultiPeriodMetrics;
     outreachEfficiency: OutreachEfficiencyMetrics;
     meetingPaths: MeetingPathMetrics;
     funnelPaths: FunnelPathMetrics;
}

export function MetricsPageClient({
     initialMetrics,
     multiQuarterMetrics,
     multiMonthMetrics,
     multiYearMetrics,
     outreachEfficiency,
     meetingPaths,
     funnelPaths,
}: MetricsPageClientProps) {
     const [periodType, setPeriodType] = useState<TimePeriodType>("quarterly");
     const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0);
     const [comparisonPeriodIndex, setComparisonPeriodIndex] = useState<
          number | null
     >(1);
     const [showComparison, setShowComparison] = useState(true);

     // Get the current periods based on selected period type
     const currentPeriods = useMemo((): PeriodMetrics[] => {
          switch (periodType) {
               case "monthly":
                    return multiMonthMetrics.periods;
               case "yearly":
                    return multiYearMetrics.periods;
               case "quarterly":
               default:
                    return multiQuarterMetrics.quarters.map((q) => ({
                         ...q,
                         label: q.quarter,
                    }));
          }
     }, [periodType, multiMonthMetrics, multiYearMetrics, multiQuarterMetrics]);

     const selectedPeriod = currentPeriods[selectedPeriodIndex];
     const comparisonPeriod =
          comparisonPeriodIndex !== null
               ? currentPeriods[comparisonPeriodIndex]
               : null;

     const handlePeriodTypeChange = (newType: TimePeriodType) => {
          setPeriodType(newType);
          setSelectedPeriodIndex(0);
          setComparisonPeriodIndex(1);
     };

     const formatChange = (change: number): string => {
          const sign = change >= 0 ? "+" : "";
          return `${sign}${change.toFixed(1)}%`;
     };

     const getChangeColor = (change: number): string => {
          return change >= 0 ? "text-green-600" : "text-red-600";
     };

     // Calculate changes between selected and comparison periods
     const changes = useMemo(() => {
          const calculateChange = (current: number, previous: number): number => {
               if (previous === 0) return current > 0 ? 100 : 0;
               return ((current - previous) / previous) * 100;
          };

          if (!comparisonPeriod) {
               return {
                    outreaches: 0,
                    meetings: 0,
                    aeMeetings: 0,
                    stage1Opportunities: 0,
                    conversionRates: {
                         outreachToMeeting: 0,
                         outreachToAEMeeting: 0,
                         meetingToAEMeeting: 0,
                         aeMeetingToStage1: 0,
                         overallOutreachToStage1: 0,
                    },
               };
          }

          return {
               outreaches: calculateChange(
                    selectedPeriod.outreaches,
                    comparisonPeriod.outreaches
               ),
               meetings: calculateChange(
                    selectedPeriod.meetings,
                    comparisonPeriod.meetings
               ),
               aeMeetings: calculateChange(
                    selectedPeriod.aeMeetings,
                    comparisonPeriod.aeMeetings
               ),
               stage1Opportunities: calculateChange(
                    selectedPeriod.stage1Opportunities,
                    comparisonPeriod.stage1Opportunities
               ),
               conversionRates: {
                    outreachToMeeting: calculateChange(
                         selectedPeriod.conversionRates.outreachToMeeting,
                         comparisonPeriod.conversionRates.outreachToMeeting
                    ),
                    outreachToAEMeeting: calculateChange(
                         selectedPeriod.conversionRates.outreachToAEMeeting,
                         comparisonPeriod.conversionRates.outreachToAEMeeting
                    ),
                    meetingToAEMeeting: calculateChange(
                         selectedPeriod.conversionRates.meetingToAEMeeting,
                         comparisonPeriod.conversionRates.meetingToAEMeeting
                    ),
                    aeMeetingToStage1: calculateChange(
                         selectedPeriod.conversionRates.aeMeetingToStage1,
                         comparisonPeriod.conversionRates.aeMeetingToStage1
                    ),
                    overallOutreachToStage1: calculateChange(
                         selectedPeriod.conversionRates.overallOutreachToStage1,
                         comparisonPeriod.conversionRates.overallOutreachToStage1
                    ),
               },
          };
     }, [selectedPeriod, comparisonPeriod]);

     // Generate throughput data from periods for chart
     const throughputData = useMemo(() => {
          return currentPeriods.slice(0, 8).reverse().map((p) => ({
               date: p.label,
               value: p.outreaches,
          }));
     }, [currentPeriods]);

     return (
          <div className="space-y-6">
               {/* Header with Period Selection */}
               <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                         <h1 className="text-3xl font-bold">Metrics</h1>
                         <p className="text-muted-foreground">
                              Detailed analytics and performance metrics
                         </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                         {/* Period Type Toggle */}
                         <div className="flex items-center border rounded-lg overflow-hidden">
                              <button
                                   onClick={() => handlePeriodTypeChange("monthly")}
                                   className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                        periodType === "monthly"
                                             ? "bg-primary text-primary-foreground"
                                             : "hover:bg-muted"
                                   }`}
                              >
                                   Monthly
                              </button>
                              <button
                                   onClick={() => handlePeriodTypeChange("quarterly")}
                                   className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                        periodType === "quarterly"
                                             ? "bg-primary text-primary-foreground"
                                             : "hover:bg-muted"
                                   }`}
                              >
                                   Quarterly
                              </button>
                              <button
                                   onClick={() => handlePeriodTypeChange("yearly")}
                                   className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                        periodType === "yearly"
                                             ? "bg-primary text-primary-foreground"
                                             : "hover:bg-muted"
                                   }`}
                              >
                                   Yearly
                              </button>
                         </div>

                         {/* Period Selector */}
                         <Select
                              value={selectedPeriodIndex.toString()}
                              onValueChange={(val) => setSelectedPeriodIndex(parseInt(val))}
                         >
                              <SelectTrigger className="w-[180px]">
                                   <Calendar className="h-4 w-4 mr-2" />
                                   {selectedPeriod.label}
                                   {selectedPeriodIndex === 0 && " (Current)"}
                              </SelectTrigger>
                              <SelectContent>
                                   {currentPeriods.map((p, idx) => (
                                        <SelectItem key={p.label} value={idx.toString()}>
                                             {p.label}
                                             {idx === 0 && " (Current)"}
                                        </SelectItem>
                                   ))}
                              </SelectContent>
                         </Select>

                         {/* Comparison Period Selector */}
                         {showComparison && (
                              <Select
                                   value={comparisonPeriodIndex?.toString() ?? "none"}
                                   onValueChange={(val) =>
                                        setComparisonPeriodIndex(
                                             val === "none" ? null : parseInt(val)
                                        )
                                   }
                              >
                                   <SelectTrigger className="w-[180px]">
                                        {comparisonPeriod
                                             ? `vs ${comparisonPeriod.label}`
                                             : "No comparison"}
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="none">No comparison</SelectItem>
                                        {currentPeriods.map((p, idx) => (
                                             <SelectItem
                                                  key={p.label}
                                                  value={idx.toString()}
                                                  disabled={idx === selectedPeriodIndex}
                                             >
                                                  {p.label}
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                         )}

                         <label className="flex items-center gap-2 text-sm">
                              <input
                                   type="checkbox"
                                   checked={showComparison}
                                   onChange={(e) => setShowComparison(e.target.checked)}
                                   className="rounded"
                              />
                              Compare
                         </label>
                    </div>
               </div>

               {/* Conversion Rate Cards */}
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="p-4 border rounded-lg bg-card">
                         <div className="text-sm text-muted-foreground">
                              Outreach → Solo Meeting
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.outreachToMeeting.toFixed(1)}%
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.outreachToMeeting !== 0 && (
                                        <span
                                             className={`flex items-center gap-1 text-sm ${getChangeColor(
                                                  changes.conversionRates.outreachToMeeting
                                             )}`}
                                        >
                                             {changes.conversionRates.outreachToMeeting > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(changes.conversionRates.outreachToMeeting)}
                                        </span>
                                   )}
                         </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-card border-purple-200 dark:border-purple-800">
                         <div className="text-sm text-muted-foreground">
                              Outreach → AE Meeting
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.outreachToAEMeeting.toFixed(1)}%
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.outreachToAEMeeting !== 0 && (
                                        <span
                                             className={`flex items-center gap-1 text-sm ${getChangeColor(
                                                  changes.conversionRates.outreachToAEMeeting
                                             )}`}
                                        >
                                             {changes.conversionRates.outreachToAEMeeting > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(changes.conversionRates.outreachToAEMeeting)}
                                        </span>
                                   )}
                         </div>
                         <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              All paths to AE
                         </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                         <div className="text-sm text-muted-foreground">
                              Solo → AE Meeting
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.meetingToAEMeeting.toFixed(1)}%
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.meetingToAEMeeting !== 0 && (
                                        <span
                                             className={`flex items-center gap-1 text-sm ${getChangeColor(
                                                  changes.conversionRates.meetingToAEMeeting
                                             )}`}
                                        >
                                             {changes.conversionRates.meetingToAEMeeting > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(changes.conversionRates.meetingToAEMeeting)}
                                        </span>
                                   )}
                         </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                         <div className="text-sm text-muted-foreground">
                              AE Meeting → Stage 1
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.aeMeetingToStage1.toFixed(1)}%
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.aeMeetingToStage1 !== 0 && (
                                        <span
                                             className={`flex items-center gap-1 text-sm ${getChangeColor(
                                                  changes.conversionRates.aeMeetingToStage1
                                             )}`}
                                        >
                                             {changes.conversionRates.aeMeetingToStage1 > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(changes.conversionRates.aeMeetingToStage1)}
                                        </span>
                                   )}
                         </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                         <div className="text-sm text-muted-foreground">
                              Overall: Outreach → Stage 1
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.overallOutreachToStage1.toFixed(1)}%
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.overallOutreachToStage1 !== 0 && (
                                        <span
                                             className={`flex items-center gap-1 text-sm ${getChangeColor(
                                                  changes.conversionRates.overallOutreachToStage1
                                             )}`}
                                        >
                                             {changes.conversionRates.overallOutreachToStage1 > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(changes.conversionRates.overallOutreachToStage1)}
                                        </span>
                                   )}
                         </div>
                    </div>
               </div>

               {/* Outreach Efficiency Section */}
               <Card>
                    <CardHeader>
                         <div className="flex items-center gap-2">
                              <Zap className="h-5 w-5 text-amber-500" />
                              <CardTitle>Outreach Efficiency</CardTitle>
                         </div>
                         <CardDescription>
                              How many touches it takes to move contacts through your funnel
                         </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                              <div className="p-4 bg-muted/50 rounded-lg">
                                   <div className="text-sm text-muted-foreground">Avg Touches to Meeting</div>
                                   <div className="text-3xl font-bold mt-1">
                                        {outreachEfficiency.avgTouchesToMeeting.toFixed(1)}
                                   </div>
                                   <div className="text-xs text-muted-foreground mt-1">
                                        outreaches per meeting booked
                                   </div>
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg">
                                   <div className="text-sm text-muted-foreground">Avg Touches to AE Meeting</div>
                                   <div className="text-3xl font-bold mt-1">
                                        {outreachEfficiency.avgTouchesToAEMeeting.toFixed(1)}
                                   </div>
                                   <div className="text-xs text-muted-foreground mt-1">
                                        outreaches per AE meeting
                                   </div>
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg">
                                   <div className="text-sm text-muted-foreground">Avg Touches to Stage 1</div>
                                   <div className="text-3xl font-bold mt-1">
                                        {outreachEfficiency.avgTouchesToStage1.toFixed(1)}
                                   </div>
                                   <div className="text-xs text-muted-foreground mt-1">
                                        outreaches per Stage 1
                                   </div>
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg">
                                   <div className="text-sm text-muted-foreground">Response Rate</div>
                                   <div className="text-3xl font-bold mt-1">
                                        {outreachEfficiency.responseRate.toFixed(1)}%
                                   </div>
                                   <div className="text-xs text-muted-foreground mt-1">
                                        of outreaches get responses
                                   </div>
                              </div>
                         </div>

                         {/* Method Effectiveness */}
                         <div className="mt-6">
                              <h4 className="text-sm font-medium mb-3">Outreach Method Effectiveness</h4>
                              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                                   {outreachEfficiency.methodEffectiveness.map((method) => (
                                        <div key={method.method} className="p-3 border rounded-lg">
                                             <div className="text-sm font-medium">{method.method}</div>
                                             <div className="flex items-baseline gap-2 mt-1">
                                                  <span className="text-lg font-bold">{method.count}</span>
                                                  <span className="text-xs text-muted-foreground">outreaches</span>
                                             </div>
                                             <div className="text-xs text-muted-foreground mt-1">
                                                  {method.responseRate.toFixed(1)}% response rate
                                             </div>
                                             <div className="text-xs text-green-600 mt-0.5">
                                                  {method.meetingConversionRate.toFixed(1)}% → meeting
                                             </div>
                                        </div>
                                   ))}
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Meeting Path Analysis */}
               <Card>
                    <CardHeader>
                         <div className="flex items-center gap-2">
                              <Route className="h-5 w-5 text-blue-500" />
                              <CardTitle>Meeting Path Analysis</CardTitle>
                         </div>
                         <CardDescription>
                              How contacts move through solo meetings vs direct to AE
                         </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                   <div className="text-sm text-blue-700 dark:text-blue-300">Solo Meetings</div>
                                   <div className="text-3xl font-bold mt-1 text-blue-900 dark:text-blue-100">
                                        {meetingPaths.soloMeetingsCount}
                                   </div>
                                   <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        {meetingPaths.soloToAEConversionRate.toFixed(1)}% converted to AE
                                   </div>
                              </div>
                              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                                   <div className="text-sm text-purple-700 dark:text-purple-300">Direct to AE</div>
                                   <div className="text-3xl font-bold mt-1 text-purple-900 dark:text-purple-100">
                                        {meetingPaths.directToAECount}
                                   </div>
                                   <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                        skipped solo meeting
                                   </div>
                              </div>
                              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                   <div className="text-sm text-green-700 dark:text-green-300">Solo → AE Converted</div>
                                   <div className="text-3xl font-bold mt-1 text-green-900 dark:text-green-100">
                                        {meetingPaths.soloToAECount}
                                   </div>
                                   <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                        from solo meetings
                                   </div>
                              </div>
                              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                                   <div className="text-sm text-amber-700 dark:text-amber-300">Total AE Meetings</div>
                                   <div className="text-3xl font-bold mt-1 text-amber-900 dark:text-amber-100">
                                        {meetingPaths.totalAEMeetings}
                                   </div>
                                   <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                        all paths combined
                                   </div>
                              </div>
                         </div>

                         {/* Meeting Outcomes */}
                         <div className="mt-6">
                              <h4 className="text-sm font-medium mb-3">Meeting Outcomes</h4>
                              <div className="grid gap-3 md:grid-cols-4">
                                   <div className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm">Positive</span>
                                             <span className="text-lg font-bold text-green-600">
                                                  {meetingPaths.outcomes.positive}
                                             </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                                             <div
                                                  className="bg-green-500 h-2 rounded-full"
                                                  style={{
                                                       width: `${
                                                            meetingPaths.outcomes.total > 0
                                                                 ? (meetingPaths.outcomes.positive / meetingPaths.outcomes.total) * 100
                                                                 : 0
                                                       }%`,
                                                  }}
                                             />
                                        </div>
                                   </div>
                                   <div className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm">Negative</span>
                                             <span className="text-lg font-bold text-red-600">
                                                  {meetingPaths.outcomes.negative}
                                             </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                                             <div
                                                  className="bg-red-500 h-2 rounded-full"
                                                  style={{
                                                       width: `${
                                                            meetingPaths.outcomes.total > 0
                                                                 ? (meetingPaths.outcomes.negative / meetingPaths.outcomes.total) * 100
                                                                 : 0
                                                       }%`,
                                                  }}
                                             />
                                        </div>
                                   </div>
                                   <div className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm">Rescheduled</span>
                                             <span className="text-lg font-bold text-amber-600">
                                                  {meetingPaths.outcomes.rescheduled}
                                             </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                                             <div
                                                  className="bg-amber-500 h-2 rounded-full"
                                                  style={{
                                                       width: `${
                                                            meetingPaths.outcomes.total > 0
                                                                 ? (meetingPaths.outcomes.rescheduled / meetingPaths.outcomes.total) * 100
                                                                 : 0
                                                       }%`,
                                                  }}
                                             />
                                        </div>
                                   </div>
                                   <div className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                             <span className="text-sm">No Show</span>
                                             <span className="text-lg font-bold text-gray-600">
                                                  {meetingPaths.outcomes.noShow}
                                             </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                                             <div
                                                  className="bg-gray-500 h-2 rounded-full"
                                                  style={{
                                                       width: `${
                                                            meetingPaths.outcomes.total > 0
                                                                 ? (meetingPaths.outcomes.noShow / meetingPaths.outcomes.total) * 100
                                                                 : 0
                                                       }%`,
                                                  }}
                                             />
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </CardContent>
               </Card>

               {/* Funnel Path Comparison */}
               <Card>
                    <CardHeader>
                         <div className="flex items-center gap-2">
                              <Target className="h-5 w-5 text-green-500" />
                              <CardTitle>Funnel Path Comparison</CardTitle>
                         </div>
                         <CardDescription>
                              Standard path (with solo meeting) vs Direct-to-AE path performance
                         </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid gap-6 md:grid-cols-2">
                              {/* Standard Path */}
                              <div className="p-4 border rounded-lg">
                                   <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <h4 className="font-medium">Standard Path</h4>
                                   </div>
                                   <p className="text-xs text-muted-foreground mb-4">
                                        Outreach → Solo Meeting → AE Meeting → Stage 1
                                   </p>
                                   <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Contacts</span>
                                             <span className="text-lg font-bold">{funnelPaths.standardPath.count}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Stage 1 Conversions</span>
                                             <span className="text-lg font-bold text-green-600">
                                                  {funnelPaths.standardPath.stage1Count}
                                             </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Conversion Rate</span>
                                             <span className="text-lg font-bold">
                                                  {funnelPaths.standardPath.conversionRate.toFixed(1)}%
                                             </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Avg Days to Stage 1</span>
                                             <span className="text-lg font-bold">
                                                  {funnelPaths.standardPath.avgDaysToStage1.toFixed(1)}
                                             </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Avg Touches</span>
                                             <span className="text-lg font-bold">
                                                  {funnelPaths.standardPath.avgTouches.toFixed(1)}
                                             </span>
                                        </div>
                                   </div>
                              </div>

                              {/* Direct-to-AE Path */}
                              <div className="p-4 border rounded-lg">
                                   <div className="flex items-center gap-2 mb-4">
                                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                                        <h4 className="font-medium">Direct-to-AE Path</h4>
                                   </div>
                                   <p className="text-xs text-muted-foreground mb-4">
                                        Outreach → AE Meeting → Stage 1 (skipped solo)
                                   </p>
                                   <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Contacts</span>
                                             <span className="text-lg font-bold">{funnelPaths.directToAEPath.count}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Stage 1 Conversions</span>
                                             <span className="text-lg font-bold text-green-600">
                                                  {funnelPaths.directToAEPath.stage1Count}
                                             </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Conversion Rate</span>
                                             <span className="text-lg font-bold">
                                                  {funnelPaths.directToAEPath.conversionRate.toFixed(1)}%
                                             </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Avg Days to Stage 1</span>
                                             <span className="text-lg font-bold">
                                                  {funnelPaths.directToAEPath.avgDaysToStage1.toFixed(1)}
                                             </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                             <span className="text-sm text-muted-foreground">Avg Touches</span>
                                             <span className="text-lg font-bold">
                                                  {funnelPaths.directToAEPath.avgTouches.toFixed(1)}
                                             </span>
                                        </div>
                                   </div>
                              </div>
                         </div>

                         {/* Path Comparison Summary */}
                         {(funnelPaths.standardPath.count > 0 || funnelPaths.directToAEPath.count > 0) && (
                              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                                   <h4 className="text-sm font-medium mb-2">Path Insights</h4>
                                   <div className="text-sm text-muted-foreground space-y-1">
                                        {funnelPaths.standardPath.conversionRate > funnelPaths.directToAEPath.conversionRate ? (
                                             <p>
                                                  Standard path has a{" "}
                                                  <span className="font-medium text-foreground">
                                                       {(funnelPaths.standardPath.conversionRate - funnelPaths.directToAEPath.conversionRate).toFixed(1)}%
                                                  </span>{" "}
                                                  higher conversion rate
                                             </p>
                                        ) : funnelPaths.directToAEPath.conversionRate > funnelPaths.standardPath.conversionRate ? (
                                             <p>
                                                  Direct-to-AE path has a{" "}
                                                  <span className="font-medium text-foreground">
                                                       {(funnelPaths.directToAEPath.conversionRate - funnelPaths.standardPath.conversionRate).toFixed(1)}%
                                                  </span>{" "}
                                                  higher conversion rate
                                             </p>
                                        ) : null}
                                        {funnelPaths.standardPath.avgDaysToStage1 > 0 && funnelPaths.directToAEPath.avgDaysToStage1 > 0 && (
                                             <p>
                                                  {funnelPaths.directToAEPath.avgDaysToStage1 < funnelPaths.standardPath.avgDaysToStage1 ? (
                                                       <>
                                                            Direct-to-AE is{" "}
                                                            <span className="font-medium text-foreground">
                                                                 {(funnelPaths.standardPath.avgDaysToStage1 - funnelPaths.directToAEPath.avgDaysToStage1).toFixed(1)} days
                                                            </span>{" "}
                                                            faster to Stage 1
                                                       </>
                                                  ) : (
                                                       <>
                                                            Standard path is{" "}
                                                            <span className="font-medium text-foreground">
                                                                 {(funnelPaths.directToAEPath.avgDaysToStage1 - funnelPaths.standardPath.avgDaysToStage1).toFixed(1)} days
                                                            </span>{" "}
                                                            faster to Stage 1
                                                       </>
                                                  )}
                                             </p>
                                        )}
                                   </div>
                              </div>
                         )}
                    </CardContent>
               </Card>

               {/* Funnel and Velocity */}
               <div className="grid gap-4 md:grid-cols-2">
                    <ConversionFunnel
                         outreaches={selectedPeriod.outreaches}
                         meetings={selectedPeriod.meetings}
                         aeMeetings={selectedPeriod.aeMeetings}
                         stage1={selectedPeriod.stage1Opportunities}
                         uniqueContacts={selectedPeriod.uniqueContacts}
                    />
                    <VelocityMetrics
                         avgDaysOutreachToMeeting={selectedPeriod.velocity.avgDaysOutreachToMeeting}
                         avgDaysMeetingToStage1={selectedPeriod.velocity.avgDaysMeetingToStage1}
                         avgDaysOutreachToStage1={selectedPeriod.velocity.avgDaysOutreachToStage1}
                    />
               </div>

               {/* Throughput Chart */}
               <ThroughputChart data={throughputData} title={`${periodType === "monthly" ? "Monthly" : periodType === "quarterly" ? "Quarterly" : "Yearly"} Outreach Volume`} />
          </div>
     );
}

