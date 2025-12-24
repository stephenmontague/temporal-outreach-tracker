'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { FunnelStage } from '@/models/FunnelStage';
import { updateContactStage, recordContactResponse } from '@/app/actions/contact-actions';
import { ResponseOutreachDialog } from './ResponseOutreachDialog';
import { AddOutreachDialog } from './AddOutreachDialog';
import { 
  CheckCircle, 
  Calendar, 
  Users, 
  Target, 
  Trophy,
  XCircle,
  Clock,
  MessageSquare,
  Send
} from 'lucide-react';

interface StageActionsProps {
  contactId: string;
  currentStage: FunnelStage;
  latestOutreachId?: string;
}

const stageConfig: Record<FunnelStage, { 
  label: string; 
  icon: React.ElementType;
  description: string;
}> = {
  [FunnelStage.OUTREACH]: {
    label: 'Outreach',
    icon: MessageSquare,
    description: 'Initial contact made',
  },
  [FunnelStage.MEETING_BOOKED]: {
    label: 'Meeting Booked',
    icon: Calendar,
    description: 'Discovery meeting scheduled',
  },
  [FunnelStage.AE_MEETING]: {
    label: 'AE Meeting',
    icon: Users,
    description: 'Account Executive involved',
  },
  [FunnelStage.OPPORTUNITY_CREATED]: {
    label: 'Opportunity Created',
    icon: Target,
    description: 'Sales opportunity in pipeline',
  },
  [FunnelStage.STAGE_1]: {
    label: 'Stage 1',
    icon: Trophy,
    description: 'Deal progressing',
  },
  [FunnelStage.LOST]: {
    label: 'Lost',
    icon: XCircle,
    description: 'Opportunity lost',
  },
  [FunnelStage.INACTIVE]: {
    label: 'Inactive',
    icon: Clock,
    description: 'Contact inactive',
  },
};

// All available stages for the dropdown
const allStages = Object.values(FunnelStage);

