"use client";

import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface CommonInputProps extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'id'> {
  label: string;
  id: string;
  tooltipText?: string;
  unit?: string;
  errorMessage?: string;
}

const CommonInput = React.forwardRef<HTMLInputElement, CommonInputProps>(
  ({ label, id, tooltipText, unit, className, errorMessage, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className={cn("text-sm font-medium", errorMessage && "text-destructive")}>
            {label} {unit && <span className="text-xs text-muted-foreground">({unit})</span>}
          </Label>
          {tooltipText && (
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button type="button" aria-label={`Info for ${label}`} className="p-0.5 text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" align="end">
                  <p className="max-w-xs">{tooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Input
          id={id}
          ref={ref}
          type="number"
          className={cn(
            "calculator-input text-input-foreground", // Applies bright blue border from globals.css
            errorMessage && "border-destructive focus-visible:ring-destructive",
            className
          )}
          step="any"
          {...props}
        />
        {errorMessage && <p className="text-xs text-destructive mt-1">{errorMessage}</p>}
      </div>
    );
  }
);
CommonInput.displayName = "CommonInput";

export default CommonInput;
