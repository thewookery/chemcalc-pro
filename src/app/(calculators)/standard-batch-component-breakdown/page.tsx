"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function MergedStandardBatchComponentBreakdownPage() {
  return (
    <div className="container max-w-md mx-auto py-12">
      <Card className="text-center shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Functionality Merged</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            The "Standard Batch Component Breakdown" features have been integrated into the more powerful "Multiple Components Calculator".
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full" variant="default">
              <Link href="/multiple-components-excess-add">
                Go to Multiple Components <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
