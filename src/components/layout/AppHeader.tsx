"use client";

import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Atom } from 'lucide-react';

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-center gap-4"> {/* Changed justify-between to justify-center and added gap-4 */}
        <Link href="/" className="flex items-center gap-2" aria-label="Z & S QC lab tools Home">
          <Atom className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">Z & S QC lab tools</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
};

export default AppHeader;
