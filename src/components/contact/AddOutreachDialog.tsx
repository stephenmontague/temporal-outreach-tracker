"use client";

import { createUnpromptedOutreach } from "@/app/actions/contact-actions";
import { Button } from "@/components/ui/button";
import {
     Card,
     CardContent,
     CardFooter,
     CardHeader,
     CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OutreachMethod } from "@/models/OutreachMethod";
import { X } from "lucide-react";
import { useState, useTransition } from "react";
import { ReminderScheduleInput } from "./ReminderScheduleInput";

interface AddOutreachDialogProps {
     open: boolean;
     onClose: () => void;
     onSuccess?: (newOutreachId: string) => void;
     contactId: string;
}

export function AddOutreachDialog({
     open,
     onClose,
     onSuccess,
     contactId,
}: AddOutreachDialogProps) {
     const [isPending, startTransition] = useTransition();
     const [error, setError] = useState<string | null>(null);
     const [reminderSchedule, setReminderSchedule] = useState<number[]>([3]);
     const [method, setMethod] = useState<OutreachMethod>(OutreachMethod.EMAIL);

     // Default to current date/time (local timezone)
     const now = new Date();
     const defaultDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
     
     const [outreachDateTime, setOutreachDateTime] = useState<string>(defaultDateTime);

     if (!open) return null;

     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          setError(null);

          const formData = new FormData(e.currentTarget);
          formData.set("method", method);
          formData.set("reminderSchedule", JSON.stringify(reminderSchedule));

          startTransition(async () => {
               const result = await createUnpromptedOutreach(
                    contactId,
                    formData
               );
               if (result.success) {
                    if (onSuccess && result.outreach?.id) {
                         onSuccess(result.outreach.id);
                    } else {
                         onClose();
                    }
               } else {
                    setError(
                         result.error || "Failed to create outreach"
                    );
               }
          });
     };

     const outreachMethods = [
          { value: OutreachMethod.EMAIL, label: "Email" },
          { value: OutreachMethod.SLACK, label: "Slack" },
          { value: OutreachMethod.LINKEDIN, label: "LinkedIn" },
          { value: OutreachMethod.PHONE, label: "Phone" },
          { value: OutreachMethod.OTHER, label: "Other" },
     ];

     return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
               {/* Backdrop */}
               <div
                    className="absolute inset-0 bg-black/50"
                    onClick={onClose}
               />

               {/* Dialog */}
               <Card className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                    <form onSubmit={handleSubmit}>
                         <CardHeader className="flex flex-row items-center justify-between">
                              <CardTitle>Send Follow-up</CardTitle>
                              <Button
                                   type="button"
                                   variant="ghost"
                                   size="icon"
                                   onClick={onClose}
                                   className="h-8 w-8"
                              >
                                   <X className="h-4 w-4" />
                              </Button>
                         </CardHeader>

                         <CardContent className="space-y-4">
                              {error && (
                                   <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
                                        {error}
                                   </div>
                              )}

                              <p className="text-sm text-muted-foreground">
                                   Record a new outreach to this contact and
                                   optionally set up reminders.
                              </p>

                              {/* Method */}
                              <div className="space-y-2">
                                   <Label>Method *</Label>
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
                                                  onClick={() =>
                                                       setMethod(m.value)
                                                  }
                                             >
                                                  {m.label}
                                             </Button>
                                        ))}
                                   </div>
                              </div>

                              {/* Date & Time */}
                              <div className="space-y-2">
                                   <Label htmlFor="dateTime">
                                        Date & Time *
                                   </Label>
                                   <Input
                                        id="dateTime"
                                        name="dateTime"
                                        type="datetime-local"
                                        value={outreachDateTime}
                                        onChange={(e) => setOutreachDateTime(e.target.value)}
                                        required
                                   />
                              </div>

                              {/* Subject */}
                              <div className="space-y-2">
                                   <Label htmlFor="subject">Subject</Label>
                                   <Input
                                        id="subject"
                                        name="subject"
                                        placeholder="Subject line or topic"
                                   />
                              </div>

                              {/* Message Preview */}
                              <div className="space-y-2">
                                   <Label htmlFor="messagePreview">
                                        Message Preview
                                   </Label>
                                   <textarea
                                        id="messagePreview"
                                        name="messagePreview"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Brief preview of your message"
                                   />
                              </div>

                              {/* Notes */}
                              <div className="space-y-2">
                                   <Label htmlFor="notes">Notes</Label>
                                   <textarea
                                        id="notes"
                                        name="notes"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Any additional notes about this outreach"
                                   />
                              </div>

                              {/* Reminder Schedule */}
                              <div className="border-t pt-4">
                                   <ReminderScheduleInput
                                        value={reminderSchedule}
                                        onChange={setReminderSchedule}
                                        outreachDateTime={outreachDateTime}
                                   />
                                   <p className="text-xs text-muted-foreground mt-2">
                                        Optional: Set up reminders for
                                        follow-ups. Leave empty if you don't need reminders.
                                   </p>
                              </div>
                         </CardContent>

                         <CardFooter className="flex justify-end gap-2">
                              <Button
                                   type="button"
                                   variant="outline"
                                   onClick={onClose}
                                   disabled={isPending}
                              >
                                   Cancel
                              </Button>
                              <Button type="submit" disabled={isPending}>
                                   {isPending ? "Saving..." : "Save Outreach"}
                              </Button>
                         </CardFooter>
                    </form>
               </Card>
          </div>
     );
}

