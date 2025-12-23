"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SerializedFollowUp } from "@/models/serialized";
import { OutreachMethod } from "@/models/OutreachMethod";
import { updateFollowUp, markComplete } from "@/app/actions/follow-up-actions";
import {
     Mail,
     MessageSquare,
     Phone,
     Linkedin,
     MoreHorizontal,
     Pencil,
     Check,
     X,
     Clock,
     CheckCircle2,
     Calendar,
} from "lucide-react";

interface FollowUpListProps {
     followUps: SerializedFollowUp[];
     contactId: string;
}

const methodIcons: Record<string, React.ElementType> = {
     [OutreachMethod.EMAIL]: Mail,
     [OutreachMethod.SLACK]: MessageSquare,
     [OutreachMethod.PHONE]: Phone,
     [OutreachMethod.LINKEDIN]: Linkedin,
     [OutreachMethod.OTHER]: MoreHorizontal,
};

const methodLabels: Record<string, string> = {
     [OutreachMethod.EMAIL]: "Email",
     [OutreachMethod.SLACK]: "Slack",
     [OutreachMethod.PHONE]: "Phone",
     [OutreachMethod.LINKEDIN]: "LinkedIn",
     [OutreachMethod.OTHER]: "Other",
};

export function FollowUpList({ followUps, contactId }: FollowUpListProps) {
     const [editingId, setEditingId] = useState<string | null>(null);
     const [isPending, startTransition] = useTransition();
     const [error, setError] = useState<string | null>(null);

     // Separate pending and completed follow-ups
     const pendingFollowUps = followUps
          .filter((f) => !f.completed)
          .sort(
               (a, b) =>
                    new Date(a.scheduledDate).getTime() -
                    new Date(b.scheduledDate).getTime()
          );

     const completedFollowUps = followUps
          .filter((f) => f.completed)
          .sort(
               (a, b) =>
                    new Date(b.completedDate || b.scheduledDate).getTime() -
                    new Date(a.completedDate || a.scheduledDate).getTime()
          );

     const handleMarkComplete = (followUpId: string) => {
          setError(null);
          startTransition(async () => {
               const result = await markComplete(followUpId);
               if (!result.success) {
                    setError(result.error || "Failed to mark as complete");
               }
          });
     };

     const handleSave = (followUpId: string, formData: FormData) => {
          setError(null);
          startTransition(async () => {
               const result = await updateFollowUp(followUpId, formData);
               if (result.success) {
                    setEditingId(null);
               } else {
                    setError(result.error || "Failed to update follow-up");
               }
          });
     };

     const isOverdue = (date: string) => {
          return (
               new Date(date) < new Date() &&
               !followUps.find((f) => f.scheduledDate === date)?.completed
          );
     };

     const getDaysUntil = (date: string) => {
          const now = new Date();
          const target = new Date(date);

          // Reset both dates to midnight to compare calendar days only
          const nowDate = new Date(
               now.getFullYear(),
               now.getMonth(),
               now.getDate()
          );

          const targetDate = new Date(
               target.getFullYear(),
               target.getMonth(),
               target.getDate()
          );

          const diffTime = targetDate.getTime() - nowDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          return diffDays;
     };

     if (followUps.length === 0) {
          return (
               <Card>
                    <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Follow-ups
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground">
                              No follow-ups scheduled.
                         </p>
                    </CardContent>
               </Card>
          );
     }

     return (
          <Card>
               <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                         <Clock className="h-5 w-5" />
                         Follow-ups
                    </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                    {error && (
                         <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
                              {error}
                         </div>
                    )}

                    {/* Pending Follow-ups */}
                    {pendingFollowUps.length > 0 && (
                         <div className="space-y-3">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                   Upcoming
                              </h4>
                              {pendingFollowUps.map((followUp) => {
                                   const Icon =
                                        methodIcons[followUp.method] ||
                                        MoreHorizontal;
                                   const isEditing = editingId === followUp.id;
                                   const daysUntil = getDaysUntil(
                                        followUp.scheduledDate
                                   );
                                   const overdue = daysUntil < 0;

                                   return (
                                        <div
                                             key={followUp.id}
                                             className={`border rounded-lg p-4 space-y-3 ${
                                                  overdue
                                                       ? "border-red-300 bg-red-50/50 dark:bg-red-950/20"
                                                       : ""
                                             }`}
                                        >
                                             <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-3">
                                                       <div
                                                            className={`p-2 rounded-full ${
                                                                 overdue
                                                                      ? "bg-red-100 dark:bg-red-900"
                                                                      : "bg-muted"
                                                            }`}
                                                       >
                                                            <Icon
                                                                 className={`h-4 w-4 ${
                                                                      overdue
                                                                           ? "text-red-600"
                                                                           : ""
                                                                 }`}
                                                            />
                                                       </div>
                                                       <div>
                                                            <div className="flex items-center gap-2">
                                                                 <span className="font-medium">
                                                                      {methodLabels[
                                                                           followUp
                                                                                .method
                                                                      ] ||
                                                                           followUp.method}
                                                                 </span>
                                                                 {overdue ? (
                                                                      <Badge variant="destructive">
                                                                           Overdue
                                                                      </Badge>
                                                                 ) : daysUntil ===
                                                                   0 ? (
                                                                      <Badge variant="default">
                                                                           Today
                                                                      </Badge>
                                                                 ) : daysUntil ===
                                                                   1 ? (
                                                                      <Badge variant="secondary">
                                                                           Tomorrow
                                                                      </Badge>
                                                                 ) : (
                                                                      <Badge variant="outline">
                                                                           In{" "}
                                                                           {
                                                                                daysUntil
                                                                           }{" "}
                                                                           days
                                                                      </Badge>
                                                                 )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                 <Calendar className="h-3 w-3" />
                                                                 {new Date(
                                                                      followUp.scheduledDate
                                                                 ).toLocaleDateString(
                                                                      "en-US",
                                                                      {
                                                                           weekday: "short",
                                                                           month: "short",
                                                                           day: "numeric",
                                                                           hour: "2-digit",
                                                                           minute: "2-digit",
                                                                      }
                                                                 )}
                                                            </p>
                                                       </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                 handleMarkComplete(
                                                                      followUp.id
                                                                 )
                                                            }
                                                            disabled={isPending}
                                                            className="gap-1"
                                                       >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Done
                                                       </Button>
                                                       <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                 setEditingId(
                                                                      isEditing
                                                                           ? null
                                                                           : followUp.id
                                                                 )
                                                            }
                                                            className="h-8 w-8"
                                                       >
                                                            {isEditing ? (
                                                                 <X className="h-4 w-4" />
                                                            ) : (
                                                                 <Pencil className="h-4 w-4" />
                                                            )}
                                                       </Button>
                                                  </div>
                                             </div>

                                             {followUp.notes && !isEditing && (
                                                  <div className="pl-11">
                                                       <p className="text-sm text-muted-foreground">
                                                            <strong>
                                                                 Notes:
                                                            </strong>{" "}
                                                            {followUp.notes}
                                                       </p>
                                                  </div>
                                             )}

                                             {isEditing && (
                                                  <div className="pt-2 border-t">
                                                       <FollowUpEditForm
                                                            followUp={followUp}
                                                            onSave={(
                                                                 formData
                                                            ) =>
                                                                 handleSave(
                                                                      followUp.id,
                                                                      formData
                                                                 )
                                                            }
                                                            onCancel={() =>
                                                                 setEditingId(
                                                                      null
                                                                 )
                                                            }
                                                            isPending={
                                                                 isPending
                                                            }
                                                       />
                                                  </div>
                                             )}
                                        </div>
                                   );
                              })}
                         </div>
                    )}

                    {/* Completed Follow-ups */}
                    {completedFollowUps.length > 0 && (
                         <div className="space-y-3">
                              <h4 className="text-sm font-medium text-muted-foreground">
                                   Completed
                              </h4>
                              {completedFollowUps.map((followUp) => {
                                   const Icon =
                                        methodIcons[followUp.method] ||
                                        MoreHorizontal;

                                   return (
                                        <div
                                             key={followUp.id}
                                             className="border rounded-lg p-4 opacity-60"
                                        >
                                             <div className="flex items-center gap-3">
                                                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                                                       <Icon className="h-4 w-4 text-green-600" />
                                                  </div>
                                                  <div className="flex-1">
                                                       <div className="flex items-center gap-2">
                                                            <span className="font-medium line-through">
                                                                 {methodLabels[
                                                                      followUp
                                                                           .method
                                                                 ] ||
                                                                      followUp.method}
                                                            </span>
                                                            <Badge
                                                                 variant="outline"
                                                                 className="text-green-600 border-green-600"
                                                            >
                                                                 <Check className="h-3 w-3 mr-1" />
                                                                 Completed
                                                            </Badge>
                                                       </div>
                                                       <p className="text-sm text-muted-foreground">
                                                            {followUp.completedDate
                                                                 ? `Completed ${new Date(
                                                                        followUp.completedDate
                                                                   ).toLocaleDateString()}`
                                                                 : `Was scheduled for ${new Date(
                                                                        followUp.scheduledDate
                                                                   ).toLocaleDateString()}`}
                                                       </p>
                                                  </div>
                                             </div>
                                             {followUp.notes && (
                                                  <p className="text-sm text-muted-foreground mt-2 pl-11">
                                                       <strong>Notes:</strong>{" "}
                                                       {followUp.notes}
                                                  </p>
                                             )}
                                        </div>
                                   );
                              })}
                         </div>
                    )}
               </CardContent>
          </Card>
     );
}

