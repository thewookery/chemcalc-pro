
"use client"; 

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';

const MultipleComponentsCalculatorLogic = dynamic(
  () => import('./calculator-logic'),
  {
    ssr: false,
    loading: () => (
      <CalculatorWrapper
        title="Multiple Components Calculator"
        description="Define components, calculate excess additions, and determine full batch component weights based on a target batch size."
      >
        <div className="space-y-8">
          <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Component Details</h3>
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </section>
          <div className="my-4 border-t border-border"></div> 
          <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Overall Batch Parameters</h3>
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </section>
           <div className="my-4 border-t border-border"></div> 
          <section className="space-y-4 p-4 border rounded-md bg-muted/30">
             <h3 className="text-xl font-semibold mb-3 text-primary">Calculated Results</h3>
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full" />
          </section>
        </div>
      </CalculatorWrapper>
    ),
  }
);

export default function MultipleComponentsExcessAddPage() {
  return <MultipleComponentsCalculatorLogic />;
}
