
"use client";

// This file is intentionally blank.
// The original content was moved to /src/app/(calculators)/single-component-excess-add/page.tsx
// This redirection or cleanup of the old route /standardization would typically be handled
// by Next.js routing configuration (e.g., redirects in next.config.js) or by deleting this file
// if the route is no longer needed. For now, it's left blank to signify the move.

// If you want to redirect users from /standardization to /single-component-excess-add,
// you could use a client-side redirect:
/*
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldStandardizationPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/single-component-excess-add');
  }, [router]);
  return null; // Or a loading message
}
*/

// For the purpose of this exercise, simply leaving it blank or with a comment.
// In a real scenario, a redirect or proper removal is better.
export default function DeprecatedStandardizationPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Page Moved</h1>
      <p>This calculator has been moved. You might be looking for the "Single Component Excess Add" or "Multiple Components Excess Add" calculators.</p>
      <p>Please navigate via the homepage.</p>
    </div>
  );
}
