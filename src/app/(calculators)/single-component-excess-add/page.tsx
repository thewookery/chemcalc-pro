
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper'; // For consistent titling

const SingleComponentExcessAddCalculatorLogic = dynamic(
  () => import('./calculator-logic'),
  {
    ssr: false,
    loading: () => (
      <CalculatorWrapper
        title="Single Component Excess Add Calculator"
        description="Calculate the percentage of a single component to add."
      >
        <div className="space-y-4">
          {/* Skeleton for CommonInput: Units of Component to Add */}
          <div>
            <Skeleton className="h-4 w-1/3 mb-1.5" />
            <Skeleton className="h-10 w-full" />
          </div>
          {/* Skeleton for Combobox: AV or OH of Material */}
          <div>
            <Skeleton className="h-4 w-1/2 mb-1.5" />
            <Skeleton className="h-10 w-full" />
          </div>
          {/* Skeleton for ResultDisplay: Percentage of Material to Add */}
          <div>
            <Skeleton className="h-4 w-2/5 mb-1" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </CalculatorWrapper>
    ),
  }
);

export default function SingleComponentExcessAddPage() {
  return <SingleComponentExcessAddCalculatorLogic />;
}