interface FollowUpEditFormProps {
     followUp: SerializedFollowUp;
     onSave: (formData: FormData) => void;
     onCancel: () => void;
     isPending: boolean;
}

function FollowUpEditForm({
     followUp,
     onSave,
     onCancel,
     isPending,
}: FollowUpEditFormProps) {
     const [method, setMethod] = useState(followUp.method);

     const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          formData.set("method", method);
          onSave(formData);
     };

     const outreachMethods = [
          { value: OutreachMethod.EMAIL, label: "Email" },
          { value: OutreachMethod.SLACK, label: "Slack" },
          { value: OutreachMethod.LINKEDIN, label: "LinkedIn" },
          { value: OutreachMethod.PHONE, label: "Phone" },
          { value: OutreachMethod.OTHER, label: "Other" },
     ];

     return (
          <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                    <Label>Method</Label>
                    <div className="flex flex-wrap gap-2">
                         {outreachMethods.map((m) => (
                              <Button
                                   key={m.value}
                                   type="button"
                                   variant={
                                        method === m.value
                                             ? "default"
                                             : "outline"
                                   }
                                   size="sm"
                                   onClick={() => setMethod(m.value)}
                              >
                                   {m.label}
                              </Button>
                         ))}
                    </div>
               </div>

               <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Scheduled Date</Label>
                    <Input
                         id="scheduledDate"
                         name="scheduledDate"
                         type="datetime-local"
                         defaultValue={new Date(followUp.scheduledDate)
                              .toISOString()
                              .slice(0, 16)}
                    />
               </div>

               <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                         id="notes"
                         name="notes"
                         defaultValue={followUp.notes || ""}
                         placeholder="Notes for this follow-up..."
                         className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
               </div>

               <div className="flex justify-end gap-2">
                    <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={onCancel}
                         disabled={isPending}
                    >
                         <X className="h-4 w-4 mr-1" />
                         Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                         <Check className="h-4 w-4 mr-1" />
                         {isPending ? "Saving..." : "Save"}
                    </Button>
               </div>
          </form>
     );
}
