"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
     markComplete,
     ReminderWithContact,
} from "@/app/actions/follow-up-actions";
import Link from "next/link";
import { format } from "date-fns";

interface NotificationBellProps {
     reminders: ReminderWithContact[];
}

export function NotificationBell({ reminders }: NotificationBellProps) {
     const [isOpen, setIsOpen] = useState(false);
     const [localReminders, setLocalReminders] =
          useState<ReminderWithContact[]>(reminders);
     const dropdownRef = useRef<HTMLDivElement>(null);

     // Update local state when props change
     useEffect(() => {
          setLocalReminders(reminders);
     }, [reminders]);

     // Close dropdown when clicking outside
     useEffect(() => {
          function handleClickOutside(event: MouseEvent) {
               if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(event.target as Node)
               ) {
                    setIsOpen(false);
               }
          }

          document.addEventListener("mousedown", handleClickOutside);
          return () => {
               document.removeEventListener("mousedown", handleClickOutside);
          };
     }, []);

     const handleMarkComplete = async (
          e: React.MouseEvent,
          followUpId: string
     ) => {
          e.preventDefault();
          e.stopPropagation();

          // Optimistically remove from local state
          setLocalReminders((prev) =>
               prev.filter((r) => r.followUp.id !== followUpId)
          );

          await markComplete(followUpId);
     };

     const count = localReminders.length;

     return (
          <div className="relative" ref={dropdownRef}>
               <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative"
               >
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    {count > 0 && (
                         <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                              {count > 9 ? "9+" : count}
                         </span>
                    )}
                    <span className="sr-only">
                         {count} reminder notifications
                    </span>
               </Button>

               {isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-background shadow-lg z-50">
                         <div className="border-b px-4 py-3">
                              <h3 className="font-semibold text-sm">
                                   Reminders
                              </h3>
                              {count > 0 && (
                                   <p className="text-xs text-muted-foreground">
                                        {count} follow-up
                                        {count !== 1 ? "s" : ""} need attention
                                   </p>
                              )}
                         </div>

                         <div className="max-h-80 overflow-y-auto">
                              {localReminders.length === 0 ? (
                                   <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                        No pending reminders
                                   </div>
                              ) : (
                                   localReminders.map(
                                        ({ followUp, contact }) => {
                                             const contactName = `${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ""}`;
                                             const scheduledDate = new Date(
                                                  followUp.scheduledDate
                                             );
                                             const reminderMatch =
                                                  followUp.notes?.match(
                                                       /\((\d+)\/(\d+)\)/
                                                  );
                                             const reminderInfo = reminderMatch
                                                  ? `Reminder ${reminderMatch[1]}/${reminderMatch[2]}`
                                                  : "Reminder";

                                             return (
                                                  <div
                                                       key={followUp.id}
                                                       className="border-b last:border-b-0 px-4 py-3 hover:bg-accent/50 transition-colors"
                                                  >
                                                       <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                 <Link
                                                                      href={`/dashboard/contacts/${contact.id}`}
                                                                      className="font-medium text-sm hover:underline block truncate"
                                                                      onClick={() =>
                                                                           setIsOpen(
                                                                                false
                                                                           )
                                                                      }
                                                                 >
                                                                      {
                                                                           contactName
                                                                      }
                                                                 </Link>
                                                                 <p className="text-xs text-muted-foreground mt-0.5">
                                                                      {
                                                                           reminderInfo
                                                                      }{" "}
                                                                      &middot;{" "}
                                                                      {followUp.method}
                                                                 </p>
                                                                 <p className="text-xs text-muted-foreground">
                                                                      {format(
                                                                           scheduledDate,
                                                                           "MMM d, yyyy 'at' h:mm a"
                                                                      )}
                                                                 </p>
                                                            </div>
                                                            <button
                                                                 onClick={(e) =>
                                                                      handleMarkComplete(
                                                                           e,
                                                                           followUp.id
                                                                      )
                                                                 }
                                                                 className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors"
                                                            >
                                                                 Done
                                                            </button>
                                                       </div>
                                                  </div>
                                             );
                                        }
                                   )
                              )}
                         </div>

                         {localReminders.length > 0 && (
                              <div className="border-t px-4 py-2">
                                   <Link
                                        href="/dashboard"
                                        className="text-xs text-primary hover:underline"
                                        onClick={() => setIsOpen(false)}
                                   >
                                        View all in dashboard
                                   </Link>
                              </div>
                         )}
                    </div>
               )}
          </div>
     );
}

