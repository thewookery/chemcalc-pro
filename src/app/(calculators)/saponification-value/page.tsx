
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

const SaponificationValueCalculatorPage: React.FC = () => {
  const [blankTitrated, setBlankTitrated] = useState<string>('');
  const [sampleTitrate, setSampleTitrate] = useState<string>('');
  const [sampleWeight, setSampleWeight] = useState<string>('');
  const [sapValue, setSapValue] = useState<number | null>(null);

  useEffect(() => {
    const blank = parseFloat(blankTitrated);
    const sample = parseFloat(sampleTitrate);
    const wt = parseFloat(sampleWeight);

    if (!isNaN(blank) && !isNaN(sample) && !isNaN(wt) && wt > 0) {
      // Assuming 0.5N HCl for titration and KOH for saponification.
      // Factor = Normality_HCl * MW_KOH = 0.5 * 56.1 = 28.05
      const sv = ((blank - sample) * 28.05) / wt;
      setSapValue(sv);
    } else {
      setSapValue(null);
    }
  }, [blankTitrated, sampleTitrate, sampleWeight]);

  const formula = "Sap Value = ((Blank Titrated - Sample Titrate) * 28.05) / Sample Weight";
  const resultsToCopy = useMemo(() => {
    if (sapValue === null) return "";
    return `Saponification Value Calculation:
Blank Titrated: ${blankTitrated} mL
Sample Titrate: ${sampleTitrate} mL
Sample Weight: ${sampleWeight} g
Saponification Value: ${sapValue.toFixed(3)}`;
  }, [blankTitrated, sampleTitrate, sampleWeight, sapValue]);

  return (
    <CalculatorWrapper
      title="Saponification (Sap) Value Calculator"
      description="Calculate the Saponification Value from titration data and sample weight."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="blankTitrated"
          label="Blank Titrated"
          unit="mL"
          value={blankTitrated}
          onChange={(e) => setBlankTitrated(e.target.value)}
          placeholder="e.g., 40.0"
          tooltipText="Volume of titrant (e.g., 0.5N HCl) used for the blank."
        />
        <CommonInput
          id="sampleTitrate"
          label="Sample Titrate"
          unit="mL"
          value={sampleTitrate}
          onChange={(e) => setSampleTitrate(e.target.value)}
          placeholder="e.g., 25.0"
          tooltipText="Volume of titrant (e.g., 0.5N HCl) used for the sample."
        />
        <CommonInput
          id="sampleWeightSap"
          label="Sample Weight"
          unit="g"
          value={sampleWeight}
          onChange={(e) => setSampleWeight(e.target.value)}
          placeholder="e.g., 1.0"
          tooltipText="Weight of the sample in grams."
        />
        <ResultDisplay label="Saponification Value" value={sapValue} variant="highlight" />
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
              <DialogTitle className="text-xl">How to Use the Saponification Value Calculator</DialogTitle>
              <DialogDescription>
                This calculator determines the Saponification Value (Sap Value), which is the number of milligrams of potassium hydroxide (KOH) required to saponify one gram of fat or oil.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Blank Titrated Volume</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the volume (in mL) of the titrant (commonly 0.5N hydrochloric acid, HCl) used for the blank titration. The blank undergoes the same saponification process but without the sample.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">40.0 mL</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input Sample Titrate Volume</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the volume (in mL) of the same titrant used for the titration of your sample after it has undergone saponification with alcoholic KOH.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">25.0 mL</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Input Sample Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the weight of the sample used for the analysis in grams (g).
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">1.0 g</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">4. Understanding the Result</h4>
                <p className="mb-1 text-muted-foreground">
                  The calculator will display the "Saponification Value". The formula used is:
                </p>
                <code className="block my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="text-muted-foreground">
                  Where:
                  <ul className="list-disc list-inside pl-4">
                    <li>(Blank Titrated - Sample Titrate) is the difference in titrant volume.</li>
                    <li>The factor 28.05 is derived from (Normality of HCl × Molecular weight of KOH). For 0.5N HCl, this is (0.5 × 56.108) ≈ 28.05. Ensure this factor matches your specific titrant normality.</li>
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

export default SaponificationValueCalculatorPage;
