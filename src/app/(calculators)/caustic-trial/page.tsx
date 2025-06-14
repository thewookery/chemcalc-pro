"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    </CalculatorWrapper>
  );
};

export default CausticTrialCalculatorPage;
