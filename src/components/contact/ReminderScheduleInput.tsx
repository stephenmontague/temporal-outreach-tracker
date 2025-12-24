'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Calendar, Clock } from 'lucide-react';

export type ReminderType = 'days' | 'datetime';

export interface ReminderItem {
  type: ReminderType;
  days?: number;
  datetime?: string;
}

interface ReminderScheduleInputProps {
  value: number[];
  onChange: (schedule: number[]) => void;
  outreachDateTime?: string; // ISO string of the outreach date, used to calculate days from datetime
}

export function ReminderScheduleInput({ value, onChange, outreachDateTime }: ReminderScheduleInputProps) {
  const [newDays, setNewDays] = useState<string>('3');
  const [newDateTime, setNewDateTime] = useState<string>('');
  const [addMode, setAddMode] = useState<ReminderType>('days');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDateTime, setEditDateTime] = useState<string>('');

  // Get default datetime (3 days from now or from outreach date)
  const getDefaultDateTime = () => {
    const baseDate = outreachDateTime ? new Date(outreachDateTime) : new Date();
    baseDate.setDate(baseDate.getDate() + 3);
    return new Date(baseDate.getTime() - baseDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const addReminder = () => {
    if (addMode === 'days') {
      const days = parseInt(newDays, 10);
      if (days > 0) {
        onChange([...value, days]);
        setNewDays('3');
      }
    } else {
      // Convert datetime to days from outreach
      if (newDateTime) {
        const targetDate = new Date(newDateTime);
        const baseDate = outreachDateTime ? new Date(outreachDateTime) : new Date();
        
        // Calculate cumulative days already in schedule
        const existingCumulativeDays = value.reduce((sum, d) => sum + d, 0);
        const lastReminderDate = new Date(baseDate);
        lastReminderDate.setDate(lastReminderDate.getDate() + existingCumulativeDays);
        
        // Calculate days from last reminder (or outreach if no reminders)
        const diffTime = targetDate.getTime() - lastReminderDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          onChange([...value, diffDays]);
          setNewDateTime('');
        }
      }
    }
  };

  const removeReminder = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const updateReminder = (index: number, days: number) => {
    if (days > 0) {
      const updated = [...value];
      updated[index] = days;
      onChange(updated);
    }
  };

  const updateReminderFromDateTime = (index: number) => {
    if (!editDateTime) return;
    
    const targetDate = new Date(editDateTime);
    const baseDate = outreachDateTime ? new Date(outreachDateTime) : new Date();
    
    // Calculate cumulative days up to the previous reminder
    const previousCumulativeDays = value.slice(0, index).reduce((sum, d) => sum + d, 0);
    const previousDate = new Date(baseDate);
    previousDate.setDate(previousDate.getDate() + previousCumulativeDays);
    
    // Calculate days from previous reminder date
    const diffTime = targetDate.getTime() - previousDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      const updated = [...value];
      updated[index] = diffDays;
      onChange(updated);
    }
    
    setEditingIndex(null);
    setEditDateTime('');
  };

  // Calculate cumulative days for display
  const getCumulativeDays = (index: number): number => {
    return value.slice(0, index + 1).reduce((sum, d) => sum + d, 0);
  };

  // Calculate the actual date for a reminder
  const getReminderDate = (index: number): Date => {
    const baseDate = outreachDateTime ? new Date(outreachDateTime) : new Date();
    const cumulativeDays = getCumulativeDays(index);
    const reminderDate = new Date(baseDate);
    reminderDate.setDate(reminderDate.getDate() + cumulativeDays);
    return reminderDate;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startEditingWithDateTime = (index: number) => {
    const reminderDate = getReminderDate(index);
    const localDateTime = new Date(reminderDate.getTime() - reminderDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditDateTime(localDateTime);
    setEditingIndex(index);
  };

  return (
    <div className="space-y-3">
      <Label>Reminder Schedule</Label>
      
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reminders scheduled. Add one below.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((days, index) => (
            <div key={index} className="flex items-center gap-2 flex-wrap">
              {editingIndex === index ? (
                // Editing mode with datetime picker
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="datetime-local"
                    value={editDateTime}
                    onChange={(e) => setEditDateTime(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateReminderFromDateTime(index)}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingIndex(null);
                      setEditDateTime('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                // Display mode
                <>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {index === 0 ? (
                      <span className="text-sm text-muted-foreground min-w-[80px] shrink-0">
                        Remind in
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground min-w-[80px] shrink-0">
                        Then after
                      </span>
                    )}
                    <Input
                      type="number"
                      min="1"
                      value={days}
                      onChange={(e) => updateReminder(index, parseInt(e.target.value, 10))}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">
                      days
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(getReminderDate(index))}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditingWithDateTime(index)}
                      className="h-7 w-7"
                      title="Edit with date picker"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeReminder(index)}
                      className="h-7 w-7"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new reminder section */}
      <div className="space-y-2 pt-2 border-t">
        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={addMode === 'days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAddMode('days')}
            className="gap-1"
          >
            <Clock className="h-3.5 w-3.5" />
            Days
          </Button>
          <Button
            type="button"
            variant={addMode === 'datetime' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setAddMode('datetime');
              if (!newDateTime) {
                setNewDateTime(getDefaultDateTime());
              }
            }}
            className="gap-1"
          >
            <Calendar className="h-3.5 w-3.5" />
            Specific Date
          </Button>
        </div>

        {/* Input based on mode */}
        {addMode === 'days' ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              value={newDays}
              onChange={(e) => setNewDays(e.target.value)}
              placeholder="Days"
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">days</span>
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
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="datetime-local"
              value={newDateTime}
              onChange={(e) => setNewDateTime(e.target.value)}
              className="flex-1"
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
        )}
      </div>
    </div>
  );
}
