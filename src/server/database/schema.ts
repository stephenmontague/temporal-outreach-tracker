import {
     pgTable,
     uuid,
     varchar,
     text,
     boolean,
     timestamp,
     integer,
     real,
     pgEnum,
     jsonb,
} from "drizzle-orm/pg-core";
import { FunnelStage } from "@/models/FunnelStage";
import { OutreachMethod } from "@/models/OutreachMethod";
import { MeetingType, MeetingOutcome } from "@/models/Meeting";
import { OpportunityStage } from "@/models/Opportunity";

// Enums
export const funnelStageEnum = pgEnum("funnel_stage", [
     FunnelStage.OUTREACH,
     FunnelStage.MEETING_BOOKED,
     FunnelStage.AE_MEETING,
     FunnelStage.OPPORTUNITY_CREATED,
     FunnelStage.STAGE_1,
     FunnelStage.LOST,
     FunnelStage.INACTIVE,
]);

export const outreachMethodEnum = pgEnum("outreach_method", [
     OutreachMethod.EMAIL,
     OutreachMethod.SLACK,
     OutreachMethod.PHONE,
     OutreachMethod.LINKEDIN,
     OutreachMethod.OTHER,
]);

export const meetingTypeEnum = pgEnum("meeting_type", [
     MeetingType.SOLO,
     MeetingType.WITH_AE,
]);

export const meetingOutcomeEnum = pgEnum("meeting_outcome", [
     MeetingOutcome.POSITIVE,
     MeetingOutcome.NEGATIVE,
     MeetingOutcome.RESCHEDULED,
     MeetingOutcome.NO_SHOW,
]);

export const opportunityStageEnum = pgEnum("opportunity_stage", [
     OpportunityStage.CREATED,
     OpportunityStage.STAGE_1,
]);

export const contactEventTypeEnum = pgEnum("contact_event_type", [
     "OUTREACH_CREATED",
     "OUTREACH_RESPONSE_RECEIVED",
     "STAGE_CHANGED",
     "MEETING_CREATED",
     "MEETING_COMPLETED",
     "OPPORTUNITY_CREATED",
     "OPPORTUNITY_STAGE_CHANGED",
     "FOLLOW_UP_SCHEDULED",
     "FOLLOW_UP_COMPLETED",
     "NOTE_ADDED",
     "CONTACT_UPDATED",
]);

// Tables
export const contacts = pgTable("contacts", {
     id: uuid("id").defaultRandom().primaryKey(),
     userId: varchar("user_id", { length: 255 }).notNull(),
     firstName: varchar("first_name", { length: 255 }).notNull(),
     lastName: varchar("last_name", { length: 255 }),
     company: varchar("company", { length: 255 }),
     email: varchar("email", { length: 255 }),
     slackUsername: varchar("slack_username", { length: 255 }),
     phoneNumber: varchar("phone_number", { length: 50 }),
     linkedinUrl: text("linkedin_url"),
     notes: text("notes"),
     currentFunnelStage: funnelStageEnum("current_funnel_stage")
          .notNull()
          .default(FunnelStage.OUTREACH),
     isInSalesforceCadence: boolean("is_in_salesforce_cadence")
          .notNull()
          .default(false),
     originalOutreachDateTime: timestamp("original_outreach_date_time"),
     createdAt: timestamp("created_at").notNull().defaultNow(),
     updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const outreaches = pgTable("outreaches", {
     id: uuid("id").defaultRandom().primaryKey(),
     contactId: uuid("contact_id")
          .notNull()
          .references(() => contacts.id, { onDelete: "cascade" }),
     userId: varchar("user_id", { length: 255 }).notNull(),
     method: outreachMethodEnum("method").notNull(),
     dateTime: timestamp("date_time").notNull(),
     subject: varchar("subject", { length: 500 }),
     messagePreview: text("message_preview"),
     notes: text("notes"),
     responseReceived: boolean("response_received").notNull().default(false),
     responseDate: timestamp("response_date"),
     workflowId: varchar("workflow_id", { length: 255 }),
     createdAt: timestamp("created_at").notNull().defaultNow(),
     updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const followUps = pgTable("follow_ups", {
     id: uuid("id").defaultRandom().primaryKey(),
     outreachId: uuid("outreach_id")
          .notNull()
          .references(() => outreaches.id, { onDelete: "cascade" }),
     contactId: uuid("contact_id")
          .notNull()
          .references(() => contacts.id, { onDelete: "cascade" }),
     scheduledDate: timestamp("scheduled_date").notNull(),
     method: outreachMethodEnum("method").notNull(),
     notes: text("notes"),
     completed: boolean("completed").notNull().default(false),
     completedDate: timestamp("completed_date"),
     isSalesforceManaged: boolean("is_salesforce_managed")
          .notNull()
          .default(false),
     workflowTimerId: varchar("workflow_timer_id", { length: 255 }),
     reminderSent: boolean("reminder_sent").notNull().default(false),
     createdAt: timestamp("created_at").notNull().defaultNow(),
     updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const meetings = pgTable("meetings", {
     id: uuid("id").defaultRandom().primaryKey(),
     contactId: uuid("contact_id")
          .notNull()
          .references(() => contacts.id, { onDelete: "cascade" }),
     userId: varchar("user_id", { length: 255 }).notNull(),
     scheduledDate: timestamp("scheduled_date").notNull(),
     meetingType: meetingTypeEnum("meeting_type").notNull(),
     duration: integer("duration"), // in minutes
     location: text("location"),
     notes: text("notes"),
     outcome: meetingOutcomeEnum("outcome"),
     createdAt: timestamp("created_at").notNull().defaultNow(),
     updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const opportunities = pgTable("opportunities", {
     id: uuid("id").defaultRandom().primaryKey(),
     contactId: uuid("contact_id")
          .notNull()
          .references(() => contacts.id, { onDelete: "cascade" }),
     userId: varchar("user_id", { length: 255 }).notNull(),
     salesforceOpportunityId: varchar("salesforce_opportunity_id", {
          length: 255,
     }),
     stage: opportunityStageEnum("stage")
          .notNull()
          .default(OpportunityStage.CREATED),
     stage1Date: timestamp("stage_1_date"),
     value: real("value"),
     probability: integer("probability"), // 0-100
     notes: text("notes"),
     createdAt: timestamp("created_at").notNull().defaultNow(),
     updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contactEvents = pgTable("contact_events", {
     id: uuid("id").defaultRandom().primaryKey(),
     contactId: uuid("contact_id")
          .notNull()
          .references(() => contacts.id, { onDelete: "cascade" }),
     userId: varchar("user_id", { length: 255 }).notNull(),
     eventType: contactEventTypeEnum("event_type").notNull(),
     metadata: jsonb("metadata"),
     outreachId: uuid("outreach_id").references(() => outreaches.id, {
          onDelete: "set null",
     }),
     meetingId: uuid("meeting_id").references(() => meetings.id, {
          onDelete: "set null",
     }),
     opportunityId: uuid("opportunity_id").references(() => opportunities.id, {
          onDelete: "set null",
     }),
     followUpId: uuid("follow_up_id").references(() => followUps.id, {
          onDelete: "set null",
     }),
     workflowId: varchar("workflow_id", { length: 255 }),
     occurredAt: timestamp("occurred_at").notNull().defaultNow(),
     createdAt: timestamp("created_at").notNull().defaultNow(),
});
