
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
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

const StandardDilutionPage: React.FC = () => {
  const [m1, setM1] = useState<string>(''); // Stock concentration
  const [m2, setM2] = useState<string>(''); // Target concentration
  const [v2, setV2] = useState<string>(''); // Final volume
  const [v1, setV1] = useState<number | null>(null); // Volume of stock to use
  const [waterToAdd, setWaterToAdd] = useState<number | null>(null); // Water to add

  useEffect(() => {
    const stockConc = parseFloat(m1);
    const targetConc = parseFloat(m2);
    const finalVol = parseFloat(v2);

    // Math: V1 = (M2 * V2) / M1
    // Only valid if stockConc >= targetConc
    if (!isNaN(stockConc) && !isNaN(targetConc) && !isNaN(finalVol) && stockConc > 0 && finalVol > 0 && stockConc >= targetConc) {
      const volStock = (targetConc * finalVol) / stockConc;
      setV1(volStock);
      setWaterToAdd(finalVol - volStock);
    } else {
      setV1(null);
      setWaterToAdd(null);
    }
  }, [m1, m2, v2]);

  const formula = "V1 (Stock Volume) = (M2 * V2) / M1; Water/Diluent to Add = V2 - V1";
  const formulaTooltip = "M1: Stock Concentration, V1: Stock Volume, M2: Target Concentration, V2: Final Volume. Ensure units for M1 & M2 are consistent, and V1 & V2 are consistent.";

  const resultsToCopy = useMemo(() => {
    if (v1 === null || waterToAdd === null) return "";
    return `Standard Dilution (M1V1 = M2V2):
Stock Concentration (M1): ${m1}
Target Concentration (M2): ${m2}
Final Volume (V2): ${v2}
---
Volume of Stock to Use (V1): ${v1.toFixed(4)}
Water/Diluent to Add: ${waterToAdd.toFixed(4)}`;
  }, [m1, m2, v2, v1, waterToAdd]);

  return (
    <CalculatorWrapper
      title="Standard Dilution Calculator (M1V1 = M2V2)"
      description="Calculate the volume of stock solution needed and the volume of diluent to add."
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="m1"
          label="Stock Concentration (M1)"
          value={m1}
          onChange={(e) => setM1(e.target.value)}
          placeholder="e.g., 10 (M, %, etc.)"
          tooltipText="Concentration of your starting stock solution."
        />
        <CommonInput
          id="m2"
          label="Target Concentration (M2)"
          value={m2}
          onChange={(e) => setM2(e.target.value)}
          placeholder="e.g., 1 (M, %, etc.)"
          tooltipText="Desired final concentration of the diluted solution."
        />
        <CommonInput
          id="v2"
          label="Final Volume (V2)"
          value={v2}
          onChange={(e) => setV2(e.target.value)}
          placeholder="e.g., 100 (mL, L, etc.)"
          tooltipText="Total final volume you want to prepare."
        />
        <ResultDisplay label="Volume of Stock to Use (V1)" value={v1} unit="(units)" variant="highlight" />
        <ResultDisplay label="Water/Diluent to Add" value={waterToAdd} unit="(units)" />
         {parseFloat(m1) < parseFloat(m2) && !isNaN(parseFloat(m1)) && !isNaN(parseFloat(m2)) && (
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Note: Stock concentration (M1) cannot be less than target concentration (M2). This calculator is only for dilutions.</p>
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
              <DialogTitle className="text-xl">How to Use the Standard Dilution Calculator (M1V1 = M2V2)</DialogTitle>
              <DialogDescription>
                This calculator uses the M1V1 = M2V2 formula to determine how to dilute a stock solution to a desired target concentration and final volume.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Stock Concentration (M1)</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the concentration of your starting stock solution. Ensure the unit (e.g., Molarity (M), percentage (%), ppm) is consistent with the "Target Concentration (M2)".
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">10 M</span> (or <span className="font-mono p-1 bg-background rounded">50 %</span>)</div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input Target Concentration (M2)</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the desired concentration of your final diluted solution. This value must be less than or equal to M1. Use the same unit as M1.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">1 M</span> (or <span className="font-mono p-1 bg-background rounded">5 %</span>)</div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Input Final Volume (V2)</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the total volume of the diluted solution you want to prepare. Ensure the unit (e.g., mL, L) is consistent for calculated volumes.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">100 mL</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">4. Understanding the Results</h4>
                <div className="mb-1 text-muted-foreground">
                  The calculator will display:
                  <ul className="list-disc list-inside pl-4">
                    <li><strong>Volume of Stock to Use (V1):</strong> The amount of your stock solution (M1) needed.</li>
                    <li><strong>Water/Diluent to Add:</strong> The amount of solvent (e.g., water) needed to reach the final volume (V2).</li>
                  </ul>
                </div>
                <p className="mb-1 text-muted-foreground">The formulas used are:</p>
                <code className="block my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="text-muted-foreground">
                  Units for concentrations (M1, M2) must be the same. Units for volumes (V1, V2, Water/Diluent) will be the same as the input V2 unit.
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

export default StandardDilutionPage;
