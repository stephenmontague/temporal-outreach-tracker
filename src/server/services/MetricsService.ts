import {
     getCustomQuarterByOffset,
     getMonthByOffset,
     getYearByOffset,
     toDate
} from "@/lib/utils";
import {
     ContactEventType,
     StageChangedMetadata,
     OutreachCreatedMetadata,
} from "@/models/ContactEvent";
import { FunnelStage } from "@/models/FunnelStage";
import { MeetingType, MeetingOutcome } from "@/models/Meeting";
import { OpportunityStage } from "@/models/Opportunity";
import { OutreachMethod } from "@/models/OutreachMethod";
import { ContactEventRepository } from "@/server/repositories/ContactEventRepository";
import { ContactRepository } from "@/server/repositories/ContactRepository";
import { MeetingRepository } from "@/server/repositories/MeetingRepository";
import { OpportunityRepository } from "@/server/repositories/OpportunityRepository";
import { OutreachRepository } from "@/server/repositories/OutreachRepository";
import {
     endOfDay,
     endOfWeek,
     startOfDay,
     startOfWeek,
     subDays,
} from "date-fns";

export interface ConversionRates {
     outreachToMeeting: number;
     outreachToAEMeeting: number; // Direct path: Outreach → AE Meeting
     meetingToAEMeeting: number;
     aeMeetingToStage1: number;
     overallOutreachToStage1: number;
}

export interface ThroughputMetrics {
     dailyOutreach: number;
     weeklyOutreach: number;
     dailyMeetings: number;
     weeklyMeetings: number;
     monthlyStage1: number;
}

export interface VelocityMetrics {
     avgDaysOutreachToMeeting: number;
     avgDaysMeetingToStage1: number;
     avgDaysOutreachToStage1: number;
}

export interface AllMetrics {
     conversionRates: ConversionRates;
     throughput: ThroughputMetrics;
     velocity: VelocityMetrics;
     totalStage1Opportunities: number;
}

export interface QuarterlyMetrics {
     quarter: string; // e.g., "2024-Q1"
     startDate: Date;
     endDate: Date;
     outreaches: number;
     meetings: number;
     aeMeetings: number;
     stage1Opportunities: number;
     uniqueContacts: number;
     conversionRates: ConversionRates;
     throughput: ThroughputMetrics;
     velocity: VelocityMetrics;
}

export interface QuarterOverQuarterComparison {
     currentQuarter: QuarterlyMetrics;
     previousQuarter: QuarterlyMetrics | null;
     changes: {
          outreaches: number; // percentage change
          meetings: number;
          aeMeetings: number;
          stage1Opportunities: number;
          conversionRates: ConversionRates;
     };
}

export interface MultiQuarterMetrics {
     quarters: QuarterlyMetrics[];
     selectedIndex: number;
     comparisonIndex: number | null;
}

// Base interface for period metrics (shared by monthly, quarterly, yearly)
export interface PeriodMetrics {
     label: string;
     startDate: Date;
     endDate: Date;
     outreaches: number;
     meetings: number;
     aeMeetings: number;
     stage1Opportunities: number;
     uniqueContacts: number;
     conversionRates: ConversionRates;
     velocity: VelocityMetrics;
}

export interface MonthlyMetrics extends PeriodMetrics {
     month: number;
     year: number;
}

export interface YearlyMetrics extends PeriodMetrics {
     year: number;
}

export type TimePeriodType = "monthly" | "quarterly" | "yearly";

export interface MultiPeriodMetrics {
     periodType: TimePeriodType;
     periods: PeriodMetrics[];
     selectedIndex: number;
     comparisonIndex: number | null;
}

// New interfaces for enhanced metrics

export interface MethodEffectiveness {
     method: OutreachMethod;
     count: number;
     responseCount: number;
     responseRate: number;
     meetingCount: number;
     meetingConversionRate: number;
}

export interface OutreachEfficiencyMetrics {
     avgTouchesToMeeting: number;
     avgTouchesToAEMeeting: number;
     avgTouchesToStage1: number;
     responseRate: number;
     methodEffectiveness: MethodEffectiveness[];
}

export interface MeetingOutcomes {
     positive: number;
     negative: number;
     rescheduled: number;
     noShow: number;
     pending: number;
     total: number;
}

export interface MeetingPathMetrics {
     soloMeetingsCount: number;
     directToAECount: number;
     soloToAECount: number;
     soloToAEConversionRate: number;
     totalAEMeetings: number;
     outcomes: MeetingOutcomes;
}

export interface FunnelPathData {
     count: number;
     stage1Count: number;
     conversionRate: number;
     avgDaysToStage1: number;
     avgTouches: number;
}

export interface FunnelPathMetrics {
     standardPath: FunnelPathData; // Outreach → Solo → AE → Stage 1
     directToAEPath: FunnelPathData; // Outreach → AE → Stage 1 (skipped solo)
}

export class MetricsService {
     private outreachRepository: OutreachRepository;
     private meetingRepository: MeetingRepository;
     private opportunityRepository: OpportunityRepository;
     private contactEventRepository: ContactEventRepository;
     private contactRepository: ContactRepository;

