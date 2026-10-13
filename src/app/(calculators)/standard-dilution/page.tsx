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

const StandardDilutionPage: React.FC = () => {
  const [m1, setM1] = useState<string>(''); 
  const [m2, setM2] = useState<string>(''); 
  const [v2, setV2] = useState<string>(''); 
  const [v1, setV1] = useState<number | null>(null); 
  const [waterToAdd, setWaterToAdd] = useState<number | null>(null); 

  const liveData = useMemo(() => ({ m1, m2, v2 }), [m1, m2, v2]);
  const { getSnapshotUrl } = useLiveCalculatorSync('standard-dilution', liveData, (remote) => {
    if (remote.m1 !== undefined) setM1(remote.m1);
    if (remote.m2 !== undefined) setM2(remote.m2);
    if (remote.v2 !== undefined) setV2(remote.v2);
  });

  useEffect(() => {
    const stockConc = parseFloat(m1);
    const targetConc = parseFloat(m2);
    const finalVol = parseFloat(v2);

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

  const voiceConfig = [
    { id: 'm1', label: 'Stock Concentration', onUpdate: (val: string) => setM1(val) },
    { id: 'm2', label: 'Target Concentration', onUpdate: (val: string) => setM2(val) },
    { id: 'v2', label: 'Final Volume', onUpdate: (val: string) => setV2(val) },
  ];

  const voiceResultText = v1 !== null ? `Use ${v1.toFixed(2)} units of stock and add ${waterToAdd?.toFixed(2)} units of diluent.` : undefined;

  return (
    <CalculatorWrapper
      title="Standard Dilution Calculator (M1V1 = M2V2)"
      description="Calculate the volume of stock solution needed and the volume of diluent to add."
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
      voiceConfig={voiceConfig}
      voiceResultText={voiceResultText}
      onShareSnapshot={getSnapshotUrl}
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
              <HelpCircle className="mr-2 h-4 w-4" /> How to use voice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Standard Dilution Voice Control</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">Voice Commands</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>"Stock concentration is fifty percent"</li>
                  <li>"Set target concentration to ten percent"</li>
                  <li>"Final volume is five hundred mL"</li>
                  <li>"Read the volumes"</li>
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

export default StandardDilutionPage;