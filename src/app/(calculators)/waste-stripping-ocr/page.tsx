
"use client"; 

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import { Label } from '@/components/ui/label';

const WasteStrippingOcrCalculatorLogic = dynamic(
  () => import('./calculator-logic'),
  {
    ssr: false,
    loading: () => (
      <CalculatorWrapper
        title="Handwritten Weights OCR Calculator"
        description="Upload an image of handwritten waste and stripping weights. The AI will attempt to read them, and then calculate the net weight against your batch weight."
      >
        <div className="space-y-6">
          <div>
            <Label htmlFor="image-upload-skeleton">Upload Image of Weights</Label>
            <Skeleton className="h-10 w-full mt-1.5" />
            <Skeleton className="h-3 w-1/2 mt-1" />
          </div>
          
          <Skeleton className="h-48 w-full rounded-md" />
          
          <div>
            <Label htmlFor="batch-weight-skeleton">Batch Weight</Label>
            <Skeleton className="h-10 w-full mt-1.5" />
          </div>
          
          <Skeleton className="h-10 w-full" /> 
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
        </div>
      </CalculatorWrapper>
    ),
  }
);

export default function WasteStrippingOcrPage() {
  return <WasteStrippingOcrCalculatorLogic />;
}