     constructor() {
          this.outreachRepository = new OutreachRepository();
          this.meetingRepository = new MeetingRepository();
          this.opportunityRepository = new OpportunityRepository();
          this.contactEventRepository = new ContactEventRepository();
          this.contactRepository = new ContactRepository();
     }

     async getConversionRates(userId: string): Promise<ConversionRates> {
          const outreaches = await this.outreachRepository.findByUserId(userId);
          const meetings = await this.meetingRepository.findByType(
               userId,
               MeetingType.SOLO
          );
          const aeMeetings = await this.meetingRepository.findByType(
               userId,
               MeetingType.WITH_AE
          );
          const stage1Opportunities =
               await this.opportunityRepository.findStage1Opportunities(userId);

          const outreachToMeeting =
               outreaches.length > 0
                    ? (meetings.length / outreaches.length) * 100
                    : 0;

          // Outreach → AE Meeting (direct path, for contacts that went straight to AE)
          const outreachToAEMeeting =
               outreaches.length > 0
                    ? (aeMeetings.length / outreaches.length) * 100
                    : 0;

          const meetingToAEMeeting =
               meetings.length > 0
                    ? (aeMeetings.length / meetings.length) * 100
                    : 0;

          const aeMeetingToStage1 =
               aeMeetings.length > 0
                    ? (stage1Opportunities.length / aeMeetings.length) * 100
                    : 0;

          const overallOutreachToStage1 =
               outreaches.length > 0
                    ? (stage1Opportunities.length / outreaches.length) * 100
                    : 0;

          return {
               outreachToMeeting,
               outreachToAEMeeting,
               meetingToAEMeeting,
               aeMeetingToStage1,
               overallOutreachToStage1,
          };
     }

     async getThroughputMetrics(userId: string): Promise<ThroughputMetrics> {
          const now = new Date();
          const todayStart = startOfDay(now);
          const todayEnd = endOfDay(now);
          const weekStart = startOfWeek(now);
          const weekEnd = endOfWeek(now);
          const monthStart = subDays(now, 30);

          const dailyOutreaches = await this.outreachRepository.findByDateRange(
               userId,
               todayStart,
               todayEnd
          );
          const weeklyOutreaches =
               await this.outreachRepository.findByDateRange(
                    userId,
                    weekStart,
                    weekEnd
               );
          const dailyMeetings = await this.meetingRepository.findUpcoming(
               userId,
               todayStart
          );
          const weeklyMeetings = await this.meetingRepository.findUpcoming(
               userId,
               weekStart
          );
          const monthlyStage1 = await this.opportunityRepository.findByStage(
               userId,
               OpportunityStage.STAGE_1
          );

          // Filter monthly Stage 1 opportunities
          const monthlyStage1Filtered = monthlyStage1.filter(
               (opp) => opp.stage1Date && toDate(opp.stage1Date) >= monthStart
          );

          return {
               dailyOutreach: dailyOutreaches.length,
               weeklyOutreach: weeklyOutreaches.length,
               dailyMeetings: dailyMeetings.length,
               weeklyMeetings: weeklyMeetings.length,
               monthlyStage1: monthlyStage1Filtered.length,
          };
     }

