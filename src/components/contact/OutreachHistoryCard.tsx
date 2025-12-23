'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SerializedOutreach } from '@/models/serialized';
import { OutreachMethod } from '@/models/OutreachMethod';
import { updateOutreach } from '@/app/actions/outreach-actions';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Linkedin, 
  MoreHorizontal,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface OutreachHistoryCardProps {
  outreaches: SerializedOutreach[];
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
  [OutreachMethod.EMAIL]: 'Email',
  [OutreachMethod.SLACK]: 'Slack',
  [OutreachMethod.PHONE]: 'Phone',
  [OutreachMethod.LINKEDIN]: 'LinkedIn',
  [OutreachMethod.OTHER]: 'Other',
};

export function OutreachHistoryCard({ outreaches, contactId }: OutreachHistoryCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Sort outreaches by date (newest first)
  const sortedOutreaches = [...outreaches].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );

  const handleSave = (outreachId: string, formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await updateOutreach(outreachId, formData);
      if (result.success) {
        setEditingId(null);
      } else {
        setError(result.error || 'Failed to update outreach');
      }
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (outreaches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outreach History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No outreaches recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Outreach History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
            {error}
          </div>
        )}

        {sortedOutreaches.map((outreach) => {
          const Icon = methodIcons[outreach.method] || MoreHorizontal;
          const isEditing = editingId === outreach.id;
          const isExpanded = expandedId === outreach.id;

          return (
            <div
              key={outreach.id}
              className="border rounded-lg p-4 space-y-3"
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {methodLabels[outreach.method] || outreach.method}
                      </span>
                      {outreach.responseReceived && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Responded
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(outreach.dateTime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingId(outreach.id)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpand(outreach.id)}
                    className="h-8 w-8"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Subject preview */}
              {outreach.subject && !isExpanded && (
                <p className="text-sm text-muted-foreground truncate">
                  <strong>Subject:</strong> {outreach.subject}
                </p>
              )}

              {/* Expanded content / Edit form */}
              {(isExpanded || isEditing) && (
                <div className="pt-2 border-t space-y-3">
                  {isEditing ? (
                    <OutreachEditForm
                      outreach={outreach}
                      onSave={(formData) => handleSave(outreach.id, formData)}
                      onCancel={() => setEditingId(null)}
                      isPending={isPending}
                    />
                  ) : (
                    <div className="space-y-2">
                      {outreach.subject && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Subject</Label>
                          <p className="text-sm">{outreach.subject}</p>
                        </div>
                      )}
                      {outreach.messagePreview && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Message Preview</Label>
                          <p className="text-sm whitespace-pre-wrap">{outreach.messagePreview}</p>
                        </div>
                      )}
                      {outreach.notes && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <p className="text-sm whitespace-pre-wrap">{outreach.notes}</p>
                        </div>
                      )}
                      {outreach.responseReceived && outreach.responseDate && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Response Date</Label>
                          <p className="text-sm">
                            {new Date(outreach.responseDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {!outreach.subject && !outreach.messagePreview && !outreach.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          No additional details recorded.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface OutreachEditFormProps {
  outreach: SerializedOutreach;
  onSave: (formData: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}

function OutreachEditForm({ outreach, onSave, onCancel, isPending }: OutreachEditFormProps) {
  const [method, setMethod] = useState(outreach.method);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('method', method);
    onSave(formData);
  };

  const outreachMethods = [
    { value: OutreachMethod.EMAIL, label: 'Email' },
    { value: OutreachMethod.SLACK, label: 'Slack' },
    { value: OutreachMethod.LINKEDIN, label: 'LinkedIn' },
    { value: OutreachMethod.PHONE, label: 'Phone' },
    { value: OutreachMethod.OTHER, label: 'Other' },
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
              variant={method === m.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMethod(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateTime">Date & Time</Label>
        <Input
          id="dateTime"
          name="dateTime"
          type="datetime-local"
          defaultValue={new Date(outreach.dateTime).toISOString().slice(0, 16)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          defaultValue={outreach.subject || ''}
          placeholder="Subject line or topic"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="messagePreview">Message Preview</Label>
        <textarea
          id="messagePreview"
          name="messagePreview"
          defaultValue={outreach.messagePreview || ''}
          placeholder="Brief preview of the message content"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={outreach.notes || ''}
          placeholder="Any additional notes about this outreach"
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
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

