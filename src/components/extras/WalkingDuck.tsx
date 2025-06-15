
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DuckSVGProps {
  rotationAngle?: number;
}

// SVG for a mallard-like head with "👀" eyes, neck ring, and a black bucket hat, with rotation
const DuckSVG: React.FC<DuckSVGProps> = ({ rotationAngle = 0 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 42" className="w-12 h-12 md:w-16 md:h-16">
    <g transform={`rotate(${rotationAngle} 24 21)`}>
      {/* Hat Brim - Drawn first so head is on top of back part of brim */}
      <ellipse cx="23" cy="6" rx="20" ry="5" fill="#000000" stroke="#222222" strokeWidth="1.2" />
      
      {/* Head (Green Ellipse) */}
      <ellipse cx="23" cy="19" rx="16" ry="14" fill="#008060" stroke="#004D38" strokeWidth="1.5" />
      
      {/* White Neck Ring */}
      <path 
        d="M12,30 Q23,34 34,30 A16,14 0 0,0 12,30 Z"
        fill="#FFFFFF" 
        stroke="#E0E0E0" 
        strokeWidth="1"
      />
      {/* Cover the top part of the neck ring that overlaps with the head to refine the shape */}
      <ellipse cx="23" cy="19" rx="16" ry="14" fill="none" stroke="#008060" strokeWidth="3.5" />

      {/* Beak (Yellow Polygon) */}
      <polygon points="34,15 46,17 46,23 34,25" fill="#FFCC00" stroke="#B28900" strokeWidth="1" />
      {/* Beak line detail */}
      <line x1="34" y1="20" x2="45" y2="20" stroke="#B28900" strokeWidth="0.7" />
      {/* Nostril (Dark spot on beak) */}
      <circle cx="43" cy="18.5" r="1.2" fill="#555555" />

      {/* Eyes (Emoji Style "👀") - Placed on the head */}
      {/* Right Eye */}
      <circle fill="#FFFFFF" cx="29" cy="17" r="4.5" />
      <circle fill="#000000" cx="30" cy="17" r="2.2" /> 
      {/* Left Eye */}
      <circle fill="#FFFFFF" cx="20" cy="17" r="4.5" />
      <circle fill="#000000" cx="21" cy="17" r="2.2" />

      {/* Bucket Hat Crown - Drawn after head for correct layering of front part of brim */}
      <ellipse cx="23" cy="0" rx="14" ry="7" fill="#000000" stroke="#222222" strokeWidth="1.2" />
      {/* Line detail on hat crown */}
      <path d="M13 0 Q23 -3 33 0" stroke="#222222" strokeWidth="0.8" fill="none" />
    </g>
  </svg>
);


interface PeekPosition {
  id: string;
  positionClasses: string;
  hiddenTransform: string;
  visibleTransform: string;
  rotation: number;
}

const PEEK_TRANSITION_DURATION = 500; // ms
const PEEK_VISIBLE_DURATION = 1500; // ms

const peekPositions: PeekPosition[] = [
  { id: 'BL', positionClasses: 'bottom-0 left-4', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[10%]', rotation: -45 },
  { id: 'BC', positionClasses: 'bottom-0 left-1/2 -translate-x-1/2', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[10%]', rotation: -90 },
  { id: 'BR', positionClasses: 'bottom-0 right-4', hiddenTransform: 'translate-y-full', visibleTransform: 'translate-y-[10%]', rotation: -135 },
  { id: 'ML', positionClasses: 'top-1/2 left-0 -translate-y-1/2', hiddenTransform: '-translate-x-full', visibleTransform: '-translate-x-[10%]', rotation: 0 },
  { id: 'MR', positionClasses: 'top-1/2 right-0 -translate-y-1/2', hiddenTransform: 'translate-x-full', visibleTransform: 'translate-x-[10%]', rotation: 180 },
  { id: 'TL', positionClasses: 'top-0 left-4', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[10%]', rotation: 45  },
  { id: 'TC', positionClasses: 'top-0 left-1/2 -translate-x-1/2', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[10%]', rotation: 90  },
  { id: 'TR', positionClasses: 'top-0 right-4', hiddenTransform: '-translate-y-full', visibleTransform: '-translate-y-[10%]', rotation: 135 },
];


const PeekingDuck: React.FC = () => {
  const [isGloballyVisible, setIsGloballyVisible] = useState(false);
  const [currentPositionClasses, setCurrentPositionClasses] = useState<string>(peekPositions[0].positionClasses);
  const [currentTransform, setCurrentTransform] = useState<string>(peekPositions[0].hiddenTransform);
  const [currentRotation, setCurrentRotation] = useState<number>(peekPositions[0].rotation);

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
        const newPositionData = peekPositions[randomIndex];

        setCurrentPositionClasses(newPositionData.positionClasses);
        setCurrentRotation(newPositionData.rotation);
        setCurrentTransform(newPositionData.hiddenTransform); 

        const animationStartTimer = setTimeout(() => {
          if (!isMounted) return;
          requestAnimationFrame(() => { // Ensure prior styles are applied before animating
            if (!isMounted) return;
            setCurrentTransform(newPositionData.visibleTransform);
          });
        }, 50); 
        timeoutsRef.current.push(animationStartTimer);

        const visibleDurationTimer = setTimeout(() => {
          if (!isMounted) return;
          setCurrentTransform(newPositionData.hiddenTransform); 

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
        currentPositionClasses
      )}
      style={{ 
        transform: currentTransform,
        transitionDuration: `${PEEK_TRANSITION_DURATION}ms` 
      }}
      aria-hidden="true"
    >
      <DuckSVG rotationAngle={currentRotation} />
    </div>
  );
};

export default PeekingDuck;
