import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserId } from "@/lib/constants";
import { serializeForClient } from "@/lib/utils";
import { SerializedContact, SerializedOutreach } from "@/models/serialized";
import { ContactService } from "@/server/services/ContactService";
import { OutreachService } from "@/server/services/OutreachService";
import { format } from "date-fns";
import Link from "next/link";

const outreachService = new OutreachService();
const contactService = new ContactService();

export default async function OutreachesPage() {
     const userId = getUserId();
     const [outreachesRaw, contactsRaw] = await Promise.all([
          outreachService.getOutreachesByUser(userId),
          contactService.getAllContacts(userId),
     ]);

     const outreaches = serializeForClient(
          outreachesRaw
     ) as SerializedOutreach[];
     const contacts = serializeForClient(contactsRaw) as SerializedContact[];

     // Create a map of contactId -> contact for quick lookup
     const contactMap = new Map(contacts.map((c) => [c.id, c]));

     return (
          <div className="space-y-6">
               <div>
                    <h1 className="text-3xl font-bold">Outreaches</h1>
                    <p className="text-muted-foreground">
                         Track all your outreach activities
                    </p>
               </div>

               {outreaches.length === 0 ? (
                    <div className="text-center py-12">
                         <p className="text-muted-foreground">
                              No outreaches yet. Log your first outreach to get
                              started.
                         </p>
                    </div>
               ) : (
                    <div className="space-y-4">
                         {outreaches.map((outreach) => {
                              const contact = contactMap.get(
                                   outreach.contactId
                              );
                              const contactName = contact
                                   ? `${contact.firstName}${
                                          contact.lastName
                                               ? ` ${contact.lastName}`
                                               : ""
                                     }`
                                   : "Unknown Contact";

                              return (
                                   <Card key={outreach.id}>
                                        <CardHeader>
                                             <div className="flex items-center justify-between">
                                                  <div className="flex-1">
                                                       <CardTitle>
                                                            {contact ? (
                                                                 <>
                                                                      {outreach.subject ||
                                                                           "Outreach"}{" "}
                                                                      to{" "}
                                                                      <Link
                                                                           href={`/dashboard/contacts/${contact.id}`}
                                                                           className="hover:underline"
                                                                      >
                                                                           {
                                                                                contactName
                                                                           }
                                                                      </Link>
                                                                 </>
                                                            ) : (
                                                                 outreach.subject ||
                                                                 "Outreach"
                                                            )}
                                                       </CardTitle>
                                                  </div>
                                                  <Badge>
                                                       {outreach.method}
                                                  </Badge>
                                             </div>
                                        </CardHeader>
                                        <CardContent>
                                             <p className="text-sm text-muted-foreground">
                                                  {format(
                                                       new Date(
                                                            outreach.dateTime
                                                       ),
                                                       "MMM d, yyyy h:mm a"
                                                  )}
                                             </p>
                                             {outreach.messagePreview && (
                                                  <p className="mt-2 text-sm">
                                                       {outreach.messagePreview}
                                                  </p>
                                             )}
                                             {outreach.responseReceived && (
                                                  <Badge
                                                       variant="secondary"
                                                       className="mt-2"
                                                  >
                                                       Response Received
                                                  </Badge>
                                             )}
                                        </CardContent>
                                   </Card>
                              );
                         })}
                    </div>
               )}
          </div>
     );
}
