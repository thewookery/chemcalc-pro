
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useLiveCalculatorSync } from '@/hooks/useLiveCalculatorSync';

interface CausticTrialResult {
  percentage: number;
  causticAmount: number;
}

const CAUSTIC_PERCENTAGES = [
  0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20,
  0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30
];

const CausticTrialCalculatorPage: React.FC = () => {
  const [trialWeight, setTrialWeight] = useState<string>('');
  const [results, setResults] = useState<CausticTrialResult[]>([]);

  const liveData = useMemo(() => ({ trialWeight }), [trialWeight]);
  const { getSnapshotUrl } = useLiveCalculatorSync('caustic-trial', liveData, (remote) => {
    if (remote.trialWeight !== undefined) setTrialWeight(remote.trialWeight);
  });

  useEffect(() => {
    const wt = parseFloat(trialWeight);
    if (!isNaN(wt) && wt > 0) {
      const newResults = CAUSTIC_PERCENTAGES.map(p => ({
        percentage: p,
        causticAmount: (p / 100) * wt,
      }));
      setResults(newResults);
    } else {
      setResults([]);
    }
  }, [trialWeight]);

  const formula = "Caustic Amount (g) = (Target Percentage / 100) * Trial Weight (g)";
  
  const resultsToCopy = useMemo(() => {
    if (results.length === 0) return "";
    let text = `Caustic Trial Calculation for Trial Weight: ${trialWeight} g\n\n`;
    text += "Percentage | Caustic Amount (g)\n";
    text += "-----------------------------\n";
    results.forEach(res => {
      text += `${res.percentage.toFixed(2)}%        | ${res.causticAmount.toFixed(4)} g\n`;
    });
    return text;
  }, [trialWeight, results]);

  return (
    <CalculatorWrapper
      title="Caustic Trial Calculator"
      description="Calculate caustic amounts for trial solutions based on trial weight and predefined percentages (0.08% to 0.30%)."
      formula={formula}
      resultsToCopy={resultsToCopy}
      onShareSnapshot={getSnapshotUrl}
    >
      <div className="space-y-4">
        <CommonInput
          id="trialWeight"
          label="Trial Weight"
          unit="g"
          value={trialWeight}
          onChange={(e) => setTrialWeight(e.target.value)}
          placeholder="e.g., 500"
          tooltipText="Enter the total weight of the trial solution in grams."
        />
        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Caustic Amounts for Trial:</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Target Caustic %</TableHead>
                  <TableHead>Caustic Amount (g)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((res) => (
                  <TableRow key={res.percentage}>
                    <TableCell className="font-medium">{res.percentage.toFixed(2)}%</TableCell>
                    <TableCell>{res.causticAmount.toFixed(4)} g</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
       <div className="mt-8 pt-6 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <HelpCircle className="mr-2 h-4 w-4" /> How to use this calculator
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">How to Use the Caustic Trial Calculator</DialogTitle>
              <DialogDescription>
                This calculator helps determine the amount of caustic (e.g., 50% NaOH solution) needed for small lab trials to achieve various target caustic percentages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Trial Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the total weight of your lab trial sample in grams (g). This is the total weight of the solution you are preparing for the test.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">500 g</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Understanding the Results Table</h4>
                <p className="mb-1 text-muted-foreground">
                  Once you input the trial weight, the calculator automatically generates a table. This table shows:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                  <li><strong>Target Caustic %:</strong> A range of predefined target caustic percentages (from 0.08% to 0.30%).</li>
                  <li><strong>Caustic Amount (g):</strong> The calculated amount of caustic (in grams) needed to reach each corresponding target percentage for your specified trial weight.</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">Formula Used</h4>
                <p className="mb-1 text-muted-foreground">
                  For each target percentage, the calculation is:
                </p>
                <code className="block my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="text-muted-foreground">
                  This formula assumes the "Caustic Amount (g)" refers to the weight of the caustic solution itself (e.g., 50% NaOH solution), not pure NaOH.
                </p>
              </section>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CalculatorWrapper>
  );
};

export default CausticTrialCalculatorPage;
