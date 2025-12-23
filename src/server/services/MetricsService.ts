import {
     getCustomQuarterByOffset,
     getMonthByOffset,
     getYearByOffset,
     toDate
} from "@/lib/utils";
import {
     ContactEventType,
     StageChangedMetadata,
} from "@/models/ContactEvent";
import { FunnelStage } from "@/models/FunnelStage";
import { MeetingType } from "@/models/Meeting";
import { OpportunityStage } from "@/models/Opportunity";
import { ContactEventRepository } from "@/server/repositories/ContactEventRepository";
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

export class MetricsService {
     private outreachRepository: OutreachRepository;
     private meetingRepository: MeetingRepository;
     private opportunityRepository: OpportunityRepository;
     private contactEventRepository: ContactEventRepository;

     constructor() {
          this.outreachRepository = new OutreachRepository();
          this.meetingRepository = new MeetingRepository();
          this.opportunityRepository = new OpportunityRepository();
          this.contactEventRepository = new ContactEventRepository();
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

          // Calculate conversion rates for this quarter
          const outreachToMeeting =
               quarterOutreachEvents.length > 0
                    ? (quarterMeetingEvents.length /
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
               conversionRates: {
                    outreachToMeeting,
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

          // Calculate conversion rates
          const outreachToMeeting =
               outreachEvents.length > 0
                    ? (meetingEvents.length / outreachEvents.length) * 100
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
               conversionRates: {
                    outreachToMeeting,
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
}
