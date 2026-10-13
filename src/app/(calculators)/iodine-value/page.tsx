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
import { useLiveCalculatorSync } from '@/hooks/useLiveCalculatorSync';

const IodineValueCalculatorPage: React.FC = () => {
  const [blank, setBlank] = useState<string>('');
  const [sample, setSample] = useState<string>('');
  const [sampleWeight, setSampleWeight] = useState<string>('');
  const [iodineValue, setIodineValue] = useState<number | null>(null);

  const liveData = useMemo(() => ({ blank, sample, sampleWeight }), [blank, sample, sampleWeight]);
  const { getSnapshotUrl } = useLiveCalculatorSync('iodine-value', liveData, (remote) => {
    if (remote.blank !== undefined) setBlank(remote.blank);
    if (remote.sample !== undefined) setSample(remote.sample);
    if (remote.sampleWeight !== undefined) setSampleWeight(remote.sampleWeight);
  });

  const FACTOR = 1.27; 

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

  const voiceConfig = [
    { id: 'blankIodine', label: 'Blank Titration', onUpdate: (val: string) => setBlank(val) },
    { id: 'sampleIodine', label: 'Sample Titration', onUpdate: (val: string) => setSample(val) },
    { id: 'sampleWeightIodine', label: 'Sample Weight', onUpdate: (val: string) => setSampleWeight(val) },
  ];

  const voiceResultText = iodineValue !== null ? `The Iodine Value is ${iodineValue.toFixed(3)}.` : undefined;

  return (
    <CalculatorWrapper
      title="Iodine Value Calculator"
      description="Calculate the Iodine Value (IV) which measures the degree of unsaturation in a substance."
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
      voiceConfig={voiceConfig}
      voiceResultText={voiceResultText}
      onShareSnapshot={getSnapshotUrl}
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
                Use the mic icon to enter titration data via voice.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
               <section>
                <h4 className="font-semibold text-md mb-2">Voice Commands</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>"Set blank titration to thirty"</li>
                  <li>"Sample titration is ten point five"</li>
                  <li>"Read the answer"</li>
                </ul>
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