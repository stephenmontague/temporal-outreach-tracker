'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface ReminderScheduleInputProps {
  value: number[];
  onChange: (schedule: number[]) => void;
}

export function ReminderScheduleInput({ value, onChange }: ReminderScheduleInputProps) {
  const [newDays, setNewDays] = useState<string>('3');

  const addReminder = () => {
    const days = parseInt(newDays, 10);
    if (days > 0) {
      onChange([...value, days]);
      setNewDays('3');
    }
  };

  const removeReminder = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateReminder = (index: number, days: number) => {
    if (days > 0) {
      const updated = [...value];
      updated[index] = days;
      onChange(updated);
    }
  };

  // Calculate cumulative days for display
  const getCumulativeDays = (index: number): number => {
    return value.slice(0, index + 1).reduce((sum, d) => sum + d, 0);
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
            <div key={index} className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                {index === 0 ? (
                  <span className="text-sm text-muted-foreground min-w-[80px]">
                    Remind in
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground min-w-[80px]">
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
                <span className="text-sm text-muted-foreground">
                  days
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  (day {getCumulativeDays(index)} total)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeReminder(index)}
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
  );
}

