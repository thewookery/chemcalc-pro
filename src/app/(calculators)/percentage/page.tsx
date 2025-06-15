
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type PercentageMode = "percentOfValue" | "whatPercent";

const PercentageCalculatorPage: React.FC = () => {
  const [mode, setMode] = useState<PercentageMode>("percentOfValue");

  // Mode 1: Find B% of C (Result A)
  const [b1, setB1] = useState<string>(''); // Percentage (B)
  const [c1, setC1] = useState<string>(''); // Value (C)
  const [a1, setA1] = useState<number | null>(null); // Result (A)

  // Mode 2: What % is A of B (Result %)
  const [a2, setA2] = useState<string>(''); // Value (A)
  const [b2, setB2] = useState<string>(''); // Total Value (B)
  const [percent2, setPercent2] = useState<number | null>(null); // Result (%)

  useEffect(() => {
    if (mode === "percentOfValue") {
      const percentage = parseFloat(b1);
      const totalValue = parseFloat(c1);
      if (!isNaN(percentage) && !isNaN(totalValue)) {
        setA1((percentage / 100) * totalValue);
      } else {
        setA1(null);
      }
    } else { // mode === "whatPercent"
      const partValue = parseFloat(a2);
      const totalValue = parseFloat(b2);
      if (!isNaN(partValue) && !isNaN(totalValue) && totalValue !== 0) {
        setPercent2((partValue / totalValue) * 100);
      } else {
        setPercent2(null);
      }
    }
  }, [mode, b1, c1, a2, b2]);

  const formulaMode1 = "Result (A) = (Percentage (B) / 100) * Value (C)";
  const formulaMode2 = "Percentage (%) = (Value (A) / Total Value (B)) * 100";

  const resultsToCopy = useMemo(() => {
    if (mode === "percentOfValue" && a1 !== null) {
      return `Percentage of Value:
${b1}% of ${c1} = ${a1.toFixed(3)}`;
    } else if (mode === "whatPercent" && percent2 !== null) {
      return `What Percent:
${a2} is ${percent2.toFixed(3)}% of ${b2}`;
    }
    return "";
  }, [mode, a1, b1, c1, percent2, a2, b2]);

  return (
    <CalculatorWrapper
      title="Percentage Calculator"
      description="Calculate percentages in two different modes."
      formula={mode === "percentOfValue" ? formulaMode1 : formulaMode2}
      resultsToCopy={resultsToCopy}
    >
      <Tabs value={mode} onValueChange={(value) => setMode(value as PercentageMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="percentOfValue">Find % of a Value</TabsTrigger>
          <TabsTrigger value="whatPercent">What % is A of B</TabsTrigger>
        </TabsList>
        <TabsContent value="percentOfValue" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Calculate: Value A is B% of C.</p>
          <CommonInput
            id="percentageB1"
            label="Percentage (B)"
            unit="%"
            value={b1}
            onChange={(e) => setB1(e.target.value)}
            placeholder="e.g., 25"
          />
          <CommonInput
            id="valueC1"
            label="Total Value (C)"
            value={c1}
            onChange={(e) => setC1(e.target.value)}
            placeholder="e.g., 200"
          />
          <ResultDisplay label="Result (A)" value={a1} variant="highlight" />
        </TabsContent>
        <TabsContent value="whatPercent" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">Calculate: What percentage is Value A of Total Value B.</p>
          <CommonInput
            id="valueA2"
            label="Value (A)"
            value={a2}
            onChange={(e) => setA2(e.target.value)}
            placeholder="e.g., 50"
          />
          <CommonInput
            id="totalValueB2"
            label="Total Value (B)"
            value={b2}
            onChange={(e) => setB2(e.target.value)}
            placeholder="e.g., 200"
          />
          <ResultDisplay label="Percentage" value={percent2} unit="%" variant="highlight" />
        </TabsContent>
      </Tabs>
      <div className="mt-8 pt-6 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <HelpCircle className="mr-2 h-4 w-4" /> How to use this calculator
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">How to Use the Percentage Calculator</DialogTitle>
              <DialogDescription>
                This calculator offers two modes for common percentage calculations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">Mode 1: Find % of a Value</h4>
                <p className="mb-1 text-muted-foreground">
                  This mode helps you find what a certain percentage (B) of a given total value (C) is. The result is Value A.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                  <li>
                    <strong>Percentage (B):</strong> Enter the percentage you want to find.
                    <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">25 %</span></div>
                  </li>
                  <li>
                    <strong>Total Value (C):</strong> Enter the total amount from which the percentage will be calculated.
                    <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">200</span></div>
                  </li>
                </ul>
                <p className="mt-1 text-muted-foreground">
                  The calculator will show the "Result (A)". The formula is: <code className="font-mono bg-muted px-1 rounded">{formulaMode1}</code>
                </p>
              </section>
              <hr className="my-4"/>
              <section>
                <h4 className="font-semibold text-md mb-2">Mode 2: What % is A of B</h4>
                <p className="mb-1 text-muted-foreground">
                  This mode helps you find what percentage a certain value (A) is of a total value (B).
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                  <li>
                    <strong>Value (A):</strong> Enter the partial value.
                    <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">50</span></div>
                  </li>
                  <li>
                    <strong>Total Value (B):</strong> Enter the total amount that Value A is part of.
                    <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">200</span></div>
                  </li>
                </ul>
                <p className="mt-1 text-muted-foreground">
                  The calculator will show the "Percentage". The formula is: <code className="font-mono bg-muted px-1 rounded">{formulaMode2}</code>
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

export default PercentageCalculatorPage;
