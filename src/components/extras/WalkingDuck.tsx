
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Updated SVG for a more detailed mallard-like head with "👀" eyes, neck ring, and a larger, better-positioned bucket hat
const DuckSVG: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 42" className="w-12 h-12 md:w-16 md:h-16">
    {/* Head (Green Ellipse) */}
    <ellipse cx="23" cy="22" rx="16" ry="14" fill="#008060" stroke="#004D38" strokeWidth="1.5" />
    
    {/* White Neck Ring */}
    <path 
      d="M12,33 Q23,37 34,33 A16,14 0 0,0 12,33 Z"
      fill="#FFFFFF" 
      stroke="#E0E0E0" 
      strokeWidth="1"
    />
    {/* Cover the top part of the neck ring that overlaps with the head to refine the shape */}
    <ellipse cx="23" cy="22" rx="16" ry="14" fill="none" stroke="#008060" strokeWidth="3.5" />

    {/* Beak (Yellow Polygon) */}
    <polygon points="34,18 46,20 46,26 34,28" fill="#FFCC00" stroke="#B28900" strokeWidth="1" />
    {/* Beak line detail */}
    <line x1="34" y1="23" x2="45" y2="23" stroke="#B28900" strokeWidth="0.7" />
    {/* Nostril (Dark spot on beak) */}
    <circle cx="43" cy="21.5" r="1.2" fill="#555555" />

    {/* Eyes (Emoji Style "👀") - Placed on the head */}
    {/* Right Eye */}
    <circle fill="#FFFFFF" cx="29" cy="20" r="4.5" />
    <circle fill="#000000" cx="30" cy="20" r="2.2" /> 
    {/* Left Eye */}
    <circle fill="#FFFFFF" cx="20" cy="20" r="4.5" />
    <circle fill="#000000" cx="21" cy="20" r="2.2" />

    {/* Bucket Hat - Made larger and positioned higher, drawn last to be on top */}
    {/* Hat Crown */}
    <ellipse cx="23" cy="10" rx="14" ry="7" fill="#D2B48C" stroke="#A0522D" strokeWidth="1.2" />
    {/* Hat Brim */}
    <ellipse cx="23" cy="16" rx="20" ry="5" fill="#D2B48C" stroke="#A0522D" strokeWidth="1.2" />
    {/* Line detail on hat crown */}
    <path d="M13 10 Q23 7 33 10" stroke="#A0522D" strokeWidth="0.8" fill="none" />
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

// Adjusted visibleTransforms to show ~90% of the head
const peekPositions: PeekPosition[] = [
  { id: 'BL', positionClasses: 'bottom-0 left-4', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[10%]' },
  { id: 'BC', positionClasses: 'bottom-0 left-1/2 -translate-x-1/2', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[10%]' },
  { id: 'BR', positionClasses: 'bottom-0 right-4', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[10%]' },
  { id: 'ML', positionClasses: 'top-1/2 left-0 -translate-y-1/2', hiddenTransform: '-translate-x-full', visibleTransform: '-translate-x-[10%]' },
  { id: 'MR', positionClasses: 'top-1/2 right-0 -translate-y-1/2', hiddenTransform: 'translate-x-full', visibleTransform: 'translate-x-[10%]' },
  { id: 'TL', positionClasses: 'top-0 left-4', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[10%]' },
  { id: 'TC', positionClasses: 'top-0 left-1/2 -translate-x-1/2', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[10%]' },
  { id: 'TR', positionClasses: 'top-0 right-4', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[10%]' },
];


const PeekingDuck: React.FC = () => {
  const [isGloballyVisible, setIsGloballyVisible] = useState(false);
  const [currentPositionClasses, setCurrentPositionClasses] = useState<string>(peekPositions[0].positionClasses);
  const [currentTransform, setCurrentTransform] = useState<string>(peekPositions[0].hiddenTransform);

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
      clearCurrentTimeouts(); 

      const nextPeekDelay = Math.random() * 7000 + 3000; 

      const peekTimer = setTimeout(() => {
        if (!isMounted) return;

        const randomIndex = Math.floor(Math.random() * peekPositions.length);
        const newPosition = peekPositions[randomIndex];

        setCurrentPositionClasses(newPosition.positionClasses);
        setCurrentTransform(newPosition.hiddenTransform); 

        const animationStartTimer = setTimeout(() => {
          if (!isMounted) return;
          setCurrentTransform(newPosition.visibleTransform);
        }, 50); 
        timeoutsRef.current.push(animationStartTimer);

        const visibleDurationTimer = setTimeout(() => {
          if (!isMounted) return;
          setCurrentTransform(newPosition.hiddenTransform); 

          const nextCycleTimer = setTimeout(() => {
            if (!isMounted) return;
            schedulePeek();
          }, PEEK_TRANSITION_DURATION);
          timeoutsRef.current.push(nextCycleTimer);

        }, PEEK_VISIBLE_DURATION + 50); 
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
