"use client";
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const DuckSVG: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-8 h-8 md:w-10 md:h-10">
    <path fill="#FFD700" stroke="#B28900" strokeWidth="3" d="M20,70 Q35,45 50,60 Q65,45 80,70 Q95,80 75,90 L25,90 Q5,80 20,70 Z" /> {/* Body */}
    <circle fill="#FFD700" stroke="#B28900" strokeWidth="3" cx="75" cy="50" r="15" /> {/* Head */}
    <polygon fill="#FFA500" stroke="#B28900" strokeWidth="1.5" points="88,48 98,53 88,58" /> {/* Beak */}
    {/* Simple static feet for a tiny duck */}
    <rect fill="#FFA500" stroke="#B28900" strokeWidth="1" x="30" y="88" width="10" height="7" rx="2"/>
    <rect fill="#FFA500" stroke="#B28900" strokeWidth="1" x="55" y="88" width="10" height="7" rx="2"/>
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
