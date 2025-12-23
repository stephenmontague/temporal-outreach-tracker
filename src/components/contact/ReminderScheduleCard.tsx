"use client";

import {
     cancelOutreachReminders,
     getContactWorkflowState,
     updateReminderSchedule,
} from "@/app/actions/contact-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutreachMethod } from "@/models/OutreachMethod";
import { SerializedOutreach } from "@/models/serialized";
import {
     AlertCircle,
     Bell,
     BellOff,
     Check,
     Clock,
     Linkedin,
     Mail,
     MessageSquare,
     MoreHorizontal,
     Pencil,
     Phone,
     Plus,
     RefreshCw,
     X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

interface ReminderScheduleCardProps {
     outreaches: SerializedOutreach[];
     contactId: string;
}

interface OutreachState {
     id: string;
     method: string;
     dateTime: string;
     reminderSchedule: number[];
     currentReminderIndex: number;
     nextReminderAt?: string;
     responded: boolean;
     cancelled: boolean;
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

export function ReminderScheduleCard({
     outreaches,
     contactId,
}: ReminderScheduleCardProps) {
     const [editingId, setEditingId] = useState<string | null>(null);
     const [outreachStates, setOutreachStates] = useState<
          Record<string, OutreachState | null>
     >({});
     const [isPending, startTransition] = useTransition();
     const [error, setError] = useState<string | null>(null);
     const [isLoading, setIsLoading] = useState(true);

     // Filter to outreaches that haven't received a response
     const activeOutreaches = outreaches.filter((o) => !o.responseReceived);

     // Fetch workflow state on mount
     useEffect(() => {
          const fetchState = async () => {
               setIsLoading(true);

               const result = await getContactWorkflowState(contactId);
               if (result.success && result.state) {
                    // Map workflow outreach states to our local state
                    const states: Record<string, OutreachState | null> = {};
                    const workflowOutreaches = result.state.outreaches || {};

                    for (const outreach of activeOutreaches) {
                         const workflowOutreach =
                              workflowOutreaches[outreach.id];
                         if (
                              workflowOutreach &&
                              !workflowOutreach.responded &&
                              !workflowOutreach.cancelled
                         ) {
                              states[outreach.id] = workflowOutreach;
                         } else {
                              states[outreach.id] = null;
                         }
                    }

                    setOutreachStates(states);
               } else {
                    // No workflow running - set all states to null
                    const states: Record<string, OutreachState | null> = {};
                    for (const outreach of activeOutreaches) {
                         states[outreach.id] = null;
                    }
                    setOutreachStates(states);
               }

               setIsLoading(false);
          };

          fetchState();
     }, [activeOutreaches.map((o) => o.id).join(","), contactId]);

     const handleSaveSchedule = (outreachId: string, newSchedule: number[]) => {
          setError(null);
          startTransition(async () => {
               const result = await updateReminderSchedule(
                    contactId,
                    outreachId,
                    newSchedule
               );
               if (result.success) {
                    setEditingId(null);
                    // Refresh the workflow state
                    const stateResult = await getContactWorkflowState(
                         contactId
                    );
                    if (stateResult.success && stateResult.state) {
                         const workflowOutreach =
                              stateResult.state.outreaches?.[outreachId];
                         if (workflowOutreach) {
                              setOutreachStates((prev) => ({
                                   ...prev,
                                   [outreachId]: workflowOutreach,
                              }));
                         }
                    }
               } else {
                    setError(result.error || "Failed to update schedule");
               }
          });
     };

     const handleCancelReminders = (outreachId: string) => {
          setError(null);
          startTransition(async () => {
               const result = await cancelOutreachReminders(
                    contactId,
                    outreachId
               );
               if (result.success) {
                    setOutreachStates((prev) => ({
                         ...prev,
                         [outreachId]: null,
                    }));
               } else {
                    setError(result.error || "Failed to cancel reminders");
               }
          });
     };

     const refreshState = async () => {
          const result = await getContactWorkflowState(contactId);
          if (result.success && result.state) {
               const states: Record<string, OutreachState | null> = {};
               const workflowOutreaches = result.state.outreaches || {};

               for (const outreach of activeOutreaches) {
                    const workflowOutreach = workflowOutreaches[outreach.id];
                    if (
                         workflowOutreach &&
                         !workflowOutreach.responded &&
                         !workflowOutreach.cancelled
                    ) {
                         states[outreach.id] = workflowOutreach;
                    } else {
                         states[outreach.id] = null;
                    }
               }

               setOutreachStates(states);
          }
     };

     if (activeOutreaches.length === 0) {
          return (
               <Card>
                    <CardHeader>
                         <CardTitle className="text-lg flex items-center gap-2">
                              <Bell className="h-5 w-5" />
                              Reminder Schedules
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground">
                              No active outreaches to manage reminders for.
                         </p>
                    </CardContent>
               </Card>
          );
     }

     return (
          <Card>
               <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                         <Bell className="h-5 w-5" />
                         Reminder Schedules
                    </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                    {error && (
                         <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {error}
                         </div>
                    )}

                    {isLoading ? (
                         <div className="flex items-center justify-center py-8">
                              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                              <span className="ml-2 text-sm text-muted-foreground">
                                   Loading reminder states...
                              </span>
                         </div>
                    ) : (
                         activeOutreaches.map((outreach) => {
                              const Icon =
                                   methodIcons[outreach.method] ||
                                   MoreHorizontal;
                              const isEditing = editingId === outreach.id;
                              const outreachState = outreachStates[outreach.id];
                              const pendingReminders = outreachState
                                   ? outreachState.reminderSchedule.slice(
                                          outreachState.currentReminderIndex
                                     )
                                   : [];
                              const hasActiveReminders =
                                   pendingReminders.length > 0;

                              return (
                                   <div
                                        key={outreach.id}
                                        className="border rounded-lg p-4 space-y-3"
                                   >
                                        {/* Header */}
                                        <div className="flex items-center justify-between">
                                             <div className="flex items-center gap-3">
                                                  <div className="p-2 rounded-full bg-muted">
                                                       <Icon className="h-4 w-4" />
                                                  </div>
                                                  <div>
                                                       <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                 {
                                                                      methodLabels[
                                                                           outreach
                                                                                .method
                                                                      ]
                                                                 }{" "}
                                                                 Outreach
                                                            </span>
                                                            {hasActiveReminders ? (
                                                                 <Badge
                                                                      variant="outline"
                                                                      className="text-amber-600 border-amber-600"
                                                                 >
                                                                      <Bell className="h-3 w-3 mr-1" />
                                                                      Active
                                                                 </Badge>
                                                            ) : (
                                                                 <Badge
                                                                      variant="outline"
                                                                      className="text-muted-foreground"
                                                                 >
                                                                      <BellOff className="h-3 w-3 mr-1" />
                                                                      No
                                                                      reminders
                                                                 </Badge>
                                                            )}
                                                       </div>
                                                       <p className="text-sm text-muted-foreground">
                                                            {new Date(
                                                                 outreach.dateTime
                                                            ).toLocaleDateString(
                                                                 "en-US",
                                                                 {
                                                                      month: "short",
                                                                      day: "numeric",
                                                                      year: "numeric",
                                                                 }
                                                            )}
                                                       </p>
                                                  </div>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                  <Button
                                                       variant="ghost"
                                                       size="icon"
                                                       onClick={refreshState}
                                                       className="h-8 w-8"
                                                       title="Refresh state"
                                                  >
                                                       <RefreshCw className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                       variant="ghost"
                                                       size="icon"
                                                       onClick={() =>
                                                            setEditingId(
                                                                 isEditing
                                                                      ? null
                                                                      : outreach.id
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

                                        {/* Current schedule display */}
                                        {!isEditing && hasActiveReminders && (
                                             <div className="pl-11 space-y-2">
                                                  <p className="text-sm text-muted-foreground">
                                                       <strong>
                                                            Pending reminders:
                                                       </strong>
                                                  </p>
                                                  <div className="flex flex-wrap gap-2">
                                                       {pendingReminders.map(
                                                            (days, index) => (
                                                                 <Badge
                                                                      key={
                                                                           index
                                                                      }
                                                                      variant="secondary"
                                                                      className="gap-1"
                                                                 >
                                                                      <Clock className="h-3 w-3" />
                                                                      {days} day
                                                                      {days !==
                                                                      1
                                                                           ? "s"
                                                                           : ""}
                                                                 </Badge>
                                                            )
                                                       )}
                                                  </div>
                                                  {outreachState?.nextReminderAt && (
                                                       <p className="text-xs text-muted-foreground">
                                                            Next reminder:{" "}
                                                            {new Date(
                                                                 outreachState.nextReminderAt
                                                            ).toLocaleDateString(
                                                                 "en-US",
                                                                 {
                                                                      month: "short",
                                                                      day: "numeric",
                                                                      hour: "numeric",
                                                                      minute: "2-digit",
                                                                 }
                                                            )}
                                                       </p>
                                                  )}
                                             </div>
                                        )}

                                        {/* Edit form */}
                                        {isEditing && (
                                             <div className="pt-2 border-t">
                                                  <ReminderScheduleEditForm
                                                       initialSchedule={
                                                            pendingReminders
                                                       }
                                                       onSave={(schedule) =>
                                                            handleSaveSchedule(
                                                                 outreach.id,
                                                                 schedule
                                                            )
                                                       }
                                                       onCancel={() =>
                                                            setEditingId(null)
                                                       }
                                                       onCancelReminders={() =>
                                                            handleCancelReminders(
                                                                 outreach.id
                                                            )
                                                       }
                                                       isPending={isPending}
                                                       hasActiveReminders={
                                                            hasActiveReminders
                                                       }
                                                  />
                                             </div>
                                        )}
                                   </div>
                              );
                         })
                    )}
               </CardContent>
          </Card>
     );
}

interface ReminderScheduleEditFormProps {
     initialSchedule: number[];
     onSave: (schedule: number[]) => void;
     onCancel: () => void;
     onCancelReminders: () => void;
     isPending: boolean;
     hasActiveReminders: boolean;
}

function ReminderScheduleEditForm({
     initialSchedule,
     onSave,
     onCancel,
     onCancelReminders,
     isPending,
     hasActiveReminders,
}: ReminderScheduleEditFormProps) {
     const [schedule, setSchedule] = useState<number[]>(
          initialSchedule.length > 0 ? initialSchedule : [3, 3, 5]
     );
     const [newDays, setNewDays] = useState("3");

     const addReminder = () => {
          const days = parseInt(newDays, 10);
          if (days > 0) {
               setSchedule([...schedule, days]);
               setNewDays("3");
          }
     };

     const removeReminder = (index: number) => {
          setSchedule(schedule.filter((_, i) => i !== index));
     };

     const updateReminder = (index: number, days: number) => {
          if (days > 0) {
               const updated = [...schedule];
               updated[index] = days;
               setSchedule(updated);
          }
     };

     const getCumulativeDays = (index: number): number => {
          return schedule.slice(0, index + 1).reduce((sum, d) => sum + d, 0);
     };

     return (
          <div className="space-y-4">
               <div className="space-y-3">
                    <Label>
                         Reminder Schedule (days between each reminder)
                    </Label>

                    {schedule.length === 0 ? (
                         <p className="text-sm text-muted-foreground">
                              No reminders scheduled. Add one below.
                         </p>
                    ) : (
                         <div className="space-y-2">
                              {schedule.map((days, index) => (
                                   <div
                                        key={index}
                                        className="flex items-center gap-2"
                                   >
                                        <div className="flex items-center gap-2 flex-1">
                                             <span className="text-sm text-muted-foreground min-w-[80px]">
                                                  {index === 0
                                                       ? "Remind in"
                                                       : "Then after"}
                                             </span>
                                             <Input
                                                  type="number"
                                                  min="1"
                                                  value={days}
                                                  onChange={(e) =>
                                                       updateReminder(
                                                            index,
                                                            parseInt(
                                                                 e.target.value,
                                                                 10
                                                            ) || 1
                                                       )
                                                  }
                                                  className="w-20"
                                             />
                                             <span className="text-sm text-muted-foreground">
                                                  days
                                             </span>
                                             <span className="text-xs text-muted-foreground ml-2">
                                                  (day{" "}
                                                  {getCumulativeDays(index)}{" "}
                                                  total)
                                             </span>
                                        </div>
                                        <Button
                                             type="button"
                                             variant="ghost"
                                             size="icon"
                                             onClick={() =>
                                                  removeReminder(index)
                                             }
                                             className="h-8 w-8"
                                        >
                                             <X className="h-4 w-4" />
                                        </Button>
                                   </div>
                              ))}
                         </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                         <Input
                              type="number"
                              min="1"
                              value={newDays}
                              onChange={(e) => setNewDays(e.target.value)}
                              placeholder="Days"
                              className="w-20"
                         />
                         <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addReminder}
                              className="gap-1"
                         >
                              <Plus className="h-4 w-4" />
                              Add reminder
                         </Button>
                    </div>
               </div>

               <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                         {hasActiveReminders && (
                              <Button
                                   type="button"
                                   variant="outline"
                                   size="sm"
                                   onClick={onCancelReminders}
                                   disabled={isPending}
                                   className="gap-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                   <BellOff className="h-4 w-4" />
                                   Cancel all reminders
                              </Button>
                         )}
                    </div>
                    <div className="flex gap-2">
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
                         <Button
                              type="button"
                              size="sm"
                              disabled={isPending}
                              onClick={() => onSave(schedule)}
                         >
                              <Check className="h-4 w-4 mr-1" />
                              {isPending ? "Saving..." : "Save Schedule"}
                         </Button>
                    </div>
               </div>
          </div>
     );
}
