import { ContactTimelineCard } from "@/components/contact/ContactTimelineCard";
import { FollowUpList } from "@/components/contact/FollowUpList";
import { OutreachHistoryCard } from "@/components/contact/OutreachHistoryCard";
import { ReminderScheduleCard } from "@/components/contact/ReminderScheduleCard";
import { StageActions } from "@/components/contact/StageActions";
import { FunnelStageBadge } from "@/components/outreach/FunnelStageBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { serializeForClient } from "@/lib/utils";
import { Meeting } from "@/models/Meeting";
import { Opportunity } from "@/models/Opportunity";
import {
     SerializedContact,
     SerializedContactEvent,
     SerializedFollowUp,
     SerializedOutreach,
} from "@/models/serialized";
import { ContactEventService } from "@/server/services/ContactEventService";
import { ContactService } from "@/server/services/ContactService";
import { FollowUpService } from "@/server/services/FollowUpService";
import { MeetingService } from "@/server/services/MeetingService";
import { OpportunityService } from "@/server/services/OpportunityService";
import { OutreachService } from "@/server/services/OutreachService";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const contactService = new ContactService();
const contactEventService = new ContactEventService();
const outreachService = new OutreachService();
const meetingService = new MeetingService();
const opportunityService = new OpportunityService();
const followUpService = new FollowUpService();

export default async function ContactDetailPage({
     params,
}: {
     params: Promise<{ id: string }>;
}) {
     const { id } = await params;
     const contactRaw = await contactService.getContactById(id);

     if (!contactRaw) {
          notFound();
     }

     const [
          outreachesRaw,
          meetingsRaw,
          opportunitiesRaw,
          followUpsRaw,
          timelineEventsRaw,
     ] = await Promise.all([
          outreachService.getOutreachesByContact(contactRaw.id),
          meetingService.getMeetingsByContact(contactRaw.id),
          opportunityService.getOpportunitiesByContact(contactRaw.id),
          followUpService.getFollowUpsByContact(contactRaw.id),
          contactEventService.getTimeline(contactRaw.id),
     ]);

     // Serialize to convert Date objects to ISO strings for Next.js
     const contact = serializeForClient<SerializedContact>(contactRaw);
     const outreaches = serializeForClient<SerializedOutreach[]>(outreachesRaw);
     const meetings = serializeForClient<Meeting[]>(meetingsRaw);
     const opportunities = serializeForClient<Opportunity[]>(opportunitiesRaw);
     const followUps = serializeForClient<SerializedFollowUp[]>(followUpsRaw);
     const timelineEvents =
          serializeForClient<SerializedContactEvent[]>(timelineEventsRaw);

     // Get the latest outreach for the "They Responded" button
     const latestOutreach =
          outreaches.length > 0
               ? outreaches.sort(
                      (a, b) =>
                           new Date(b.createdAt).getTime() -
                           new Date(a.createdAt).getTime()
                 )[0]
               : null;

     return (
          <div className="space-y-6">
               <Link
                    href="/dashboard/contacts"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
               >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Contacts
               </Link>

               <div className="flex items-start justify-between">
                    <div>
                         <h1 className="text-3xl font-bold">
                              {contact.firstName} {contact.lastName}
                         </h1>
                         <div className="mt-2">
                              <FunnelStageBadge
                                   stage={contact.currentFunnelStage}
                              />
                         </div>
                    </div>
               </div>

               {/* Top row: Actions and Contact Info */}
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Stage Actions */}
                    <StageActions
                         contactId={contact.id}
                         currentStage={contact.currentFunnelStage}
                         latestOutreachId={latestOutreach?.id}
                    />

                    {/* Contact Information */}
                    <Card>
                         <CardHeader>
                              <CardTitle>Contact Information</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-2">
                              {contact.company && (
                                   <p>
                                        <strong>Company:</strong>{" "}
                                        {contact.company}
                                   </p>
                              )}
                              {contact.email && (
                                   <p>
                                        <strong>Email:</strong> {contact.email}
                                   </p>
                              )}
                              {contact.slackUsername && (
                                   <p>
                                        <strong>Slack:</strong>{" "}
                                        {contact.slackUsername}
                                   </p>
                              )}
                              {contact.phoneNumber && (
                                   <p>
                                        <strong>Phone:</strong>{" "}
                                        {contact.phoneNumber}
                                   </p>
                              )}
                              {contact.linkedinUrl && (
                                   <p>
                                        <strong>LinkedIn:</strong>{" "}
                                        <a
                                             href={contact.linkedinUrl}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="text-blue-600 hover:underline"
                                        >
                                             View Profile
                                        </a>
                                   </p>
                              )}
                              {contact.notes && (
                                   <p>
                                        <strong>Notes:</strong> {contact.notes}
                                   </p>
                              )}
                         </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="space-y-4">
                         <Card>
                              <CardHeader className="pb-2">
                                   <CardTitle className="text-base">
                                        Meetings
                                   </CardTitle>
                              </CardHeader>
                              <CardContent>
                                   <p className="text-2xl font-bold">
                                        {meetings.length}
                                   </p>
                                   <p className="text-sm text-muted-foreground">
                                        Total meetings
                                   </p>
                              </CardContent>
                         </Card>

                         <Card>
                              <CardHeader className="pb-2">
                                   <CardTitle className="text-base">
                                        Opportunities
                                   </CardTitle>
                              </CardHeader>
                              <CardContent>
                                   <p className="text-2xl font-bold">
                                        {opportunities.length}
                                   </p>
                                   <p className="text-sm text-muted-foreground">
                                        Total opportunities
                                   </p>
                              </CardContent>
                         </Card>
                    </div>
               </div>

               {/* Outreach History and Follow-ups */}
               <div className="grid gap-4 lg:grid-cols-2">
                    <OutreachHistoryCard
                         outreaches={outreaches}
                         contactId={contact.id}
                    />
                    <FollowUpList
                         followUps={followUps}
                         contactId={contact.id}
                    />
               </div>

               {/* Reminder Schedule Management */}
               <ReminderScheduleCard
                    outreaches={outreaches}
                    contactId={contact.id}
               />

               {/* Contact Timeline */}
               <ContactTimelineCard events={timelineEvents} />
          </div>
     );
}
