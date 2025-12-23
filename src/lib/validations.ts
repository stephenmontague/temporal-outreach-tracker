import { z } from "zod";
import { FunnelStage } from "@/models/FunnelStage";
import { OutreachMethod } from "@/models/OutreachMethod";
import { MeetingType, MeetingOutcome } from "@/models/Meeting";
import { OpportunityStage } from "@/models/Opportunity";

// Helper to transform empty strings to undefined
const emptyStringToUndefined = z.string().transform((val) => val === "" ? undefined : val);

// Contact validation
const contactSchemaBase = z.object({
     firstName: emptyStringToUndefined.pipe(z.string().min(1).optional()),
     lastName: z.string().optional(),
     company: z.string().optional(),
     email: z.string().email().optional().or(z.literal("")),
     slackUsername: emptyStringToUndefined.pipe(z.string().min(1).optional()),
     phoneNumber: z.string().optional(),
     linkedinUrl: z.string().url().optional().or(z.literal("")),
     notes: z.string().optional(),
     currentFunnelStage: z
          .nativeEnum(FunnelStage)
          .default(FunnelStage.OUTREACH),
     isInSalesforceCadence: z.boolean().default(false),
     originalOutreachDateTime: z.coerce.date().optional(),
});

export const contactSchema = contactSchemaBase.refine(
     (data) => data.firstName || data.slackUsername,
     {
          message: "Either firstName or slackUsername must be provided",
          path: ["firstName"],
     }
);

export const createContactSchema = contactSchemaBase
     .extend({
          userId: z.string().min(1),
     })
     .refine((data) => data.firstName || data.slackUsername, {
          message: "Either firstName or slackUsername must be provided",
          path: ["firstName"],
     });

export const updateContactSchema = contactSchemaBase.partial().refine(
     (data) => {
          // If both firstName and slackUsername are being updated, at least one must be provided
          if (data.firstName !== undefined || data.slackUsername !== undefined) {
               return !!(data.firstName || data.slackUsername);
          }
          // If neither is being updated, validation passes
          return true;
     },
     {
          message: "Either firstName or slackUsername must be provided",
          path: ["firstName"],
     }
);

// Outreach validation
export const outreachSchema = z.object({
     contactId: z.string().uuid(),
     method: z.nativeEnum(OutreachMethod),
     dateTime: z.coerce.date(),
     subject: z.string().optional(),
     messagePreview: z.string().max(500).optional(),
     notes: z.string().optional(),
     responseReceived: z.boolean().default(false),
     responseDate: z.coerce.date().optional(),
});

export const createOutreachSchema = outreachSchema.extend({
     userId: z.string().min(1),
     followUpDate: z.coerce.date().optional(),
     followUpMethod: z.nativeEnum(OutreachMethod).optional(),
     isSalesforceManaged: z.boolean().default(false),
});

export const updateOutreachSchema = outreachSchema.partial();

// Meeting validation
export const meetingSchema = z.object({
     contactId: z.string().uuid(),
     scheduledDate: z.coerce.date(),
     meetingType: z.nativeEnum(MeetingType),
     duration: z.number().positive().optional(),
     location: z.string().optional(),
     notes: z.string().optional(),
     outcome: z.nativeEnum(MeetingOutcome).optional(),
});

export const createMeetingSchema = meetingSchema.extend({
     userId: z.string().min(1),
});

export const updateMeetingSchema = meetingSchema.partial();

// Opportunity validation
export const opportunitySchema = z.object({
     contactId: z.string().uuid(),
     salesforceOpportunityId: z.string().optional(),
     stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.CREATED),
     stage1Date: z.coerce.date().optional(),
     value: z.number().positive().optional(),
     probability: z.number().min(0).max(100).optional(),
     notes: z.string().optional(),
});

export const createOpportunitySchema = opportunitySchema.extend({
     userId: z.string().min(1),
});

export const updateOpportunitySchema = opportunitySchema.partial();

// Follow-up validation
export const followUpSchema = z.object({
     outreachId: z.string().uuid(),
     contactId: z.string().uuid(),
     scheduledDate: z.coerce.date(),
     method: z.nativeEnum(OutreachMethod),
     notes: z.string().optional(),
     isSalesforceManaged: z.boolean().default(false),
});

export const createFollowUpSchema = followUpSchema.extend({
     completed: z.boolean().default(false),
});

export const updateFollowUpSchema = followUpSchema.partial().extend({
     completed: z.boolean().optional(),
     completedDate: z.coerce.date().optional(),
});
