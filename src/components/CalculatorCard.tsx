
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CalculatorMeta } from '@/types';
import { ArrowRight, Beaker, Percent, FlaskConical, Thermometer, Contrast, Sigma, Weight, Scaling, Pipette, FilePlus, Layers, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';

interface CalculatorCardProps {
  calculator: CalculatorMeta;
}

const iconMap: { [key: string]: React.ElementType } = {
  Beaker,
  Percent,
  FlaskConical,
  Thermometer,
  Contrast,
  Sigma,
  Weight,
  Scaling,
  Pipette,
  FilePlus,
  Layers,
  HelpCircle, // Default/fallback icon
};

const CalculatorCard: React.FC<CalculatorCardProps> = ({ calculator }) => {
  const IconComponent = calculator.icon ? iconMap[calculator.icon] || iconMap['HelpCircle'] : iconMap['HelpCircle'];
  const [iconFloatStyle, setIconFloatStyle] = useState<React.CSSProperties>({});
  const [canStartRainbow, setCanStartRainbow] = useState(false);

  useEffect(() => {
    // Calculate random delay for the float animation (25s to 40s)
    const minFloatDelay = 25; // seconds
    const maxFloatDelay = 40; // seconds
    const initialFloatDelaySec = Math.random() * (maxFloatDelay - minFloatDelay) + minFloatDelay;
    setIconFloatStyle({ animationDelay: `${initialFloatDelaySec.toFixed(2)}s` });

    // Determine if this icon gets a chance to have the rainbow animation
    const rainbowProbability = 0.2; // 20% chance
    const shouldAttemptRainbow = Math.random() < rainbowProbability;

    let rainbowTimerId: NodeJS.Timeout;

    if (shouldAttemptRainbow) {
      // Schedule rainbow fade to start 20 seconds after the float animation begins
      // The total delay from mount is initialFloatDelaySec (for float to start) + 20s (wait time)
      const totalDelayForRainbowMs = (initialFloatDelaySec + 20) * 1000;
      
      rainbowTimerId = setTimeout(() => {
        setCanStartRainbow(true);
      }, totalDelayForRainbowMs);
    }

    return () => {
      if (shouldAttemptRainbow) {
        clearTimeout(rainbowTimerId); // Cleanup timer on unmount
      }
    };
  }, []); // Empty dependency array, runs once on mount

  return (
    <Link href={`/${calculator.slug}`} className="group block" aria-label={`Open ${calculator.name} calculator`}>
      <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 animate-fadeIn">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            {IconComponent && (
              <IconComponent
                className={cn(
                  "h-8 w-8 text-primary transition-transform duration-300 ease-in-out animate-icon-float",
                  "group-hover:scale-110 group-hover:rotate-3 group-hover:animate-none",
                  canStartRainbow && "animate-rainbow-fade"
                )}
                style={iconFloatStyle} 
              />
            )}
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">{calculator.name}</CardTitle>
          <CardDescription className="text-sm">{calculator.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default CalculatorCard;

