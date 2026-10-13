"use client";

import React, { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Copy, Check, HelpCircle, ArrowLeft, ArrowUpDown, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VoiceAssistant from './VoiceAssistant';
import { CALCULATORS, CATEGORIES } from '@/lib/calculators';
import { LiveBridgeDialog } from '@/components/bridge/LiveBridgeDialog';

interface CalculatorWrapperProps {
  title: string;
  description?: string;
  formula?: string;
  formulaTooltip?: string;
  children: ReactNode;
  resultsToCopy?: string | (() => string);
  voiceConfig?: { id: string; label: string; onUpdate: (val: string) => void }[];
  voiceResultText?: string;
  onShareSnapshot?: () => string;
}

const CalculatorWrapper: React.FC<CalculatorWrapperProps> = ({
  title,
  description,
  formula,
  formulaTooltip,
  children,
  resultsToCopy,
  voiceConfig,
  voiceResultText,
  onShareSnapshot,
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [copiedResults, setCopiedResults] = useState(false);
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);

  const handleCopyToClipboard = () => {
    if (!resultsToCopy) return;
    const textToCopy = typeof resultsToCopy === 'function' ? resultsToCopy() : resultsToCopy;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopiedResults(true);
        toast({
          title: "Copied to clipboard!",
          description: "Calculation results copied.",
        });
        setTimeout(() => setCopiedResults(false), 2000);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not copy results to clipboard.",
          variant: "destructive",
        });
      });
  };

  const handleShareSnapshot = () => {
    if (!onShareSnapshot) return;
    const url = onShareSnapshot();
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSnapshot(true);
      toast({
        title: "Share Link Generated!",
        description: "Anyone opening this link will see your exact inputs pre-filled.",
      });
      setTimeout(() => setCopiedSnapshot(false), 2500);
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-slideUp">
      {/* Top Navigation & Quick Switcher Bar */}
      <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            <span>All Calculators</span>
          </Link>
        </Button>

        {/* Co-Pilot Bridge & Quick Switcher */}
        <div className="flex items-center gap-2">
          <LiveBridgeDialog />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>Switch Tool</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              {CATEGORIES.filter((c) => c !== 'All').map((category) => {
                const items = CALCULATORS.filter((c) => c.category === category);
                if (items.length === 0) return null;
                return (
                  <React.Fragment key={category}>
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </DropdownMenuLabel>
                    {items.map((item) => (
                      <DropdownMenuItem
                        key={item.slug}
                        onClick={() => router.push(`/${item.slug}`)}
                        className="text-xs cursor-pointer"
                      >
                        {item.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </React.Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Calculator Card */}
      <Card className="w-full shadow-lg overflow-hidden border-border/80">
        <CardHeader className="relative pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 pr-12">
              <CardTitle className="text-2xl font-headline tracking-tight">{title}</CardTitle>
              {description && <CardDescription className="text-sm">{description}</CardDescription>}
            </div>
            {voiceConfig && (
              <div className="absolute top-6 right-6">
                <VoiceAssistant fields={voiceConfig} resultToRead={voiceResultText} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">{children}</CardContent>

        {(formula || resultsToCopy || onShareSnapshot) && (
          <CardFooter className="flex flex-col items-start gap-4 pt-5 border-t bg-muted/20">
            {formula && (
              <div className="text-sm text-muted-foreground w-full">
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
                <code className="block mt-1 p-2 bg-muted rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {formula}
                </code>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {resultsToCopy && (
                <Button onClick={handleCopyToClipboard} variant="outline" size="sm" className="gap-2">
                  {copiedResults ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedResults ? "Copied" : "Copy Results"}</span>
                </Button>
              )}

              {onShareSnapshot && (
                <Button onClick={handleShareSnapshot} variant="outline" size="sm" className="gap-2">
                  {copiedSnapshot ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
                  <span>{copiedSnapshot ? "Link Copied!" : "Share Snapshot Link"}</span>
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default CalculatorWrapper;
