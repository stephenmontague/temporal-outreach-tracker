'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReminderScheduleInput } from './ReminderScheduleInput';
import { OutreachMethod } from '@/models/OutreachMethod';
import { createContactWithOutreach } from '@/app/actions/contact-actions';
import { X } from 'lucide-react';

interface ContactFormDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ContactFormDialog({ open, onClose }: ContactFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reminderSchedule, setReminderSchedule] = useState<number[]>([3]);
  const [outreachMethod, setOutreachMethod] = useState<OutreachMethod>(OutreachMethod.EMAIL);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('outreachMethod', outreachMethod);
    formData.set('reminderSchedule', JSON.stringify(reminderSchedule));

    startTransition(async () => {
      const result = await createContactWithOutreach(formData);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to create contact');
      }
    });
  };

  const outreachMethods = [
    { value: OutreachMethod.EMAIL, label: 'Email' },
    { value: OutreachMethod.SLACK, label: 'Slack' },
    { value: OutreachMethod.LINKEDIN, label: 'LinkedIn' },
    { value: OutreachMethod.PHONE, label: 'Phone' },
    { value: OutreachMethod.OTHER, label: 'Other' },
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
            <CardTitle>Add New Contact</CardTitle>
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

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                placeholder="Acme Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slackUsername">Slack Username</Label>
              <Input
                id="slackUsername"
                name="slackUsername"
                placeholder="@johndoe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                name="linkedinUrl"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Any notes about this contact..."
              />
            </div>

            {/* Initial Outreach Method */}
            <div className="space-y-2">
              <Label>Initial Outreach Method *</Label>
              <div className="flex flex-wrap gap-2">
                {outreachMethods.map((method) => (
                  <Button
                    key={method.value}
                    type="button"
                    variant={outreachMethod === method.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOutreachMethod(method.value)}
                  >
                    {method.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Original Outreach Date/Time */}
            <div className="space-y-2">
              <Label htmlFor="originalOutreachDateTime">Original Outreach Date & Time</Label>
              <Input
                id="originalOutreachDateTime"
                name="originalOutreachDateTime"
                type="datetime-local"
                placeholder="When did you first reach out?"
              />
            </div>

            {/* Salesforce Cadence */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isInSalesforceCadence"
                name="isInSalesforceCadence"
                value="true"
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isInSalesforceCadence" className="cursor-pointer">
                In Salesforce Cadence
              </Label>
            </div>

            {/* Reminder Schedule */}
            <div className="border-t pt-4">
              <ReminderScheduleInput
                value={reminderSchedule}
                onChange={setReminderSchedule}
              />
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
              {isPending ? 'Creating...' : 'Create Contact'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

