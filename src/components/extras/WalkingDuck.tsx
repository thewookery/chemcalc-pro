
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const DuckSVG: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12 md:w-16 md:h-16">
    {/* Body: Made more rounded, added a slight tail flick */}
    <path 
      fill="#FFD700" 
      stroke="#B28900" 
      strokeWidth="3" 
      d="M15,75 
         Q20,50 40,60 
         T65,60 
         Q85,50 90,70 
         Q100,80 80,90 
         C70,95 60,93 50,90 
         C40,93 30,95 20,90 
         Q0,80 15,75 Z" 
    />
    {/* Head */}
    <circle fill="#FFD700" stroke="#B28900" strokeWidth="3" cx="80" cy="45" r="15" />
    {/* New Eyes 👀 style */}
    <circle fill="#FFFFFF" cx="76" cy="43" r="4.5" />
    <circle fill="#000000" cx="77" cy="43" r="2.2" /> 
    <circle fill="#FFFFFF" cx="86" cy="43" r="4.5" />
    <circle fill="#000000" cx="87" cy="43" r="2.2" />
    {/* Beak */}
    <polygon fill="#FFA500" stroke="#B28900" strokeWidth="1.5" points="93,43 103,48 93,53" />
    {/* Simple static feet for a tiny duck */}
    <rect fill="#FFA500" stroke="#B28900" strokeWidth="1" x="35" y="88" width="10" height="7" rx="2"/>
    <rect fill="#FFA500" stroke="#B28900" strokeWidth="1" x="60" y="88" width="10" height="7" rx="2"/>
  </svg>
);

interface PeekPosition {
  id: string;
  positionClasses: string;
  hiddenTransform: string;
  visibleTransform: string;
}

const PEEK_TRANSITION_DURATION = 500; // ms
const PEEK_VISIBLE_DURATION = 1500; // ms

const peekPositions: PeekPosition[] = [
  { id: 'BL', positionClasses: 'bottom-0 left-4', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[70%]' },
  { id: 'BC', positionClasses: 'bottom-0 left-1/2 -translate-x-1/2', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[70%]' },
  { id: 'BR', positionClasses: 'bottom-0 right-4', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[70%]' },
  { id: 'ML', positionClasses: 'top-1/2 left-0 -translate-y-1/2', hiddenTransform: '-translate-x-full', visibleTransform: '-translate-x-[70%]' },
  { id: 'MR', positionClasses: 'top-1/2 right-0 -translate-y-1/2', hiddenTransform: 'translate-x-full', visibleTransform: 'translate-x-[70%]' },
  { id: 'TL', positionClasses: 'top-0 left-4', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[70%]' },
  { id: 'TC', positionClasses: 'top-0 left-1/2 -translate-x-1/2', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[70%]' },
  { id: 'TR', positionClasses: 'top-0 right-4', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[70%]' },
];


const PeekingDuck: React.FC = () => {
  const [isGloballyVisible, setIsGloballyVisible] = useState(false);
  const [currentPositionClasses, setCurrentPositionClasses] = useState<string>('');
  const [currentTransform, setCurrentTransform] = useState<string>('translate-y-full'); // Default to hidden off-screen

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const initialDelayTimer = setTimeout(() => {
      setIsGloballyVisible(true);
    }, 5000);
    timeoutsRef.current.push(initialDelayTimer);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!isGloballyVisible) return;

    let isMounted = true;

    const clearCurrentTimeouts = () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
    
    const schedulePeek = () => {
      if (!isMounted) return;
      clearCurrentTimeouts(); // Clear any pending timeouts before scheduling new ones

      const nextPeekDelay = Math.random() * 7000 + 3000; // 3-10 seconds

      const peekTimer = setTimeout(() => {
        if (!isMounted) return;

        const randomIndex = Math.floor(Math.random() * peekPositions.length);
        const newPosition = peekPositions[randomIndex];

        setCurrentPositionClasses(newPosition.positionClasses);
        setCurrentTransform(newPosition.hiddenTransform); // Ensure it's in hidden state for the new position

        // Brief delay for styles to apply, then start "peek in"
        const animationStartTimer = setTimeout(() => {
          if (!isMounted) return;
          setCurrentTransform(newPosition.visibleTransform);
        }, 50); // Small delay
        timeoutsRef.current.push(animationStartTimer);

        // Timer for how long the duck stays visible
        const visibleDurationTimer = setTimeout(() => {
          if (!isMounted) return;
          setCurrentTransform(newPosition.hiddenTransform); // "Peek out"

          // Timer for "peek out" animation to complete, then schedule next peek
          const nextCycleTimer = setTimeout(() => {
            if (!isMounted) return;
            schedulePeek();
          }, PEEK_TRANSITION_DURATION);
          timeoutsRef.current.push(nextCycleTimer);

        }, PEEK_VISIBLE_DURATION + 50); // +50 to account for animationStartTimer
        timeoutsRef.current.push(visibleDurationTimer);

      }, nextPeekDelay);
      timeoutsRef.current.push(peekTimer);
    };

    schedulePeek();

    return () => {
      isMounted = false;
      clearCurrentTimeouts();
    };
  }, [isGloballyVisible]);

  if (!isGloballyVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed z-[9999] transition-transform ease-in-out",
        currentPositionClasses,
        currentTransform
      )}
      style={{ transitionDuration: `${PEEK_TRANSITION_DURATION}ms` }}
      aria-hidden="true"
    >
      <DuckSVG />
    </div>
  );
};

export default PeekingDuck;
