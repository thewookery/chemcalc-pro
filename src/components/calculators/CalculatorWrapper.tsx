"use client";

import React, { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalculatorWrapperProps {
  title: string;
  description?: string;
  formula?: string;
  formulaTooltip?: string;
  children: ReactNode;
  resultsToCopy?: string | (() => string);
}

const CalculatorWrapper: React.FC<CalculatorWrapperProps> = ({
  title,
  description,
  formula,
  formulaTooltip,
  children,
  resultsToCopy,
}) => {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    if (!resultsToCopy) return;
    const textToCopy = typeof resultsToCopy === 'function' ? resultsToCopy() : resultsToCopy;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast({
          title: "Copied to clipboard!",
          description: "The results have been copied.",
        });
      })
      .catch(err => {
        console.error("Failed to copy: ", err);
        toast({
          title: "Error",
          description: "Could not copy results to clipboard.",
          variant: "destructive",
        });
      });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto animate-slideUp shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
      {(formula || resultsToCopy) && (
        <CardFooter className="flex flex-col items-start gap-4 pt-6 border-t">
          {formula && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <strong>Formula:</strong>
                {formulaTooltip && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Formula details" className="p-0.5">
                          <HelpCircle className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{formulaTooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <code className="block mt-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
            </div>
          )}
          {resultsToCopy && (
            <Button onClick={handleCopyToClipboard} variant="outline" size="sm">
              <Copy className="mr-2 h-4 w-4" />
              Copy Results
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default CalculatorWrapper;