     async getVelocityMetrics(userId: string): Promise<VelocityMetrics> {
          const outreaches = await this.outreachRepository.findByUserId(userId);
          const meetings = await this.meetingRepository.findByUserId(userId);
          const stage1Opportunities =
               await this.opportunityRepository.findStage1Opportunities(userId);

          // Calculate average days from outreach to meeting
          const outreachToMeetingDurations: number[] = [];
          for (const outreach of outreaches) {
               const outreachDate = toDate(outreach.dateTime);
               const meeting = meetings.find(
                    (m) =>
                         m.contactId === outreach.contactId &&
                         toDate(m.scheduledDate) > outreachDate
               );
               if (meeting) {
                    const days = Math.floor(
                         (toDate(meeting.scheduledDate).getTime() -
                              outreachDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    outreachToMeetingDurations.push(days);
               }
          }

          // Calculate average days from meeting to Stage 1
          const meetingToStage1Durations: number[] = [];
          for (const meeting of meetings) {
               const meetingDate = toDate(meeting.scheduledDate);
               const opportunity = stage1Opportunities.find(
                    (opp) =>
                         opp.contactId === meeting.contactId &&
                         opp.stage1Date &&
                         toDate(opp.stage1Date) > meetingDate
               );
               if (opportunity && opportunity.stage1Date) {
                    const days = Math.floor(
                         (toDate(opportunity.stage1Date).getTime() -
                              meetingDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    meetingToStage1Durations.push(days);
               }
          }

          // Calculate average days from outreach to Stage 1
          const outreachToStage1Durations: number[] = [];
          for (const outreach of outreaches) {
               const outreachDate = toDate(outreach.dateTime);
               const opportunity = stage1Opportunities.find(
                    (opp) =>
                         opp.contactId === outreach.contactId &&
                         opp.stage1Date &&
                         toDate(opp.stage1Date) > outreachDate
               );
               if (opportunity && opportunity.stage1Date) {
                    const days = Math.floor(
                         (toDate(opportunity.stage1Date).getTime() -
                              outreachDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    outreachToStage1Durations.push(days);
               }
          }

          const avgDaysOutreachToMeeting =
               outreachToMeetingDurations.length > 0
                    ? outreachToMeetingDurations.reduce((a, b) => a + b, 0) /
                      outreachToMeetingDurations.length
                    : 0;

          const avgDaysMeetingToStage1 =
               meetingToStage1Durations.length > 0
                    ? meetingToStage1Durations.reduce((a, b) => a + b, 0) /
                      meetingToStage1Durations.length
                    : 0;

          const avgDaysOutreachToStage1 =
               outreachToStage1Durations.length > 0
                    ? outreachToStage1Durations.reduce((a, b) => a + b, 0) /
                      outreachToStage1Durations.length
                    : 0;

          return {
               avgDaysOutreachToMeeting,
               avgDaysMeetingToStage1,
               avgDaysOutreachToStage1,
          };
     }

     async getAllMetrics(userId: string): Promise<AllMetrics> {
          const [conversionRates, throughput, velocity, stage1Opportunities] =
               await Promise.all([
                    this.getConversionRates(userId),
                    this.getThroughputMetrics(userId),
                    this.getVelocityMetrics(userId),
                    this.opportunityRepository.findStage1Opportunities(userId),
               ]);

          return {
               conversionRates,
               throughput,
               velocity,
               totalStage1Opportunities: stage1Opportunities.length,
          };
     }

     async getQuarterlyMetrics(
          userId: string,
          quarterOffset: number = 0
     ): Promise<QuarterlyMetrics> {
          const now = new Date();

          // Get custom quarter info with offset
          const quarterInfo = getCustomQuarterByOffset(now, quarterOffset);
          const targetQuarterStart = startOfDay(quarterInfo.startDate);
          const targetQuarterEnd = quarterInfo.endDate; // Already includes endOfDay

          // Query all events for the quarter using ContactEvent as source of truth
          const allEvents =
               await this.contactEventRepository.findByUserIdAndDateRange(
                    userId,
                    targetQuarterStart,
                    targetQuarterEnd
               );

          // Filter events by type
          // Outreaches: OUTREACH_CREATED events
          const quarterOutreachEvents = allEvents.filter(
               (e) => e.eventType === ContactEventType.OUTREACH_CREATED
          );

          // Meetings: STAGE_CHANGED events where toStage is MEETING_BOOKED
          const quarterMeetingEvents = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage ===
                         FunnelStage.MEETING_BOOKED
          );

          // AE Meetings: STAGE_CHANGED events where toStage is AE_MEETING
          const quarterAEMeetingEvents = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage ===
                         FunnelStage.AE_MEETING
          );

          // Stage 1 Opportunities: STAGE_CHANGED events where toStage is STAGE_1
          const quarterStage1Events = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage ===
                         FunnelStage.STAGE_1
          );

          // Calculate unique contacts from outreach events
          const uniqueContactIds = new Set(quarterOutreachEvents.map(e => e.contactId));
          const uniqueContacts = uniqueContactIds.size;

          // Calculate conversion rates for this quarter
          const outreachToMeeting =
               quarterOutreachEvents.length > 0
                    ? (quarterMeetingEvents.length /
                           quarterOutreachEvents.length) *
                      100
                    : 0;

          // Outreach → AE Meeting (direct path)
          const outreachToAEMeeting =
               quarterOutreachEvents.length > 0
                    ? (quarterAEMeetingEvents.length /
                           quarterOutreachEvents.length) *
                      100
                    : 0;

          const meetingToAEMeeting =
               quarterMeetingEvents.length > 0
                    ? (quarterAEMeetingEvents.length /
                           quarterMeetingEvents.length) *
                      100
                    : 0;

          const aeMeetingToStage1 =
               quarterAEMeetingEvents.length > 0
                    ? (quarterStage1Events.length /
                           quarterAEMeetingEvents.length) *
                      100
                    : 0;

          const overallOutreachToStage1 =
               quarterOutreachEvents.length > 0
                    ? (quarterStage1Events.length /
                           quarterOutreachEvents.length) *
                      100
                    : 0;

          // Calculate velocity for this quarter using event occurredAt dates
          const outreachToMeetingDurations: number[] = [];
          for (const outreachEvent of quarterOutreachEvents) {
               const outreachDate = outreachEvent.occurredAt;
               const meetingEvent = quarterMeetingEvents.find(
                    (m) =>
                         m.contactId === outreachEvent.contactId &&
                         m.occurredAt > outreachDate
               );
               if (meetingEvent) {
                    const days = Math.floor(
                         (meetingEvent.occurredAt.getTime() -
                              outreachDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    outreachToMeetingDurations.push(days);
               }
          }

          const meetingToStage1Durations: number[] = [];
          for (const meetingEvent of quarterMeetingEvents) {
               const meetingDate = meetingEvent.occurredAt;
               const stage1Event = quarterStage1Events.find(
                    (e) =>
                         e.contactId === meetingEvent.contactId &&
                         e.occurredAt > meetingDate
               );
               if (stage1Event) {
                    const days = Math.floor(
                         (stage1Event.occurredAt.getTime() -
                              meetingDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    meetingToStage1Durations.push(days);
               }
          }

          const outreachToStage1Durations: number[] = [];
          for (const outreachEvent of quarterOutreachEvents) {
               const outreachDate = outreachEvent.occurredAt;
               const stage1Event = quarterStage1Events.find(
                    (e) =>
                         e.contactId === outreachEvent.contactId &&
                         e.occurredAt > outreachDate
               );
               if (stage1Event) {
                    const days = Math.floor(
                         (stage1Event.occurredAt.getTime() -
                              outreachDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    outreachToStage1Durations.push(days);
               }
          }

          return {
               quarter: quarterInfo.label,
               startDate: targetQuarterStart,
               endDate: targetQuarterEnd,
               outreaches: quarterOutreachEvents.length,
               meetings: quarterMeetingEvents.length,
               aeMeetings: quarterAEMeetingEvents.length,
               stage1Opportunities: quarterStage1Events.length,
               uniqueContacts,
               conversionRates: {
                    outreachToMeeting,
                    outreachToAEMeeting,
                    meetingToAEMeeting,
                    aeMeetingToStage1,
                    overallOutreachToStage1,
               },
               throughput: {
                    dailyOutreach: 0, // Not applicable for quarterly
                    weeklyOutreach: 0,
                    dailyMeetings: 0,
                    weeklyMeetings: 0,
                    monthlyStage1: quarterStage1Events.length,
               },
               velocity: {
                    avgDaysOutreachToMeeting:
                         outreachToMeetingDurations.length > 0
                              ? outreachToMeetingDurations.reduce(
                                     (a, b) => a + b,
                                     0
                                ) / outreachToMeetingDurations.length
                              : 0,
                    avgDaysMeetingToStage1:
                         meetingToStage1Durations.length > 0
                              ? meetingToStage1Durations.reduce(
                                     (a, b) => a + b,
                                     0
                                ) / meetingToStage1Durations.length
                              : 0,
                    avgDaysOutreachToStage1:
                         outreachToStage1Durations.length > 0
                              ? outreachToStage1Durations.reduce(
                                     (a, b) => a + b,
                                     0
                                ) / outreachToStage1Durations.length
                              : 0,
               },
          };
     }

     async getQuarterOverQuarterComparison(
          userId: string
     ): Promise<QuarterOverQuarterComparison> {
          const currentQuarter = await this.getQuarterlyMetrics(userId, 0);
          const previousQuarter = await this.getQuarterlyMetrics(userId, -1);

          const calculateChange = (
               current: number,
               previous: number
          ): number => {
               if (previous === 0) return current > 0 ? 100 : 0;
               return ((current - previous) / previous) * 100;
          };

          return {
               currentQuarter,
               previousQuarter,
               changes: {
                    outreaches: calculateChange(
                         currentQuarter.outreaches,
                         previousQuarter.outreaches
                    ),
                    meetings: calculateChange(
                         currentQuarter.meetings,
                         previousQuarter.meetings
                    ),
                    aeMeetings: calculateChange(
                         currentQuarter.aeMeetings,
                         previousQuarter.aeMeetings
                    ),
                    stage1Opportunities: calculateChange(
                         currentQuarter.stage1Opportunities,
                         previousQuarter.stage1Opportunities
                    ),
                    conversionRates: {
                         outreachToMeeting: calculateChange(
                              currentQuarter.conversionRates.outreachToMeeting,
                              previousQuarter.conversionRates.outreachToMeeting
                         ),
                         outreachToAEMeeting: calculateChange(
                              currentQuarter.conversionRates.outreachToAEMeeting,
                              previousQuarter.conversionRates.outreachToAEMeeting
                         ),
                         meetingToAEMeeting: calculateChange(
                              currentQuarter.conversionRates.meetingToAEMeeting,
                              previousQuarter.conversionRates.meetingToAEMeeting
                         ),
                         aeMeetingToStage1: calculateChange(
                              currentQuarter.conversionRates.aeMeetingToStage1,
                              previousQuarter.conversionRates.aeMeetingToStage1
                         ),
                         overallOutreachToStage1: calculateChange(
                              currentQuarter.conversionRates
                                   .overallOutreachToStage1,
                              previousQuarter.conversionRates
                                   .overallOutreachToStage1
                         ),
                    },
               },
          };
     }

     /**
      * Get metrics for the last N quarters (default 6)
      */
     async getMultiQuarterMetrics(
          userId: string,
          numQuarters: number = 6
     ): Promise<MultiQuarterMetrics> {
          const quarterPromises: Promise<QuarterlyMetrics>[] = [];

          // Fetch quarters from current (0) to numQuarters-1 quarters ago
          for (let i = 0; i < numQuarters; i++) {
               quarterPromises.push(this.getQuarterlyMetrics(userId, -i));
          }

          const quarters = await Promise.all(quarterPromises);

          return {
               quarters,
               selectedIndex: 0, // Default to current quarter
               comparisonIndex: 1, // Default to previous quarter for comparison
          };
     }

     /**
      * Helper method to calculate metrics for a given date range.
      * Used by monthly, quarterly, and yearly metrics methods.
      */
     private async calculatePeriodMetrics(
          userId: string,
          startDate: Date,
          endDate: Date
     ): Promise<{
          outreaches: number;
          meetings: number;
          aeMeetings: number;
          stage1Opportunities: number;
          uniqueContacts: number;
          conversionRates: ConversionRates;
          velocity: VelocityMetrics;
     }> {
          const allEvents =
               await this.contactEventRepository.findByUserIdAndDateRange(
                    userId,
                    startDate,
                    endDate
               );

          // Filter events by type
          const outreachEvents = allEvents.filter(
               (e) => e.eventType === ContactEventType.OUTREACH_CREATED
          );

          const meetingEvents = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage ===
                         FunnelStage.MEETING_BOOKED
          );

          const aeMeetingEvents = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage ===
                         FunnelStage.AE_MEETING
          );

          const stage1Events = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage ===
                         FunnelStage.STAGE_1
          );

          // Calculate unique contacts from outreach events
          const uniqueContactIds = new Set(outreachEvents.map(e => e.contactId));
          const uniqueContacts = uniqueContactIds.size;

          // Calculate conversion rates
          const outreachToMeeting =
               outreachEvents.length > 0
                    ? (meetingEvents.length / outreachEvents.length) * 100
                    : 0;

          // Outreach → AE Meeting (direct path)
          const outreachToAEMeeting =
               outreachEvents.length > 0
                    ? (aeMeetingEvents.length / outreachEvents.length) * 100
                    : 0;

          const meetingToAEMeeting =
               meetingEvents.length > 0
                    ? (aeMeetingEvents.length / meetingEvents.length) * 100
                    : 0;

          const aeMeetingToStage1 =
               aeMeetingEvents.length > 0
                    ? (stage1Events.length / aeMeetingEvents.length) * 100
                    : 0;

          const overallOutreachToStage1 =
               outreachEvents.length > 0
                    ? (stage1Events.length / outreachEvents.length) * 100
                    : 0;

          // Calculate velocity
          const outreachToMeetingDurations: number[] = [];
          for (const outreachEvent of outreachEvents) {
               const outreachDate = outreachEvent.occurredAt;
               const meetingEvent = meetingEvents.find(
                    (m) =>
                         m.contactId === outreachEvent.contactId &&
                         m.occurredAt > outreachDate
               );
               if (meetingEvent) {
                    const days = Math.floor(
                         (meetingEvent.occurredAt.getTime() -
                              outreachDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    outreachToMeetingDurations.push(days);
               }
          }

          const meetingToStage1Durations: number[] = [];
          for (const meetingEvent of meetingEvents) {
               const meetingDate = meetingEvent.occurredAt;
               const stage1Event = stage1Events.find(
                    (e) =>
                         e.contactId === meetingEvent.contactId &&
                         e.occurredAt > meetingDate
               );
               if (stage1Event) {
                    const days = Math.floor(
                         (stage1Event.occurredAt.getTime() -
                              meetingDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    meetingToStage1Durations.push(days);
               }
          }

          const outreachToStage1Durations: number[] = [];
          for (const outreachEvent of outreachEvents) {
               const outreachDate = outreachEvent.occurredAt;
               const stage1Event = stage1Events.find(
                    (e) =>
                         e.contactId === outreachEvent.contactId &&
                         e.occurredAt > outreachDate
               );
               if (stage1Event) {
                    const days = Math.floor(
                         (stage1Event.occurredAt.getTime() -
                              outreachDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
                    outreachToStage1Durations.push(days);
               }
          }

          return {
               outreaches: outreachEvents.length,
               meetings: meetingEvents.length,
               aeMeetings: aeMeetingEvents.length,
               stage1Opportunities: stage1Events.length,
               uniqueContacts,
               conversionRates: {
                    outreachToMeeting,
                    outreachToAEMeeting,
                    meetingToAEMeeting,
                    aeMeetingToStage1,
                    overallOutreachToStage1,
               },
               velocity: {
                    avgDaysOutreachToMeeting:
                         outreachToMeetingDurations.length > 0
                              ? outreachToMeetingDurations.reduce(
                                   (a, b) => a + b,
                                   0
                                 ) / outreachToMeetingDurations.length
                              : 0,
                    avgDaysMeetingToStage1:
                         meetingToStage1Durations.length > 0
                              ? meetingToStage1Durations.reduce(
                                   (a, b) => a + b,
                                   0
                                 ) / meetingToStage1Durations.length
                              : 0,
                    avgDaysOutreachToStage1:
                         outreachToStage1Durations.length > 0
                              ? outreachToStage1Durations.reduce(
                                   (a, b) => a + b,
                                   0
                                 ) / outreachToStage1Durations.length
                              : 0,
               },
          };
     }

     /**
      * Get metrics for a specific month.
      * @param userId The user ID
      * @param monthOffset 0 = current month, -1 = previous month, etc.
      */
     async getMonthlyMetrics(
          userId: string,
          monthOffset: number = 0
     ): Promise<MonthlyMetrics> {
          const now = new Date();
          const monthInfo = getMonthByOffset(now, monthOffset);

          const metrics = await this.calculatePeriodMetrics(
               userId,
               monthInfo.startDate,
               monthInfo.endDate
          );

          return {
               month: monthInfo.month,
               year: monthInfo.year,
               label: monthInfo.label,
               startDate: monthInfo.startDate,
               endDate: monthInfo.endDate,
               ...metrics,
          };
     }

     /**
      * Get metrics for the last N months (default 12)
      */
     async getMultiMonthMetrics(
          userId: string,
          numMonths: number = 12
     ): Promise<MultiPeriodMetrics> {
          const monthPromises: Promise<MonthlyMetrics>[] = [];

          for (let i = 0; i < numMonths; i++) {
               monthPromises.push(this.getMonthlyMetrics(userId, -i));
          }

          const periods = await Promise.all(monthPromises);

          return {
               periodType: "monthly",
               periods,
               selectedIndex: 0,
               comparisonIndex: 1,
          };
     }

     /**
      * Get metrics for a specific year.
      * @param userId The user ID
      * @param yearOffset 0 = current year, -1 = previous year, etc.
      */
     async getYearlyMetrics(
          userId: string,
          yearOffset: number = 0
     ): Promise<YearlyMetrics> {
          const now = new Date();
          const yearInfo = getYearByOffset(now, yearOffset);

          const metrics = await this.calculatePeriodMetrics(
               userId,
               yearInfo.startDate,
               yearInfo.endDate
          );

          return {
               year: yearInfo.year,
               label: yearInfo.label,
               startDate: yearInfo.startDate,
               endDate: yearInfo.endDate,
               ...metrics,
          };
     }

     /**
      * Get metrics for the last N years (default 3)
      */
     async getMultiYearMetrics(
          userId: string,
          numYears: number = 3
     ): Promise<MultiPeriodMetrics> {
          const yearPromises: Promise<YearlyMetrics>[] = [];

          for (let i = 0; i < numYears; i++) {
               yearPromises.push(this.getYearlyMetrics(userId, -i));
          }

          const periods = await Promise.all(yearPromises);

          return {
               periodType: "yearly",
               periods,
               selectedIndex: 0,
               comparisonIndex: 1,
          };
     }

     /**
      * Get outreach efficiency metrics
      * - Average touches to meeting, AE meeting, and Stage 1
      * - Response rate
      * - Method effectiveness breakdown
      */
     async getOutreachEfficiencyMetrics(
          userId: string
     ): Promise<OutreachEfficiencyMetrics> {
          const outreaches = await this.outreachRepository.findByUserId(userId);
          const contacts = await this.contactRepository.findByUserId(userId);

          // Group outreaches by contact
          const outreachesByContact = new Map<string, typeof outreaches>();
          for (const outreach of outreaches) {
               const existing = outreachesByContact.get(outreach.contactId) || [];
               existing.push(outreach);
               outreachesByContact.set(outreach.contactId, existing);
          }

          // Calculate touches to meeting for contacts that reached MEETING_BOOKED
          const touchesToMeeting: number[] = [];
          const touchesToAEMeeting: number[] = [];
          const touchesToStage1: number[] = [];

          for (const contact of contacts) {
               const contactOutreaches = outreachesByContact.get(contact.id) || [];
               if (contactOutreaches.length === 0) continue;

               const stage = contact.currentFunnelStage;

               // Count touches for contacts that reached meeting stage or beyond
               if (
                    stage === FunnelStage.MEETING_BOOKED ||
                    stage === FunnelStage.AE_MEETING ||
                    stage === FunnelStage.OPPORTUNITY_CREATED ||
                    stage === FunnelStage.STAGE_1
               ) {
                    touchesToMeeting.push(contactOutreaches.length);
               }

               // Count touches for contacts that reached AE meeting or beyond
               if (
                    stage === FunnelStage.AE_MEETING ||
                    stage === FunnelStage.OPPORTUNITY_CREATED ||
                    stage === FunnelStage.STAGE_1
               ) {
                    touchesToAEMeeting.push(contactOutreaches.length);
               }

               // Count touches for contacts that reached Stage 1
               if (stage === FunnelStage.STAGE_1) {
                    touchesToStage1.push(contactOutreaches.length);
               }
          }

          // Calculate averages
          const avgTouchesToMeeting =
               touchesToMeeting.length > 0
                    ? touchesToMeeting.reduce((a, b) => a + b, 0) / touchesToMeeting.length
                    : 0;

          const avgTouchesToAEMeeting =
               touchesToAEMeeting.length > 0
                    ? touchesToAEMeeting.reduce((a, b) => a + b, 0) / touchesToAEMeeting.length
                    : 0;

          const avgTouchesToStage1 =
               touchesToStage1.length > 0
                    ? touchesToStage1.reduce((a, b) => a + b, 0) / touchesToStage1.length
                    : 0;

          // Calculate response rate
          const responsesReceived = outreaches.filter((o) => o.responseReceived).length;
          const responseRate =
               outreaches.length > 0 ? (responsesReceived / outreaches.length) * 100 : 0;

          // Calculate method effectiveness
          const methodStats = new Map<
               OutreachMethod,
               { count: number; responses: number; meetings: number }
          >();

          // Initialize all methods
          for (const method of Object.values(OutreachMethod)) {
               methodStats.set(method, { count: 0, responses: 0, meetings: 0 });
          }

          // Count outreaches by method
          for (const outreach of outreaches) {
               const stats = methodStats.get(outreach.method)!;
               stats.count++;
               if (outreach.responseReceived) {
                    stats.responses++;
               }
          }

          // Count meetings per method (based on contacts that reached meeting stage)
          for (const contact of contacts) {
               const contactOutreaches = outreachesByContact.get(contact.id) || [];
               const stage = contact.currentFunnelStage;

               if (
                    stage === FunnelStage.MEETING_BOOKED ||
                    stage === FunnelStage.AE_MEETING ||
                    stage === FunnelStage.OPPORTUNITY_CREATED ||
                    stage === FunnelStage.STAGE_1
               ) {
                    // Attribute meeting to the first outreach method used
                    if (contactOutreaches.length > 0) {
                         const firstMethod = contactOutreaches[0].method;
                         const stats = methodStats.get(firstMethod)!;
                         stats.meetings++;
                    }
               }
          }

          const methodEffectiveness: MethodEffectiveness[] = [];
          for (const [method, stats] of methodStats) {
               if (stats.count > 0) {
                    methodEffectiveness.push({
                         method,
                         count: stats.count,
                         responseCount: stats.responses,
                         responseRate: (stats.responses / stats.count) * 100,
                         meetingCount: stats.meetings,
                         meetingConversionRate: (stats.meetings / stats.count) * 100,
                    });
               }
          }

          // Sort by count descending
          methodEffectiveness.sort((a, b) => b.count - a.count);

          return {
               avgTouchesToMeeting,
               avgTouchesToAEMeeting,
               avgTouchesToStage1,
               responseRate,
               methodEffectiveness,
          };
     }

     /**
      * Get meeting path metrics
      * - Solo meetings count
      * - Direct to AE count (skipped solo)
      * - Solo to AE conversion rate
      * - Meeting outcomes breakdown
      * 
      * Uses ContactEvents as source of truth to capture all stage transitions,
      * regardless of whether a Meeting entity was created.
      */
     async getMeetingPathMetrics(userId: string): Promise<MeetingPathMetrics> {
          // Use ContactEvents as source of truth instead of meetings table
          const allEvents = await this.contactEventRepository.findByUserIdAndDateRange(
               userId,
               new Date(0), // All time
               new Date()
          );
          
          const meetings = await this.meetingRepository.findByUserId(userId);

          // Get stage change events for MEETING_BOOKED and AE_MEETING
          const meetingBookedEvents = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage === FunnelStage.MEETING_BOOKED
          );
          
          const aeMeetingEvents = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage === FunnelStage.AE_MEETING
          );

          // Group by contact to determine paths
          const contactPaths = new Map<string, { hadSolo: boolean; hadAE: boolean }>();
          
          for (const event of meetingBookedEvents) {
               const path = contactPaths.get(event.contactId) || { hadSolo: false, hadAE: false };
               path.hadSolo = true;
               contactPaths.set(event.contactId, path);
          }
          
          for (const event of aeMeetingEvents) {
               const path = contactPaths.get(event.contactId) || { hadSolo: false, hadAE: false };
               path.hadAE = true;
               contactPaths.set(event.contactId, path);
          }

          let soloMeetingsCount = 0;
          let directToAECount = 0;
          let soloToAECount = 0;

          for (const [, path] of contactPaths) {
               if (path.hadSolo) {
                    soloMeetingsCount++;
                    if (path.hadAE) {
                         soloToAECount++;
                    }
               } else if (path.hadAE) {
                    // Has AE but never had solo = direct to AE
                    directToAECount++;
               }
          }

          const soloToAEConversionRate =
               soloMeetingsCount > 0
                    ? (soloToAECount / soloMeetingsCount) * 100
                    : 0;

          const totalAEMeetings = soloToAECount + directToAECount;

          // Calculate meeting outcomes from meetings table (for meetings that have records)
          const outcomes: MeetingOutcomes = {
               positive: 0,
               negative: 0,
               rescheduled: 0,
               noShow: 0,
               pending: 0,
               total: meetings.length,
          };

          for (const meeting of meetings) {
               switch (meeting.outcome) {
                    case MeetingOutcome.POSITIVE:
                         outcomes.positive++;
                         break;
                    case MeetingOutcome.NEGATIVE:
                         outcomes.negative++;
                         break;
                    case MeetingOutcome.RESCHEDULED:
                         outcomes.rescheduled++;
                         break;
                    case MeetingOutcome.NO_SHOW:
                         outcomes.noShow++;
                         break;
                    default:
                         outcomes.pending++;
               }
          }

          return {
               soloMeetingsCount,
               directToAECount,
               soloToAECount,
               soloToAEConversionRate,
               totalAEMeetings,
               outcomes,
          };
     }

     /**
      * Get funnel path metrics
      * - Standard path: Outreach → Solo Meeting → AE Meeting → Stage 1
      * - Direct-to-AE path: Outreach → AE Meeting → Stage 1 (skipped solo)
      * 
      * Uses ContactEvents as source of truth to capture all stage transitions.
      */
     async getFunnelPathMetrics(userId: string): Promise<FunnelPathMetrics> {
          const contacts = await this.contactRepository.findByUserId(userId);
          const outreaches = await this.outreachRepository.findByUserId(userId);
          const stage1Opportunities =
               await this.opportunityRepository.findStage1Opportunities(userId);

          // Use ContactEvents as source of truth for stage transitions
          const allEvents = await this.contactEventRepository.findByUserIdAndDateRange(
               userId,
               new Date(0), // All time
               new Date()
          );

          // Get stage change events
          const meetingBookedEvents = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage === FunnelStage.MEETING_BOOKED
          );
          
          const aeMeetingEvents = allEvents.filter(
               (e) =>
                    e.eventType === ContactEventType.STAGE_CHANGED &&
                    (e.metadata as StageChangedMetadata)?.toStage === FunnelStage.AE_MEETING
          );

          // Build sets of contacts that reached each stage
          const contactsWithSoloMeeting = new Set(meetingBookedEvents.map(e => e.contactId));
          const contactsWithAEMeeting = new Set(aeMeetingEvents.map(e => e.contactId));

          // Group outreaches by contact
          const outreachesByContact = new Map<string, typeof outreaches>();
          for (const outreach of outreaches) {
               const existing = outreachesByContact.get(outreach.contactId) || [];
               existing.push(outreach);
               outreachesByContact.set(outreach.contactId, existing);
          }

          // Map Stage 1 opportunities by contact
          const stage1ByContact = new Map<string, (typeof stage1Opportunities)[0]>();
          for (const opp of stage1Opportunities) {
               stage1ByContact.set(opp.contactId, opp);
          }

          // Standard path stats
          const standardPathContacts: {
               contactId: string;
               daysToStage1: number | null;
               touches: number;
               reachedStage1: boolean;
          }[] = [];

          // Direct-to-AE path stats
          const directToAEContacts: {
               contactId: string;
               daysToStage1: number | null;
               touches: number;
               reachedStage1: boolean;
          }[] = [];

          for (const contact of contacts) {
               const contactOutreaches = outreachesByContact.get(contact.id) || [];
               const stage1Opp = stage1ByContact.get(contact.id);

               const hasSoloMeeting = contactsWithSoloMeeting.has(contact.id);
               const hasAEMeeting = contactsWithAEMeeting.has(contact.id);

               // Must have AE meeting to be on either path (AE is required for Stage 1)
               if (!hasAEMeeting) continue;

               const touches = contactOutreaches.length;
               const reachedStage1 = !!stage1Opp;

               // Calculate days to Stage 1 from first outreach
               let daysToStage1: number | null = null;
               if (stage1Opp && stage1Opp.stage1Date && contactOutreaches.length > 0) {
                    const firstOutreach = contactOutreaches.reduce((earliest, o) =>
                         toDate(o.dateTime) < toDate(earliest.dateTime) ? o : earliest
                    );
                    daysToStage1 = Math.floor(
                         (toDate(stage1Opp.stage1Date).getTime() -
                              toDate(firstOutreach.dateTime).getTime()) /
                              (1000 * 60 * 60 * 24)
                    );
               }

               if (hasSoloMeeting) {
                    // Standard path: had solo meeting before AE
                    standardPathContacts.push({
                         contactId: contact.id,
                         daysToStage1,
                         touches,
                         reachedStage1,
                    });
               } else {
                    // Direct-to-AE path: went straight to AE
                    directToAEContacts.push({
                         contactId: contact.id,
                         daysToStage1,
                         touches,
                         reachedStage1,
                    });
               }
          }

          // Calculate standard path metrics
          const standardStage1 = standardPathContacts.filter((c) => c.reachedStage1);
          const standardDays = standardStage1
               .filter((c) => c.daysToStage1 !== null)
               .map((c) => c.daysToStage1!);
          const standardTouches = standardStage1.map((c) => c.touches);

          const standardPath: FunnelPathData = {
               count: standardPathContacts.length,
               stage1Count: standardStage1.length,
               conversionRate:
                    standardPathContacts.length > 0
                         ? (standardStage1.length / standardPathContacts.length) * 100
                         : 0,
               avgDaysToStage1:
                    standardDays.length > 0
                         ? standardDays.reduce((a, b) => a + b, 0) / standardDays.length
                         : 0,
               avgTouches:
                    standardTouches.length > 0
                         ? standardTouches.reduce((a, b) => a + b, 0) / standardTouches.length
                         : 0,
          };

          // Calculate direct-to-AE path metrics
          const directStage1 = directToAEContacts.filter((c) => c.reachedStage1);
          const directDays = directStage1
               .filter((c) => c.daysToStage1 !== null)
               .map((c) => c.daysToStage1!);
          const directTouches = directStage1.map((c) => c.touches);

          const directToAEPath: FunnelPathData = {
               count: directToAEContacts.length,
               stage1Count: directStage1.length,
               conversionRate:
                    directToAEContacts.length > 0
                         ? (directStage1.length / directToAEContacts.length) * 100
                         : 0,
               avgDaysToStage1:
                    directDays.length > 0
                         ? directDays.reduce((a, b) => a + b, 0) / directDays.length
                         : 0,
               avgTouches:
                    directTouches.length > 0
                         ? directTouches.reduce((a, b) => a + b, 0) / directTouches.length
                         : 0,
          };

          return {
               standardPath,
               directToAEPath,
          };
     }
}
