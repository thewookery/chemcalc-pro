
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

const IodineValueCalculatorPage: React.FC = () => {
  const [blank, setBlank] = useState<string>('');
  const [sample, setSample] = useState<string>('');
  const [sampleWeight, setSampleWeight] = useState<string>('');
  const [iodineValue, setIodineValue] = useState<number | null>(null);

  const FACTOR = 1.27; // Derived from (0.1 N Na2S2O3 * 12.69 g/equivalent of I) / 10 for % -> value

  useEffect(() => {
    const b = parseFloat(blank);
    const s = parseFloat(sample);
    const wt = parseFloat(sampleWeight);

    if (!isNaN(b) && !isNaN(s) && !isNaN(wt) && wt > 0) {
      const iv = ((b - s) * FACTOR) / wt;
      setIodineValue(iv);
    } else {
      setIodineValue(null);
    }
  }, [blank, sample, sampleWeight]);

  const formula = `Iodine Value = ((Blank - Sample) * ${FACTOR}) / Sample Weight`;
  const formulaTooltip = `The factor ${FACTOR} is typically derived from (Normality of Thiosulfate * Atomic Weight of Iodine / 10). Common standard procedures use 0.1N Sodium Thiosulfate, and Iodine's atomic weight is ~126.9. Thus, (0.1 * 126.9 / 10) = 1.269, rounded to ${FACTOR}.`;
  
  const resultsToCopy = useMemo(() => {
    if (iodineValue === null) return "";
    return `Iodine Value Calculation:
Blank Titration: ${blank} mL
Sample Titration: ${sample} mL
Sample Weight: ${sampleWeight} g
Iodine Value: ${iodineValue.toFixed(3)}`;
  }, [blank, sample, sampleWeight, iodineValue]);

  return (
    <CalculatorWrapper
      title="Iodine Value Calculator"
      description="Calculate the Iodine Value (IV) which measures the degree of unsaturation in a substance."
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="blankIodine"
          label="Blank Titration"
          unit="mL"
          value={blank}
          onChange={(e) => setBlank(e.target.value)}
          placeholder="e.g., 30.0"
          tooltipText="Volume of titrant (e.g., 0.1N sodium thiosulfate) for the blank."
        />
        <CommonInput
          id="sampleIodine"
          label="Sample Titration"
          unit="mL"
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          placeholder="e.g., 10.0"
          tooltipText="Volume of titrant for the sample."
        />
        <CommonInput
          id="sampleWeightIodine"
          label="Sample Weight"
          unit="g"
          value={sampleWeight}
          onChange={(e) => setSampleWeight(e.target.value)}
          placeholder="e.g., 0.3"
          tooltipText="Weight of the sample in grams."
        />
        <ResultDisplay label="Iodine Value" value={iodineValue} variant="highlight" />
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
              <DialogTitle className="text-xl">How to Use the Iodine Value Calculator</DialogTitle>
              <DialogDescription>
                This calculator determines the Iodine Value (IV), a measure of the unsaturation of fats and oils. It is expressed as the grams of iodine absorbed by 100 grams of the substance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Blank Titration Volume</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the volume (in mL) of the titrant (commonly 0.1N sodium thiosulfate, Na₂S₂O₃) used for the blank titration. The blank is run without the sample but includes all reagents.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">30.0 mL</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input Sample Titration Volume</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the volume (in mL) of the same titrant used for the titration of your sample after it has reacted with an iodine solution (e.g., Wijs solution).
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">10.0 mL</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Input Sample Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the weight of the sample used for the analysis in grams (g).
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">0.3 g</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">4. Understanding the Result</h4>
                <p className="mb-1 text-muted-foreground">
                  The calculator will display the "Iodine Value". The formula used is:
                </p>
                <code className="block my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="text-muted-foreground">
                  Where:
                  <ul className="list-disc list-inside pl-4">
                    <li>(Blank - Sample) is the difference in titrant volume, representing the amount of iodine consumed by the sample.</li>
                    <li>The factor <span className="font-mono">{FACTOR}</span> is typically derived from: (Normality of Thiosulfate × Atomic weight of Iodine × 100) / (1000 × 100) then simplified to get g Iodine per g sample for 100g basis. Or more directly (Normality of Thiosulfate × 12.69) when final result units are considered. For 0.1N Na₂S₂O₃, this factor is often 1.269 or rounded to {FACTOR}. Ensure this factor matches your specific laboratory procedure and titrant normality.</li>
                    <li>Sample Weight is in grams.</li>
                  </ul>
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

export default IodineValueCalculatorPage;
