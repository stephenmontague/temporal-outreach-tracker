import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SerializedFollowUp } from "@/models/serialized";
import { format } from "date-fns";
import Link from "next/link";

interface UpcomingFollowUpsProps {
     followUpsWithContacts: Array<{
          followUp: SerializedFollowUp;
          contact: {
               id: string;
               firstName: string;
               lastName?: string;
          };
     }>;
}

export function UpcomingFollowUps({ followUpsWithContacts }: UpcomingFollowUpsProps) {
     if (followUpsWithContacts.length === 0) {
          return (
               <Card>
                    <CardHeader>
                         <CardTitle>Upcoming Follow-ups</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground">
                              No upcoming follow-ups
                         </p>
                    </CardContent>
               </Card>
          );
     }

     return (
          <Card>
               <CardHeader>
                    <CardTitle>Upcoming Follow-ups</CardTitle>
               </CardHeader>
               <CardContent>
                    <div className="space-y-4">
                         {followUpsWithContacts.slice(0, 5).map(({ followUp, contact }) => {
                              const scheduledDate = new Date(
                                   followUp.scheduledDate
                              );
                              const contactName = `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ''}`;

                              return (
                                   <div
                                        key={followUp.id}
                                        className="flex items-center justify-between"
                                   >
                                        <div className="flex-1">
                                             <p className="text-sm font-medium">
                                                  {format(
                                                       scheduledDate,
                                                       "MMM d, yyyy"
                                                  )}
                                             </p>
                                             <p className="text-xs text-muted-foreground">
                                                  {followUp.method}
                                             </p>
                                             <Link
                                                  href={`/dashboard/contacts/${contact.id}`}
                                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                             >
                                                  {contactName}
                                             </Link>
                                        </div>
                                        {followUp.isSalesforceManaged && (
                                             <Badge variant="secondary">
                                                  Salesforce
                                             </Badge>
                                        )}
                                   </div>
                              );
                         })}
                    </div>
               </CardContent>
          </Card>
     );
}
