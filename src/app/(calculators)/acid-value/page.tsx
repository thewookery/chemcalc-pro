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

const AcidValueCalculatorPage: React.FC = () => {
  const [mlTitrated, setMlTitrated] = useState<string>('');
  const [sampleWeight, setSampleWeight] = useState<string>('');
  const [acidValue, setAcidValue] = useState<number | null>(null);

  useEffect(() => {
    const ml = parseFloat(mlTitrated);
    const wt = parseFloat(sampleWeight);

    if (!isNaN(ml) && !isNaN(wt) && wt > 0) {
      const av = (ml * 5.611) / wt;
      setAcidValue(av);
    } else {
      setAcidValue(null);
    }
  }, [mlTitrated, sampleWeight]);

  const formula = "(ML Titrated * 5.611) / Sample Weight";
  const resultsToCopy = useMemo(() => {
    if (acidValue === null) return "";
    return `Acid Value Calculation:
ML Titrated: ${mlTitrated} mL
Sample Weight: ${sampleWeight} g
Acid Value: ${acidValue.toFixed(3)}`;
  }, [mlTitrated, sampleWeight, acidValue]);

  const voiceConfig = [
    { id: 'mlTitrated', label: 'Titrant Volume', onUpdate: (val: string) => setMlTitrated(val) },
    { id: 'sampleWeight', label: 'Sample Weight', onUpdate: (val: string) => setSampleWeight(val) },
  ];

  const voiceResultText = acidValue !== null ? `The Acid Value is ${acidValue.toFixed(3)}` : undefined;

  return (
    <CalculatorWrapper
      title="Acid Value Calculator"
      description="Calculate the Acid Value (AV) of a sample based on titration volume and sample weight."
      formula={formula}
      resultsToCopy={resultsToCopy}
      voiceConfig={voiceConfig}
      voiceResultText={voiceResultText}
    >
      <div className="space-y-4">
        <CommonInput
          id="mlTitrated"
          label="Titrant Volume"
          unit="mL"
          value={mlTitrated}
          onChange={(e) => setMlTitrated(e.target.value)}
          placeholder="e.g., 1.5"
          tooltipText="Enter the volume of titrant (e.g., KOH solution) used in mL."
        />
        <CommonInput
          id="sampleWeight"
          label="Sample Weight"
          unit="g"
          value={sampleWeight}
          onChange={(e) => setSampleWeight(e.target.value)}
          placeholder="e.g., 10.0"
          tooltipText="Enter the weight of the sample in grams."
        />
        <ResultDisplay label="Acid Value" value={acidValue} variant="highlight" />
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
              <DialogTitle className="text-xl">How to Use the Acid Value Calculator</DialogTitle>
              <DialogDescription>
                This calculator determines the Acid Value (AV) of a substance, which is the mass of potassium hydroxide (KOH) in milligrams required to neutralize one gram of the chemical substance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">Voice Commands</h4>
                <p className="text-muted-foreground italic mb-2">Try saying things like:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>"Set titrant volume to one point five"</li>
                  <li>"Sample weight is ten grams"</li>
                  <li>"Read the result"</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Titrant Volume</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the volume of the titrant (e.g., 0.1N KOH solution) used during the titration of your sample. This value should be in milliliters (mL).
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">1.5 mL</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input Sample Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the weight of the sample you titrated. This value should be in grams (g).
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">10.0 g</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Understanding the Result</h4>
                <p className="mb-1 text-muted-foreground">
                  The calculator will automatically display the "Acid Value". The formula used is:
                </p>
                <code className="block my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="text-muted-foreground">
                  The constant 5.611 is derived from the molecular weight of KOH (56.11 g/mol) and the normality of the titrant (typically 0.1 N). Specifically, (Normality * 56.11) / 10 = 0.1 * 56.11 = 5.611, assuming 0.1N KOH.
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

export default AcidValueCalculatorPage;
