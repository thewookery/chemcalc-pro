import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RemovedBatchCausticAddPage() {
  return (
    <div className="container max-w-md mx-auto py-12">
      <Card className="text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Calculator Removed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            The "Batch Caustic Add Calculator" was a duplicate and has been removed to streamline the application.
          </p>
          <Button asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Calculators
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
