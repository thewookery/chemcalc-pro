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

const HydroxylValueCalculatorPage: React.FC = () => {
  const [blank, setBlank] = useState<string>('');
  const [sample, setSample] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [acidValue, setAcidValue] = useState<string>('');
  const [hydroxylValue, setHydroxylValue] = useState<number | null>(null);

  useEffect(() => {
    const b = parseFloat(blank);
    const s = parseFloat(sample);
    const wt = parseFloat(weight);
    const av = parseFloat(acidValue);

    if (!isNaN(b) && !isNaN(s) && !isNaN(wt) && !isNaN(av) && wt > 0) {
      const ohIntermediate = ((b - s) * 0.5 * 56.11) / wt;
      const ohFinal = ohIntermediate + av;
      setHydroxylValue(ohFinal);
    } else {
      setHydroxylValue(null);
    }
  }, [blank, sample, weight, acidValue]);

  const formula = "OH Value = (((Blank - Sample) * 0.5 * 56.11) / Weight) + Acid Value";
  const resultsToCopy = useMemo(() => {
    if (hydroxylValue === null) return "";
    return `Hydroxyl Value Calculation:
Blank Titration: ${blank} mL
Sample Titration: ${sample} mL
Sample Weight: ${weight} g
Acid Value (AV): ${acidValue} mg KOH/g
Hydroxyl Value: ${hydroxylValue.toFixed(3)}`;
  }, [blank, sample, weight, acidValue, hydroxylValue]);

  const voiceConfig = [
    { id: 'blank', label: 'Blank Titration', onUpdate: (val: string) => setBlank(val) },
    { id: 'sample', label: 'Sample Titration', onUpdate: (val: string) => setSample(val) },
    { id: 'weight', label: 'Sample Weight', onUpdate: (val: string) => setWeight(val) },
    { id: 'acidValue', label: 'Acid Value', onUpdate: (val: string) => setAcidValue(val) },
  ];

  const voiceResultText = hydroxylValue !== null ? `The Hydroxyl Value is ${hydroxylValue.toFixed(3)}` : undefined;
  
  return (
    <CalculatorWrapper
      title="Hydroxyl (OH) Value Calculator"
      description="Determine the Hydroxyl Value. Input blank and sample titration values, sample weight, and the sample's Acid Value (AV)."
      formula={formula}
      resultsToCopy={resultsToCopy}
      voiceConfig={voiceConfig}
      voiceResultText={voiceResultText}
    >
      <div className="space-y-4">
        <CommonInput
          id="blank"
          label="Blank Titration"
          unit="mL"
          value={blank}
          onChange={(e) => setBlank(e.target.value)}
          placeholder="e.g., 25.0"
          tooltipText="Volume of titrant (e.g., 0.5N KOH) for the blank run."
        />
        <CommonInput
          id="sample"
          label="Sample Titration"
          unit="mL"
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          placeholder="e.g., 15.0"
          tooltipText="Volume of titrant for the sample run."
        />
        <CommonInput
          id="weight"
          label="Sample Weight"
          unit="g"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g., 2.0"
          tooltipText="Weight of the sample in grams."
        />
        <CommonInput
          id="acidValue"
          label="Acid Value (AV)"
          unit="mg KOH/g"
          value={acidValue}
          onChange={(e) => setAcidValue(e.target.value)}
          placeholder="e.g., 0.5"
          tooltipText="Acid Value of the sample, which will be added to the calculated hydroxyl component."
        />
        <ResultDisplay label="Hydroxyl Value" value={hydroxylValue} variant="highlight" />
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
              <DialogTitle className="text-xl">How to Use the Hydroxyl (OH) Value Calculator</DialogTitle>
              <DialogDescription>
                This calculator determines the Hydroxyl Value (OH Value) of a substance, which is a measure of the content of hydroxyl groups.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">Voice Control</h4>
                <p className="text-muted-foreground italic mb-2">Try saying:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>"Set blank titration to twenty-five"</li>
                  <li>"Sample titration is fifteen point two"</li>
                  <li>"Weight is two point zero grams"</li>
                  <li>"Acid value is zero point five"</li>
                  <li>"Read the answer"</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Blank Titration Volume</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the volume of titrant (e.g., 0.5N alcoholic KOH) used for the blank titration, in milliliters (mL). The blank titration is performed without the sample.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input Sample Titration Volume</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the volume of the same titrant used for the titration of your sample, in milliliters (mL).
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Input Sample Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the weight of the sample used for the titration, in grams (g).
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">4. Input Acid Value (AV)</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the Acid Value of the sample in mg KOH/g. The Acid Value accounts for free acids present in the sample and is added to the hydroxyl component.
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

export default HydroxylValueCalculatorPage;
