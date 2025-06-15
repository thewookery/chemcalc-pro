
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CalculatorMeta } from '@/types';
import { ArrowRight, Beaker, Percent, FlaskConical, Thermometer, Contrast, Sigma, Weight, Scaling, Pipette, FilePlus, Layers, TestTube2, HelpCircle as DefaultIcon } from 'lucide-react'; // Removed Grain, ensured TestTube2 is present
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
  TestTube2, // Ensured TestTube2 is here
  DefaultIcon,
};

const CalculatorCard: React.FC<CalculatorCardProps> = ({ calculator }) => {
  const IconComponent = calculator.icon ? iconMap[calculator.icon] || iconMap['DefaultIcon'] : iconMap['DefaultIcon'];
  
  const [isClient, setIsClient] = useState(false);
  const [iconFloatStyle, setIconFloatStyle] = useState<React.CSSProperties>({});
  const [isIconFloatAnimationActive, setIsIconFloatAnimationActive] = useState(false);
  const [canStartRainbow, setCanStartRainbow] = useState(false);
  
  const [glitchStyle, setGlitchStyle] = useState<React.CSSProperties>({});
  const [glitchAnimationCount, setGlitchAnimationCount] = useState(0);
  const [shouldAttemptInitialGlitch, setShouldAttemptInitialGlitch] = useState(false);

  const rainbowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iconFloatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const firstGlitchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const secondGlitchCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return; // Don't run animation setup if not on client yet
    }

    // Icon Float Animation
    const minFloatDelaySec = 25;
    const maxFloatDelaySec = 900;
    const floatAnimationDurationVariation = maxFloatDelaySec - minFloatDelaySec;
    const actualIconFloatDelaySec = Math.random() * floatAnimationDurationVariation + minFloatDelaySec;

    setIconFloatStyle({ animationDelay: `${actualIconFloatDelaySec.toFixed(2)}s` });

    if (iconFloatTimeoutRef.current) clearTimeout(iconFloatTimeoutRef.current);
    iconFloatTimeoutRef.current = setTimeout(() => {
      setIsIconFloatAnimationActive(true);

      const rainbowProbability = 0.01; 
      const shouldAttemptRainbow = Math.random() < rainbowProbability;
      if (shouldAttemptRainbow) {
        const delayForRainbowToStartAfterFloatMs = 20 * 1000;
        
        if (rainbowTimeoutRef.current) clearTimeout(rainbowTimeoutRef.current);
        rainbowTimeoutRef.current = setTimeout(() => {
          setCanStartRainbow(true);
        }, delayForRainbowToStartAfterFloatMs);
      }
    }, actualIconFloatDelaySec * 1000);


    // Glitch Animation Logic
    const initialGlitchProbability = 1 / 25; 
    const attemptThisGlitch = Math.random() < initialGlitchProbability;
    setShouldAttemptInitialGlitch(attemptThisGlitch);

    if (attemptThisGlitch) {
      const baseMinGlitchDelayMs = 10000; 
      const randomAdditionalGlitchMs = Math.random() * 10000; 
      const actualInitialGlitchDelayMs = baseMinGlitchDelayMs + randomAdditionalGlitchMs;
      
      setGlitchStyle({ animationDelay: `${actualInitialGlitchDelayMs / 1000}s` });
      
      if (firstGlitchTimerRef.current) clearTimeout(firstGlitchTimerRef.current);
      firstGlitchTimerRef.current = setTimeout(() => {
        setGlitchAnimationCount(1); 

        if (secondGlitchCheckTimerRef.current) clearTimeout(secondGlitchCheckTimerRef.current);
        secondGlitchCheckTimerRef.current = setTimeout(() => {
          const secondGlitchProbability = 0.20; 
          if (Math.random() < secondGlitchProbability) {
            setGlitchStyle({ animationDelay: '0s' }); 
            setGlitchAnimationCount(prevCount => prevCount + 1); 
          }
        }, 5000); 
      }, actualInitialGlitchDelayMs); 
    }

    return () => {
      if (rainbowTimeoutRef.current) clearTimeout(rainbowTimeoutRef.current);
      if (iconFloatTimeoutRef.current) clearTimeout(iconFloatTimeoutRef.current);
      if (firstGlitchTimerRef.current) clearTimeout(firstGlitchTimerRef.current);
      if (secondGlitchCheckTimerRef.current) clearTimeout(secondGlitchCheckTimerRef.current);
    };
  }, [isClient]); // Animation setup effect now depends on isClient

  return (
    <Link href={`/${calculator.slug}`} className="group block" aria-label={`Open ${calculator.name} calculator`}>
      <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 animate-fadeIn">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            {IconComponent && (
              <IconComponent
                className={cn(
                  "h-8 w-8 text-primary transition-transform duration-300 ease-in-out",
                  isIconFloatAnimationActive && "animate-icon-float",
                  canStartRainbow && "animate-rainbow-fade", 
                  "group-hover:scale-110 group-hover:rotate-3 group-hover:animate-none"
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
              glitchAnimationCount > 0 && shouldAttemptInitialGlitch && 'animate-glitch'
            )}
            style={glitchAnimationCount > 0 && shouldAttemptInitialGlitch ? glitchStyle : {}}
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
