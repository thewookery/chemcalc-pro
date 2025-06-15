
"use client";

// This page's functionality has been merged into the 
// "Multiple Components Excess Add Calculator" page
// located at /src/app/(calculators)/multiple-components-excess-add/page.tsx

// For redirection or cleanup, this file can be deleted, 
// or a redirect can be set up in next.config.js.

/*
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldStandardBatchComponentBreakdownPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/multiple-components-excess-add');
  }, [router]);
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Page Merged</h1>
      <p>This calculator's features are now part of the "Multiple Components Calculator".</p>
      <p>Redirecting...</p>
    </div>
  );
}
*/

export default function MergedStandardBatchComponentBreakdownPage() {
  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-semibold mb-4">Functionality Merged</h1>
      <p className="text-muted-foreground mb-2">
        The "Standard Batch Component Breakdown" features have been integrated into the:
      </p>
      <p className="font-semibold text-lg text-primary">
        Multiple Components Calculator
      </p>
      <p className="text-muted-foreground mt-2">
        Please navigate to that calculator from the homepage.
      </p>
    </div>
  );
}

