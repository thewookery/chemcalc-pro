
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Updated SVG to be a mallard-like head with "👀" eyes
const DuckSVG: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" className="w-12 h-12 md:w-16 md:h-16">
    {/* Head (Green Ellipse) */}
    <ellipse cx="23" cy="18" rx="16" ry="14" fill="#008060" stroke="#004D38" strokeWidth="1.5" />
    
    {/* Beak (Yellow Polygon) */}
    <polygon points="34,14 46,16 46,22 34,24" fill="#FFCC00" stroke="#B28900" strokeWidth="1" />
    
    {/* Beak line detail */}
    <line x1="34" y1="19" x2="45" y2="19" stroke="#B28900" strokeWidth="0.7" />
    
    {/* Nostril (Dark spot on beak) */}
    <circle cx="43" cy="17.5" r="1.2" fill="#555555" />

    {/* Eyes (Emoji Style "👀") */}
    {/* Right Eye */}
    <circle fill="#FFFFFF" cx="29" cy="16" r="4.5" />
    <circle fill="#000000" cx="30" cy="16" r="2.2" /> 
    {/* Left Eye */}
    <circle fill="#FFFFFF" cx="20" cy="16" r="4.5" />
    <circle fill="#000000" cx="21" cy="16" r="2.2" />
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
  // Initialize with the first peek position to avoid undefined initial placement
  const [currentPositionClasses, setCurrentPositionClasses] = useState<string>(peekPositions[0].positionClasses);
  const [currentTransform, setCurrentTransform] = useState<string>(peekPositions[0].hiddenTransform);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    const initialDelayTimer = setTimeout(() => {
      setIsGloballyVisible(true);
    }, 5000); // 5 seconds
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

      const nextPeekDelay = Math.random() * 7000 + 3000; // 3-10 seconds

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
