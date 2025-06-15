
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CalculatorMeta } from '@/types';
import { ArrowRight, Beaker, Percent, FlaskConical, Thermometer, Contrast, Sigma, Weight, Scaling, Pipette, FilePlus, Layers, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';

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
  
  const [cardGlitchStyle, setCardGlitchStyle] = useState<React.CSSProperties>({});
  const [glitchAnimationCount, setGlitchAnimationCount] = useState(0);

  const rainbowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firstGlitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const secondGlitchCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Icon Float Animation Delay
    const minFloatDelaySec = 25;
    const maxFloatDelaySec = 40;
    const floatAnimationDurationVariation = maxFloatDelaySec - minFloatDelaySec;
    const initialFloatDelaySec = Math.random() * floatAnimationDurationVariation + minFloatDelaySec;
    setIconFloatStyle({ animationDelay: `${initialFloatDelaySec.toFixed(2)}s` });

    // Rainbow Animation Logic
    const rainbowProbability = 0.01; 
    const shouldAttemptRainbow = Math.random() < rainbowProbability;
    if (shouldAttemptRainbow) {
      const delayForRainbowToStartAfterFloatMs = 20 * 1000;
      const totalDelayForRainbowMs = (initialFloatDelaySec * 1000) + delayForRainbowToStartAfterFloatMs;
      
      if (rainbowTimeoutRef.current) clearTimeout(rainbowTimeoutRef.current);
      rainbowTimeoutRef.current = setTimeout(() => {
        setCanStartRainbow(true);
      }, totalDelayForRainbowMs);
    }

    // Glitch Animation Logic
    const initialMinGlitchDelayMs = 10000; // 10 seconds base
    const randomAdditionalGlitchMs = Math.random() * 10000; // 0 to 10 seconds additional
    const actualInitialGlitchDelayMs = initialMinGlitchDelayMs + randomAdditionalGlitchMs;
    const glitchDurationMs = 250; // Duration of the glitch animation

    setCardGlitchStyle({ animationDelay: `${actualInitialGlitchDelayMs / 1000}s` });
    setGlitchAnimationCount(1); // Trigger the first animation

    const checkForSecondGlitch = () => {
      if (secondGlitchCheckTimerRef.current) clearTimeout(secondGlitchCheckTimerRef.current);
      secondGlitchCheckTimerRef.current = setTimeout(() => {
        const secondGlitchProbability = 0.20; // 1/5 chance
        if (Math.random() < secondGlitchProbability) {
          setCardGlitchStyle({ animationDelay: '0s' }); // Second glitch plays immediately
          setGlitchAnimationCount(prevCount => prevCount + 1); // Re-trigger by changing key
        }
        // No further recursive checks for more glitches based on current request
      }, 5000); // 5-second pause
    };
    
    if (firstGlitchTimerRef.current) clearTimeout(firstGlitchTimerRef.current);
    firstGlitchTimerRef.current = setTimeout(() => {
      checkForSecondGlitch();
    }, actualInitialGlitchDelayMs + glitchDurationMs); // Schedule check after first glitch + its duration

    return () => {
      if (rainbowTimeoutRef.current) clearTimeout(rainbowTimeoutRef.current);
      if (firstGlitchTimerRef.current) clearTimeout(firstGlitchTimerRef.current);
      if (secondGlitchCheckTimerRef.current) clearTimeout(secondGlitchCheckTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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
          <CardTitle 
            key={`glitch-title-${glitchAnimationCount}`}
            className={cn(
              "text-lg font-semibold",
              glitchAnimationCount > 0 && 'animate-glitch'
            )}
            style={cardGlitchStyle}
          >
            {calculator.name}
          </CardTitle>
          <CardDescription className="text-sm">{calculator.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default CalculatorCard;
