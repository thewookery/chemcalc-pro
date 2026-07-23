"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function DeprecatedStandardizationPage() {
  return (
    <div className="container max-w-md mx-auto py-12">
      <Card className="text-center shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Calculator Moved</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            The "Standardization" calculator features have been updated and moved to the specialized addition tools.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full" variant="default">
              <Link href="/single-component-excess-add">
                Go to Single Component Add <ArrowRight className="ml-2 h-4 w-4" />
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
