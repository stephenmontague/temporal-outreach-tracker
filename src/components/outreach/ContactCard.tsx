import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SerializedContact } from "@/models/serialized";
import Link from "next/link";
import { FunnelStageBadge } from "./FunnelStageBadge";

interface ContactCardProps {
     contact: SerializedContact;
}

export function ContactCard({ contact }: ContactCardProps) {
     return (
          <Link href={`/dashboard/contacts/${contact.id}`} className="h-full block">
               <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                         <div className="flex items-start justify-between">
                              <CardTitle className="text-lg">
                                   {contact.firstName} {contact.lastName}
                              </CardTitle>
                              <FunnelStageBadge
                                   stage={contact.currentFunnelStage}
                              />
                         </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                         <div className="space-y-1 text-sm text-muted-foreground flex-1">
                              {contact.company && (
                                   <p>Company: {contact.company}</p>
                              )}
                              {contact.email && <p>Email: {contact.email}</p>}
                              {contact.slackUsername && (
                                   <p>Slack: {contact.slackUsername}</p>
                              )}
                         </div>
                    </CardContent>
               </Card>
          </Link>
     );
}
