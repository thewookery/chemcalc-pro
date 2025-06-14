"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BatchCausticResult {
  percentage: number;
  causticWeight: number;
}

const CAUSTIC_PERCENTAGES = [0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.14, 0.15];

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
    let text = `Batch Caustic Add Calculation for Batch Weight: ${batchWeight} (units)\n\n`;
    text += "Percentage | Caustic to Add (units)\n";
    text += "----------------------------------\n";
    results.forEach(res => {
      text += `${res.percentage.toFixed(2)}%        | ${res.causticWeight.toFixed(4)} (units)\n`;
    });
    return text;
  }, [batchWeight, results]);


  return (
    <CalculatorWrapper
      title="Batch Caustic Add Calculator"
      description="Calculate the weight of caustic to add for various percentages (0.08% to 0.15%) based on total batch weight."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="batchWeightCaustic"
          label="Batch Weight"
          unit="(e.g., lbs, kg)"
          value={batchWeight}
          onChange={(e) => setBatchWeight(e.target.value)}
          placeholder="e.g., 50000"
          tooltipText="Enter the total weight of the batch. Units for caustic added will match this unit."
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
                    <TableCell>{res.causticWeight.toFixed(4)} (units)</TableCell>
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

export default BatchCausticAddCalculatorPage;
