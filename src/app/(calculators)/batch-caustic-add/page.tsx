
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

interface BatchCausticResult {
  percentage: number;
  causticWeight: number;
}

const CAUSTIC_PERCENTAGES = [
  0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20,
  0.21, 0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30
];

const BatchCausticAddCalculatorPage: React.FC = () => {
  const [batchWeight, setBatchWeight] = useState<string>('');
  const [results, setResults] = useState<BatchCausticResult[]>([]);

  useEffect(() => {
    const wt = parseFloat(batchWeight);
    if (!isNaN(wt) && wt > 0) {
      const newResults = CAUSTIC_PERCENTAGES.map(p => ({
        percentage: p,
        causticWeight: (p / 100) * wt,
      }));
      setResults(newResults);
    } else {
      setResults([]);
    }
  }, [batchWeight]);

  const formula = "Weight of Caustic to Add = (Target Percentage / 100) * Batch Weight";
  
  const resultsToCopy = useMemo(() => {
    if (results.length === 0) return "";
    let text = `Batch Caustic Add Calculation for Batch Weight: ${batchWeight} pounds (lbs)\n\n`;
    text += "Percentage | Caustic to Add (pounds)\n";
    text += "----------------------------------\n";
    results.forEach(res => {
      text += `${res.percentage.toFixed(2)}%        | ${res.causticWeight.toFixed(4)} pounds\n`;
    });
    return text;
  }, [batchWeight, results]);


  return (
    <CalculatorWrapper
      title="Batch Caustic Add Calculator"
      description="Calculate the weight of caustic to add for various percentages (0.08% to 0.30%) based on total batch weight."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="batchWeightCaustic"
          label="Batch Weight"
          unit="pounds (lbs)"
          value={batchWeight}
          onChange={(e) => setBatchWeight(e.target.value)}
          placeholder="e.g., 50000"
          tooltipText="Enter the total weight of the batch in pounds. Caustic added will also be in pounds."
        />
        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Caustic to Add for Batch:</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Target Caustic %</TableHead>
                  <TableHead>Weight of Caustic to Add</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((res) => (
                  <TableRow key={res.percentage}>
                    <TableCell className="font-medium">{res.percentage.toFixed(2)}%</TableCell>
                    <TableCell>{res.causticWeight.toFixed(4)} pounds</TableCell>
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
              <DialogTitle className="text-xl">How to Use the Batch Caustic Add Calculator</DialogTitle>
              <DialogDescription>
                This calculator helps determine the weight of caustic (e.g., 50% NaOH solution) to add to a large batch to achieve various target caustic percentages.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Batch Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the total weight of your current batch. The unit for this weight (e.g., pounds, kilograms) will be the same unit for the calculated caustic to add.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">50000 pounds</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Understanding the Results Table</h4>
                <p className="mb-1 text-muted-foreground">
                  Once you input the batch weight, the calculator automatically generates a table. This table shows:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                  <li><strong>Target Caustic %:</strong> A range of predefined target caustic percentages (from 0.08% to 0.30%).</li>
                  <li><strong>Weight of Caustic to Add:</strong> The calculated amount of caustic needed to reach each corresponding target percentage for your specified batch weight.</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">Formula Used</h4>
                <p className="mb-1 text-muted-foreground">
                  For each target percentage, the calculation is:
                </p>
                <code className="block my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="text-muted-foreground">
                  This formula assumes the "Weight of Caustic to Add" refers to the weight of the caustic solution itself (e.g., 50% NaOH solution), not pure NaOH.
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

export default BatchCausticAddCalculatorPage;
