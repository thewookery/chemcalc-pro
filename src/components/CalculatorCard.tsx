"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalculatorMeta } from '@/types';
import {
  ArrowRight,
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
  TestTube2,
  HelpCircle as DefaultIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface CalculatorCardProps {
  calculator: CalculatorMeta;
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string, e: React.MouseEvent) => void;
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
  TestTube2,
  DefaultIcon,
};

const categoryColorMap: Record<string, string> = {
  'Titration & Analysis': 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'Batch Adjustments': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  'Trials & Formulations': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'General Math': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

const CalculatorCard: React.FC<CalculatorCardProps> = ({
  calculator,
  isFavorite,
  onToggleFavorite,
}) => {
  const IconComponent = calculator.icon ? iconMap[calculator.icon] || iconMap['DefaultIcon'] : iconMap['DefaultIcon'];

  return (
    <Link href={`/${calculator.slug}`} className="group block h-full focus:outline-none" aria-label={`Open ${calculator.name} calculator`}>
      <Card className="h-full flex flex-col justify-between transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 group-hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1.5">
              {onToggleFavorite && (
                <button
                  type="button"
                  aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                  onClick={(e) => onToggleFavorite(calculator.slug, e)}
                  className="p-1 rounded-md text-muted-foreground hover:text-amber-500 hover:bg-muted/80 transition-colors"
                >
                  <span className={cn("text-base", isFavorite ? "text-amber-500" : "opacity-30 hover:opacity-100")}>
                    ★
                  </span>
                </button>
              )}
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn("text-[11px] font-medium px-2 py-0.5", categoryColorMap[calculator.category] || "")}
              >
                {calculator.category}
              </Badge>
            </div>
            <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
              {calculator.name}
            </CardTitle>
          </div>
          <CardDescription className="text-sm line-clamp-2 pt-1 text-muted-foreground">
            {calculator.description}
          </CardDescription>
        </CardHeader>

        {calculator.formulaBadge && (
          <CardContent className="pt-0 pb-4">
            <div className="text-[11px] font-mono text-muted-foreground bg-muted/60 dark:bg-muted/30 px-2 py-1 rounded border border-border/50 truncate">
              {calculator.formulaBadge}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
};

export default CalculatorCard;
