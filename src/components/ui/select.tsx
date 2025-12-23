"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
     value: string;
     onValueChange: (value: string) => void;
     children: React.ReactNode;
     className?: string;
}

interface SelectContextValue {
     value: string;
     onValueChange: (value: string) => void;
     open: boolean;
     setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(
     undefined
);

export function Select({
     value,
     onValueChange,
     children,
     className,
}: SelectProps) {
     const [open, setOpen] = React.useState(false);

     return (
          <SelectContext.Provider
               value={{ value, onValueChange, open, setOpen }}
          >
               <div className={cn("relative", className)}>{children}</div>
          </SelectContext.Provider>
     );
}

interface SelectTriggerProps {
     children: React.ReactNode;
     className?: string;
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
     const context = React.useContext(SelectContext);
     if (!context) throw new Error("SelectTrigger must be used within Select");

     return (
          <button
               type="button"
               onClick={() => context.setOpen(!context.open)}
               className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
               )}
          >
               {children}
               <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
     );
}

interface SelectContentProps {
     children: React.ReactNode;
     className?: string;
}

export function SelectContent({ children, className }: SelectContentProps) {
     const context = React.useContext(SelectContext);
     if (!context) throw new Error("SelectContent must be used within Select");

     React.useEffect(() => {
          if (!context.open) return;
          
          const handleClickOutside = (event: MouseEvent) => {
               const target = event.target as Element;
               if (
                    !target.closest(".select-container") &&
                    !target.closest('[role="button"]')
               ) {
                    context.setOpen(false);
               }
          };
          document.addEventListener("mousedown", handleClickOutside);
          return () => document.removeEventListener("mousedown", handleClickOutside);
     }, [context.open, context]);

     if (!context.open) return null;

     return (
          <div
               className={cn(
                    "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md select-container",
                    className
               )}
          >
               <div className="p-1">{children}</div>
          </div>
     );
}

interface SelectItemProps {
     value: string;
     children: React.ReactNode;
     className?: string;
     disabled?: boolean;
}

export function SelectItem({ value, children, className, disabled }: SelectItemProps) {
     const context = React.useContext(SelectContext);
     if (!context) throw new Error("SelectItem must be used within Select");

     return (
          <div
               onClick={() => {
                    if (disabled) return;
                    context.onValueChange(value);
                    context.setOpen(false);
               }}
               className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    context.value === value && "bg-accent",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                    className
               )}
          >
               {children}
          </div>
     );
}

