import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SerializedContactEvent } from '@/models/serialized';
import { ContactEventType } from '@/models/ContactEvent';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Linkedin, 
  MoreHorizontal,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle,
  FileText,
  Edit,
  Target
} from 'lucide-react';

interface ContactTimelineCardProps {
  events: SerializedContactEvent[];
}

const eventIcons: Record<string, React.ElementType> = {
  [ContactEventType.OUTREACH_CREATED]: Mail,
  [ContactEventType.OUTREACH_RESPONSE_RECEIVED]: CheckCircle,
  [ContactEventType.STAGE_CHANGED]: ArrowRight,
  [ContactEventType.MEETING_CREATED]: Calendar,
  [ContactEventType.MEETING_COMPLETED]: CheckCircle,
  [ContactEventType.OPPORTUNITY_CREATED]: Target,
  [ContactEventType.OPPORTUNITY_STAGE_CHANGED]: ArrowRight,
  [ContactEventType.FOLLOW_UP_SCHEDULED]: Clock,
  [ContactEventType.FOLLOW_UP_COMPLETED]: CheckCircle,
  [ContactEventType.NOTE_ADDED]: FileText,
  [ContactEventType.CONTACT_UPDATED]: Edit,
};

const eventLabels: Record<string, string> = {
  [ContactEventType.OUTREACH_CREATED]: 'Outreach Created',
  [ContactEventType.OUTREACH_RESPONSE_RECEIVED]: 'Response Received',
  [ContactEventType.STAGE_CHANGED]: 'Stage Changed',
  [ContactEventType.MEETING_CREATED]: 'Meeting Created',
  [ContactEventType.MEETING_COMPLETED]: 'Meeting Completed',
  [ContactEventType.OPPORTUNITY_CREATED]: 'Opportunity Created',
  [ContactEventType.OPPORTUNITY_STAGE_CHANGED]: 'Opportunity Stage Changed',
  [ContactEventType.FOLLOW_UP_SCHEDULED]: 'Follow-up Scheduled',
  [ContactEventType.FOLLOW_UP_COMPLETED]: 'Follow-up Completed',
  [ContactEventType.NOTE_ADDED]: 'Note Added',
  [ContactEventType.CONTACT_UPDATED]: 'Contact Updated',
};

const methodIcons: Record<string, React.ElementType> = {
  'EMAIL': Mail,
  'SLACK': MessageSquare,
  'PHONE': Phone,
  'LINKEDIN': Linkedin,
  'OTHER': MoreHorizontal,
};

function formatEventDescription(event: SerializedContactEvent): string {
  const metadata = event.metadata as Record<string, unknown> | null;
  
  switch (event.eventType) {
    case ContactEventType.OUTREACH_CREATED:
      const method = metadata?.method as string;
      const subject = metadata?.subject as string;
      const methodLabel = method ? (methodIcons[method] ? method : method) : 'Unknown';
      return subject ? `${methodLabel}: ${subject}` : `${methodLabel} outreach`;
    
    case ContactEventType.STAGE_CHANGED:
      const fromStage = metadata?.fromStage as string;
      const toStage = metadata?.toStage as string;
      return `${fromStage} → ${toStage}`;
    
    case ContactEventType.MEETING_CREATED:
      const meetingType = metadata?.meetingType as string;
      const location = metadata?.location as string;
      return meetingType ? `${meetingType}${location ? ` at ${location}` : ''}` : 'Meeting';
    
    case ContactEventType.OPPORTUNITY_CREATED:
      const value = metadata?.value as number;
      return value ? `Value: $${value.toLocaleString()}` : 'Opportunity created';
    
    case ContactEventType.OPPORTUNITY_STAGE_CHANGED:
      const oppFromStage = metadata?.fromStage as string;
      const oppToStage = metadata?.toStage as string;
      return `${oppFromStage} → ${oppToStage}`;
    
    default:
      return '';
  }
}

function groupEventsByDate(events: SerializedContactEvent[]): Map<string, SerializedContactEvent[]> {
  const grouped = new Map<string, SerializedContactEvent[]>();
  
  events.forEach((event) => {
    const date = new Date(event.occurredAt);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  });
  
  return grouped;
}

export function ContactTimelineCard({ events }: ContactTimelineCardProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No events recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const groupedEvents = groupEventsByDate(events);
  // Sort dates in reverse chronological order (newest first)
  const sortedDates = Array.from(groupedEvents.keys()).sort((a, b) => {
    // Parse date strings back to dates for comparison
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sortedDates.map((dateKey) => {
          const dayEvents = groupedEvents.get(dateKey)!;
          
          return (
            <div key={dateKey} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground border-b pb-1">
                {dateKey}
              </h3>
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                {dayEvents.map((event) => {
                  const Icon = eventIcons[event.eventType] || MoreHorizontal;
                  const description = formatEventDescription(event);
                  const time = new Date(event.occurredAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={event.id} className="flex items-start gap-3 pb-2">
                      <div className="p-1.5 rounded-full bg-muted mt-0.5">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {eventLabels[event.eventType] || event.eventType}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {time}
                          </span>
                        </div>
                        {description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

