
"use client";
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const DuckSVG: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8 md:w-10 md:h-10">
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
    {/* Eye */}
    <circle fill="#000000" cx="83" cy="42" r="2" />
    {/* Beak */}
    <polygon fill="#FFA500" stroke="#B28900" strokeWidth="1.5" points="93,43 103,48 93,53" />
    {/* Simple static feet for a tiny duck */}
    <rect fill="#FFA500" stroke="#B28900" strokeWidth="1" x="35" y="88" width="10" height="7" rx="2"/>
    <rect fill="#FFA500" stroke="#B28900" strokeWidth="1" x="60" y="88" width="10" height="7" rx="2"/>
  </svg>
);

const WalkingDuck: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationTriggered, setAnimationTriggered] = useState(false);

  useEffect(() => {
    const initialDelayTimer = setTimeout(() => {
      setIsVisible(true);
      setAnimationTriggered(true); 
    }, 5000); // Show and start animation after 5 seconds

    return () => clearTimeout(initialDelayTimer);
  }, []);

  useEffect(() => {
    if (animationTriggered) {
      // Animation duration is 10s (defined in tailwind.config.ts)
      const hideTimer = setTimeout(() => {
        setIsVisible(false); 
      }, 10000 + 500); // Wait for animation to complete + buffer, then hide
      return () => clearTimeout(hideTimer);
    }
  }, [animationTriggered]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-5 left-0 z-[9999] transform -translate-x-full", // Start off-screen left
        animationTriggered && "animate-walk-duck" 
      )}
      aria-hidden="true"
    >
      <DuckSVG />
    </div>
  );
};

export default WalkingDuck;
