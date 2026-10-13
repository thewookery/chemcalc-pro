"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Atom, ChevronDown, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CALCULATORS, CATEGORIES } from '@/lib/calculators';
import { LiveBridgeDialog } from '@/components/bridge/LiveBridgeDialog';

const AppHeader = () => {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Z & S QC lab tools Home">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <Atom className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-foreground leading-tight">
              Z & S QC lab tools
            </span>
            <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline-block">
              Industrial & Chemical Calculations
            </span>
          </div>
        </Link>

        {/* Right Navigation & Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Bridge Co-Pilot Button */}
          <LiveBridgeDialog />

          {/* Quick Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-medium">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">Calculators</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              <DropdownMenuItem asChild>
                <Link href="/" className="font-semibold text-primary">
                  ★ View All Calculators
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {CATEGORIES.filter((c) => c !== 'All').map((category) => {
                const items = CALCULATORS.filter((c) => c.category === category);
                return (
                  <React.Fragment key={category}>
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </DropdownMenuLabel>
                    {items.map((item) => (
                      <DropdownMenuItem
                        key={item.slug}
                        onClick={() => router.push(`/${item.slug}`)}
                        className="text-xs cursor-pointer"
                      >
                        {item.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </React.Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
