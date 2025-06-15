
"use client";

import React from 'react';

interface ResultDisplayProps {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  variant?: 'default' | 'highlight';
  valueClassName?: string; // New prop for custom value styling
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  label,
  value,
  unit,
  isLoading = false,
  isError = false,
  errorMessage = "Error",
  variant = 'default',
  valueClassName,
}) => {
  let displayValue: string;

  if (isLoading) {
    displayValue = "Calculating...";
  } else if (isError) {
    displayValue = errorMessage;
  } else if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    displayValue = "-";
  } else {
    const numValue = Number(value);
    displayValue = Number.isFinite(numValue) ? numValue.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value);
  }

  const determinedValueClassName = isError 
    ? 'text-destructive' 
    : valueClassName 
      ? valueClassName 
      : (variant === 'highlight' ? 'text-primary' : 'text-foreground');

  return (
    <div className={`p-4 rounded-md ${variant === 'highlight' ? 'bg-primary/10' : 'bg-muted/50'}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold ${determinedValueClassName}`}>
        {displayValue} {unit && displayValue !== "-" && !isLoading && !isError ? unit : ""}
      </p>
    </div>
  );
};

export default ResultDisplay;
