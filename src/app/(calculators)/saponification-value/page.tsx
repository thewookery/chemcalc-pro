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

const SaponificationValueCalculatorPage: React.FC = () => {
  const [blankTitrated, setBlankTitrated] = useState<string>('');
  const [sampleTitrate, setSampleTitrate] = useState<string>('');
  const [sampleWeight, setSampleWeight] = useState<string>('');
  const [sapValue, setSapValue] = useState<number | null>(null);

  const liveData = useMemo(() => ({ blankTitrated, sampleTitrate, sampleWeight }), [blankTitrated, sampleTitrate, sampleWeight]);
  const { getSnapshotUrl } = useLiveCalculatorSync('saponification-value', liveData, (remote) => {
    if (remote.blankTitrated !== undefined) setBlankTitrated(remote.blankTitrated);
    if (remote.sampleTitrate !== undefined) setSampleTitrate(remote.sampleTitrate);
    if (remote.sampleWeight !== undefined) setSampleWeight(remote.sampleWeight);
  });

  useEffect(() => {
    const blank = parseFloat(blankTitrated);
    const sample = parseFloat(sampleTitrate);
    const wt = parseFloat(sampleWeight);

    if (!isNaN(blank) && !isNaN(sample) && !isNaN(wt) && wt > 0) {
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

  const voiceConfig = [
    { id: 'blankTitrated', label: 'Blank Titrated Volume', onUpdate: (val: string) => setBlankTitrated(val) },
    { id: 'sampleTitrate', label: 'Sample Titrate Volume', onUpdate: (val: string) => setSampleTitrate(val) },
    { id: 'sampleWeightSap', label: 'Sample Weight', onUpdate: (val: string) => setSampleWeight(val) },
  ];

  const voiceResultText = sapValue !== null ? `The Saponification Value is ${sapValue.toFixed(3)}.` : undefined;

  return (
    <CalculatorWrapper
      title="Saponification (Sap) Value Calculator"
      description="Calculate the Saponification Value from titration data and sample weight."
      formula={formula}
      resultsToCopy={resultsToCopy}
      voiceConfig={voiceConfig}
      voiceResultText={voiceResultText}
      onShareSnapshot={getSnapshotUrl}
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
                Perform saponification calculations using voice or manual input.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
               <section>
                <h4 className="font-semibold text-md mb-2">Voice Commands</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>"Set blank titrated volume to forty"</li>
                  <li>"Sample titrate volume is twenty five"</li>
                  <li>"Read the result"</li>
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

export default SaponificationValueCalculatorPage;