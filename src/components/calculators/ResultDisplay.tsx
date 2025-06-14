"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultDisplayProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  variant?: 'default' | 'highlight';
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  label,
  value,
  unit,
  isLoading = false,
  isError = false,
  errorMessage = "Error",
  variant = 'default',
}) => {
  let displayValue: string;

  if (isLoading) {
    displayValue = "Calculating...";
  } else if (isError) {
    displayValue = errorMessage;
  } else if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    displayValue = "-";
  } else {
    // Attempt to format to a reasonable number of decimal places if it's a number
    const numValue = Number(value);
    displayValue = Number.isFinite(numValue) ? numValue.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value);
  }

  return (
    <div className={`p-4 rounded-md ${variant === 'highlight' ? 'bg-primary/10' : 'bg-muted/50'}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${isError ? 'text-destructive' : (variant === 'highlight' ? 'text-primary' : 'text-foreground')}`}>
        {displayValue} {unit && displayValue !== "-" && !isLoading && !isError ? unit : ""}
      </p>
    </div>
  );
};

export default ResultDisplay;
