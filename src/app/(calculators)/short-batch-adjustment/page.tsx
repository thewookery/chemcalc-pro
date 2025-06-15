
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper'; // For consistent titling
import { Label } from '@/components/ui/label'; // For skeleton structure
import { Separator } from '@/components/ui/separator'; // Keep for structure, ensure it's fine

const ShortBatchAdjustmentCalculatorLogic = dynamic(
  () => import('./calculator-logic'),
  {
    ssr: false,
    loading: () => (
      <CalculatorWrapper
        title="Short Batch Adjustment Calculator"
        description="Calculates adjusted batch size based on a limiting material, then breaks down the new batch into component weights using standard formula percentages."
      >
        <div className="space-y-8">
          <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Part 1: Determine Adjusted Total Batch Weight</h3>
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </section>
          
          <div className="my-4 border-t border-border"></div>

          <section className="space-y-4 p-4 border rounded-md bg-muted/30">
             <h3 className="text-xl font-semibold mb-3 text-primary">Part 2: Calculate Component Weights for Adjusted Batch</h3>
            <Skeleton className="h-10 w-full mb-4" />
            <Label>Components (Standard % on Batch Ticket)</Label>
            <div className="space-y-2 mt-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-10 w-1/3 mt-4" />
            <Skeleton className="h-20 w-full mt-4" /> 
          </section>
        </div>
      </CalculatorWrapper>
    ),
  }
);

export default function ShortBatchAdjustmentPage() {
  return <ShortBatchAdjustmentCalculatorLogic />;
}
