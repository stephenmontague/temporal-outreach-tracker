"use client";

import { useState, useMemo } from "react";
import { ConversionFunnel } from "@/components/dashboard/ConversionFunnel";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { UpcomingFollowUps } from "@/components/dashboard/UpcomingFollowUps";
import { VelocityMetrics } from "@/components/dashboard/VelocityMetrics";
import {
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
} from "@/components/ui/select";
// Import types from MetricsService - these are just TypeScript interfaces
import type {
     AllMetrics,
     MultiQuarterMetrics,
     MultiPeriodMetrics,
     PeriodMetrics,
     TimePeriodType,
} from "@/server/services/MetricsService";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface DashboardClientProps {
     initialMetrics: AllMetrics;
     followUpsWithContacts: any[];
     multiQuarterMetrics: MultiQuarterMetrics;
     multiMonthMetrics: MultiPeriodMetrics;
     multiYearMetrics: MultiPeriodMetrics;
}

export function DashboardClient({
     initialMetrics,
     followUpsWithContacts,
     multiQuarterMetrics,
     multiMonthMetrics,
     multiYearMetrics,
}: DashboardClientProps) {
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
                    // Map quarterly metrics to include 'label' property
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

     // Reset indices when period type changes
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

     // Get period type label for UI
     const getPeriodTypeLabel = (type: TimePeriodType): string => {
          switch (type) {
               case "monthly":
                    return "Month";
               case "yearly":
                    return "Year";
               case "quarterly":
               default:
                    return "Quarter";
          }
     };

     return (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h1 className="text-3xl font-bold">Dashboard</h1>
                         <p className="text-muted-foreground">
                              Track your outreach activities and conversion
                              metrics
                         </p>
                    </div>
                    <div className="flex items-center gap-4">
                         {/* Period Type Toggle */}
                         <div className="flex items-center border rounded-lg overflow-hidden">
                              <button
                                   onClick={() =>
                                        handlePeriodTypeChange("monthly")
                                   }
                                   className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                        periodType === "monthly"
                                             ? "bg-primary text-primary-foreground"
                                             : "hover:bg-muted"
                                   }`}
                              >
                                   Monthly
                              </button>
                              <button
                                   onClick={() =>
                                        handlePeriodTypeChange("quarterly")
                                   }
                                   className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                                        periodType === "quarterly"
                                             ? "bg-primary text-primary-foreground"
                                             : "hover:bg-muted"
                                   }`}
                              >
                                   Quarterly
                              </button>
                              <button
                                   onClick={() =>
                                        handlePeriodTypeChange("yearly")
                                   }
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
                              onValueChange={(val) =>
                                   setSelectedPeriodIndex(parseInt(val))
                              }
                         >
                              <SelectTrigger className="w-[180px]">
                                   <Calendar className="h-4 w-4 mr-2" />
                                   {selectedPeriod.label}
                                   {selectedPeriodIndex === 0 && " (Current)"}
                              </SelectTrigger>
                              <SelectContent>
                                   {currentPeriods.map((p, idx) => (
                                        <SelectItem
                                             key={p.label}
                                             value={idx.toString()}
                                        >
                                             {p.label}
                                             {idx === 0 && " (Current)"}
                                        </SelectItem>
                                   ))}
                              </SelectContent>
                         </Select>

                         {/* Comparison Period Selector */}
                         {showComparison && (
                              <Select
                                   value={
                                        comparisonPeriodIndex?.toString() ??
                                        "none"
                                   }
                                   onValueChange={(val) =>
                                        setComparisonPeriodIndex(
                                             val === "none"
                                                  ? null
                                                  : parseInt(val)
                                        )
                                   }
                              >
                                   <SelectTrigger className="w-[180px]">
                                        {comparisonPeriod
                                             ? `vs ${comparisonPeriod.label}`
                                             : "No comparison"}
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="none">
                                             No comparison
                                        </SelectItem>
                                        {currentPeriods.map((p, idx) => (
                                             <SelectItem
                                                  key={p.label}
                                                  value={idx.toString()}
                                                  disabled={
                                                       idx === selectedPeriodIndex
                                                  }
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
                                   onChange={(e) =>
                                        setShowComparison(e.target.checked)
                                   }
                                   className="rounded"
                              />
                              Compare
                         </label>
                    </div>
               </div>

               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricsCard
                         title="Stage 1 Opportunities"
                         value={selectedPeriod.stage1Opportunities}
                         description={
                              showComparison && comparisonPeriod
                                   ? `vs ${comparisonPeriod.label}: ${formatChange(
                                        changes.stage1Opportunities
                                   )}`
                                   : "Your compensation metric"
                         }
                         className="cursor-pointer hover:shadow-lg transition-shadow"
                         onClick={() => {
                              // TODO: Navigate to detailed Stage 1 view or filter contacts by stage
                         }}
                    />
                    <MetricsCard
                         title="Outreaches"
                         value={selectedPeriod.outreaches}
                         description={
                              showComparison && comparisonPeriod
                                   ? `vs ${comparisonPeriod.label}: ${formatChange(
                                        changes.outreaches
                                   )}`
                                   : selectedPeriod.label
                         }
                         className="cursor-pointer hover:shadow-lg transition-shadow"
                    />
                    <MetricsCard
                         title="Meetings"
                         value={selectedPeriod.meetings}
                         description={
                              showComparison && comparisonPeriod
                                   ? `vs ${comparisonPeriod.label}: ${formatChange(
                                        changes.meetings
                                   )}`
                                   : selectedPeriod.label
                         }
                         className="cursor-pointer hover:shadow-lg transition-shadow"
                    />
                    <MetricsCard
                         title="AE Meetings"
                         value={selectedPeriod.aeMeetings}
                         description={
                              showComparison && comparisonPeriod
                                   ? `vs ${comparisonPeriod.label}: ${formatChange(
                                        changes.aeMeetings
                                   )}`
                                   : selectedPeriod.label
                         }
                         className="cursor-pointer hover:shadow-lg transition-shadow"
                    />
               </div>

               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                         <div className="text-sm text-muted-foreground">
                              Conversion: Outreach → Meeting
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.outreachToMeeting.toFixed(
                                        1
                                   )}
                                   %
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.outreachToMeeting !==
                                        0 && (
                                        <span
                                             className={getChangeColor(
                                                  changes.conversionRates
                                                       .outreachToMeeting
                                             )}
                                        >
                                             {changes.conversionRates
                                                  .outreachToMeeting > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(
                                                  changes.conversionRates
                                                       .outreachToMeeting
                                             )}
                                        </span>
                                   )}
                         </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                         <div className="text-sm text-muted-foreground">
                              Conversion: Meeting → AE Meeting
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.meetingToAEMeeting.toFixed(
                                        1
                                   )}
                                   %
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.meetingToAEMeeting !==
                                        0 && (
                                        <span
                                             className={getChangeColor(
                                                  changes.conversionRates
                                                       .meetingToAEMeeting
                                             )}
                                        >
                                             {changes.conversionRates
                                                  .meetingToAEMeeting > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(
                                                  changes.conversionRates
                                                       .meetingToAEMeeting
                                             )}
                                        </span>
                                   )}
                         </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                         <div className="text-sm text-muted-foreground">
                              Conversion: AE Meeting → Stage 1
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.aeMeetingToStage1.toFixed(
                                        1
                                   )}
                                   %
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.aeMeetingToStage1 !==
                                        0 && (
                                        <span
                                             className={getChangeColor(
                                                  changes.conversionRates
                                                       .aeMeetingToStage1
                                             )}
                                        >
                                             {changes.conversionRates
                                                  .aeMeetingToStage1 > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(
                                                  changes.conversionRates
                                                       .aeMeetingToStage1
                                             )}
                                        </span>
                                   )}
                         </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                         <div className="text-sm text-muted-foreground">
                              Overall: Outreach → Stage 1
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold">
                                   {selectedPeriod.conversionRates.overallOutreachToStage1.toFixed(
                                        1
                                   )}
                                   %
                              </span>
                              {showComparison &&
                                   comparisonPeriod &&
                                   changes.conversionRates.overallOutreachToStage1 !==
                                        0 && (
                                        <span
                                             className={getChangeColor(
                                                  changes.conversionRates
                                                       .overallOutreachToStage1
                                             )}
                                        >
                                             {changes.conversionRates
                                                  .overallOutreachToStage1 > 0 ? (
                                                  <TrendingUp className="h-4 w-4" />
                                             ) : (
                                                  <TrendingDown className="h-4 w-4" />
                                             )}
                                             {formatChange(
                                                  changes.conversionRates
                                                       .overallOutreachToStage1
                                             )}
                                        </span>
                                   )}
                         </div>
                    </div>
               </div>

               <div className="grid gap-4 md:grid-cols-2">
                    <ConversionFunnel
                         outreaches={selectedPeriod.outreaches}
                         meetings={selectedPeriod.meetings}
                         aeMeetings={selectedPeriod.aeMeetings}
                         stage1={selectedPeriod.stage1Opportunities}
                    />
                    <UpcomingFollowUps
                         followUpsWithContacts={followUpsWithContacts}
                    />
               </div>

               <VelocityMetrics
                    avgDaysOutreachToMeeting={
                         selectedPeriod.velocity.avgDaysOutreachToMeeting
                    }
                    avgDaysMeetingToStage1={
                         selectedPeriod.velocity.avgDaysMeetingToStage1
                    }
                    avgDaysOutreachToStage1={
                         selectedPeriod.velocity.avgDaysOutreachToStage1
                    }
               />
          </div>
     );
}