export function StageActions({ contactId, currentStage, latestOutreachId }: StageActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showAddOutreachDialog, setShowAddOutreachDialog] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseSaved, setResponseSaved] = useState(false);
  const [selectedStage, setSelectedStage] = useState<FunnelStage>(currentStage);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [occurredAt, setOccurredAt] = useState<string>('');
  const [responseDate, setResponseDate] = useState<string>('');
  const [responseContext, setResponseContext] = useState<string>('');
  
  // Track the current outreach ID - this may change when user creates a new outreach
  const [currentOutreachId, setCurrentOutreachId] = useState<string | undefined>(latestOutreachId);
  
  // Update currentOutreachId when latestOutreachId prop changes (page refresh)
  useEffect(() => {
    setCurrentOutreachId(latestOutreachId);
  }, [latestOutreachId]);

  const currentConfig = stageConfig[currentStage];
  const isTerminalStage = currentStage === FunnelStage.STAGE_1 || currentStage === FunnelStage.LOST;

  const handleStageSelect = (newStage: FunnelStage) => {
    if (newStage === currentStage) return;
    setSelectedStage(newStage);
    setShowDatePicker(true);
    // Set default to current date/time
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setOccurredAt(localDateTime);
  };

  const handleStageChange = () => {
    if (selectedStage === currentStage) return;
    
    setError(null);
    const occurredAtDate = occurredAt ? new Date(occurredAt) : undefined;
    
    startTransition(async () => {
      const result = await updateContactStage(contactId, selectedStage, occurredAtDate);
      if (!result.success) {
        setError(result.error || 'Failed to update stage');
        setSelectedStage(currentStage); // Reset on error
      } else {
        setSelectedStage(selectedStage);
        setShowDatePicker(false);
        setOccurredAt('');
      }
    });
  };

  const handleCancelDatePicker = () => {
    setShowDatePicker(false);
    setSelectedStage(currentStage);
    setOccurredAt('');
  };

  const handleResponded = () => {
    if (!currentOutreachId) return;
    setError(null);
    setShowResponseForm(true);
    // Set default to current date/time
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setResponseDate(localDateTime);
    setResponseContext('');
  };

  const handleSaveResponse = () => {
    if (!currentOutreachId) return;
    setError(null);
    const responseDateObj = responseDate ? new Date(responseDate) : new Date();
    
    startTransition(async () => {
      const result = await recordContactResponse(
        contactId,
        currentOutreachId,
        responseDateObj,
        responseContext || undefined
      );
      if (result.success) {
        setShowResponseForm(false);
        setResponseSaved(true);
        setResponseDate('');
        setResponseContext('');
      } else {
        setError(result.error || 'Failed to record response');
      }
    });
  };
  
  // Handle successful outreach creation - reset to show "They Responded" for the new outreach
  const handleOutreachCreated = (newOutreachId: string) => {
    setCurrentOutreachId(newOutreachId);
    setResponseSaved(false);
    setShowResponseDialog(false);
    setShowAddOutreachDialog(false);
  };

  const handleCancelResponse = () => {
    setShowResponseForm(false);
    setResponseDate('');
    setResponseContext('');
    setError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
            {error}
          </div>
        )}

        {/* Current Stage Display */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Current Stage</p>
          <div className="flex items-center gap-2 p-2 border rounded-md">
            {(() => {
              const Icon = currentConfig.icon;
              return <Icon className="h-4 w-4" />;
            })()}
            <span className="font-medium">{currentConfig.label}</span>
          </div>
        </div>

        {/* Stage Dropdown - Jira-like */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Move to Stage</p>
          <Select
            value={selectedStage}
            onValueChange={(value) => handleStageSelect(value as FunnelStage)}
          >
            <SelectTrigger className="w-full">
              {(() => {
                const config = stageConfig[selectedStage];
                const Icon = config.icon;
                return (
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span>{config.label}</span>
                  </div>
                );
              })()}
            </SelectTrigger>
            <SelectContent>
              {allStages.map((stage) => {
                const config = stageConfig[stage];
                const Icon = config.icon;
                const isCurrentStage = stage === currentStage;
                
                return (
                  <SelectItem
                    key={stage}
                    value={stage}
                    disabled={isCurrentStage}
                    className={isCurrentStage ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{config.label}</span>
                      {isCurrentStage && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          (Current)
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Date Picker for Stage Change */}
        {showDatePicker && (
          <div className="space-y-2 p-3 border rounded-md bg-muted/50">
            <Label htmlFor="occurredAt" className="text-sm">
              When did this happen?
            </Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Enter the date and time when the stage transition occurred. Leave blank to use current time.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleStageChange}
                disabled={isPending}
                size="sm"
                className="flex-1"
              >
                {isPending ? 'Updating...' : 'Update Stage'}
              </Button>
              <Button
                onClick={handleCancelDatePicker}
                disabled={isPending}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* They Responded Button */}
        {currentOutreachId && !isTerminalStage && !showResponseForm && !responseSaved && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Mark contact as responded (stops reminders)
            </p>
            <Button
              onClick={handleResponded}
              disabled={isPending}
              variant="outline"
              className="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <CheckCircle className="h-4 w-4" />
              They Responded
            </Button>
          </div>
        )}

        {/* Response Form */}
        {showResponseForm && (
          <div className="space-y-2 p-3 border rounded-md bg-muted/50">
            <Label htmlFor="responseDate" className="text-sm">
              When did they respond?
            </Label>
            <Input
              id="responseDate"
              type="datetime-local"
              value={responseDate}
              onChange={(e) => setResponseDate(e.target.value)}
              className="w-full"
            />
            <Label htmlFor="responseContext" className="text-sm">
              What did they say?
            </Label>
            <textarea
              id="responseContext"
              value={responseContext}
              onChange={(e) => setResponseContext(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Brief context about their response..."
            />
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveResponse}
                disabled={isPending}
                size="sm"
                className="flex-1"
              >
                {isPending ? 'Saving...' : 'Save Response'}
              </Button>
              <Button
                onClick={handleCancelResponse}
                disabled={isPending}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* I Responded Back Button */}
        {responseSaved && currentOutreachId && (
          <div className="space-y-2">
            <Button
              onClick={() => setShowResponseDialog(true)}
              disabled={isPending}
              variant="outline"
              className="w-full gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <MessageSquare className="h-4 w-4" />
              I Responded Back
            </Button>
          </div>
        )}
        
        {/* Send Follow-up Button (unprompted outreach) */}
        {!isTerminalStage && !showResponseForm && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Send a new follow-up message
            </p>
            <Button
              onClick={() => setShowAddOutreachDialog(true)}
              disabled={isPending}
              variant="outline"
              className="w-full gap-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              <Send className="h-4 w-4" />
              Send Follow-up
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Response Outreach Dialog */}
      {currentOutreachId && (
        <ResponseOutreachDialog
          open={showResponseDialog}
          onClose={() => setShowResponseDialog(false)}
          onSuccess={handleOutreachCreated}
          contactId={contactId}
          originalOutreachId={currentOutreachId}
        />
      )}
      
      {/* Add Outreach Dialog (unprompted follow-up) */}
      <AddOutreachDialog
        open={showAddOutreachDialog}
        onClose={() => setShowAddOutreachDialog(false)}
        onSuccess={handleOutreachCreated}
        contactId={contactId}
      />
    </Card>
  );
}

