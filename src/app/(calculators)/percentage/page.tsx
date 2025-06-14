"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    </CalculatorWrapper>
  );
};

export default PercentageCalculatorPage;
