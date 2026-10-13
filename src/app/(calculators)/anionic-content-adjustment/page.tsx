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

const AnionicContentAdjustmentPage: React.FC = () => {
  const [currentAnionic, setCurrentAnionic] = useState<string>('');
  const [desiredAnionic, setDesiredAnionic] = useState<string>('');
  const [batchWeight, setBatchWeight] = useState<string>('');
  const [waterToAdd, setWaterToAdd] = useState<number | null>(null);

  const liveData = useMemo(() => ({ currentAnionic, desiredAnionic, batchWeight }), [currentAnionic, desiredAnionic, batchWeight]);
  const { getSnapshotUrl } = useLiveCalculatorSync('anionic-content-adjustment', liveData, (remote) => {
    if (remote.currentAnionic !== undefined) setCurrentAnionic(remote.currentAnionic);
    if (remote.desiredAnionic !== undefined) setDesiredAnionic(remote.desiredAnionic);
    if (remote.batchWeight !== undefined) setBatchWeight(remote.batchWeight);
  });

  useEffect(() => {
    const current = parseFloat(currentAnionic);
    const desired = parseFloat(desiredAnionic);
    const batchWt = parseFloat(batchWeight);

    if (!isNaN(current) && !isNaN(desired) && !isNaN(batchWt) && desired > 0 && batchWt > 0 && current >= desired) {
      const finalBatchWeight = batchWt * (current / desired);
      const water = finalBatchWeight - batchWt;
      setWaterToAdd(water);
    } else {
      setWaterToAdd(null);
    }
  }, [currentAnionic, desiredAnionic, batchWeight]);

  const formula = "Water to Add (lbs) = Batch Weight * (Current Anionic % / Desired Anionic %) - Batch Weight";
  const formulaTooltip = "This formula calculates the amount of diluent (water) to add to reduce the anionic percentage from current to desired. Assumes Current Anionic % is greater than or equal to Desired Anionic %.";

  const resultsToCopy = useMemo(() => {
    if (waterToAdd === null) return "";
    return `Anionic Content Adjustment:
Current Anionic: ${currentAnionic} %
Desired Anionic: ${desiredAnionic} %
Batch Weight: ${batchWeight} lbs
Water to Add: ${waterToAdd.toFixed(4)} lbs`;
  }, [currentAnionic, desiredAnionic, batchWeight, waterToAdd]);

  const voiceConfig = [
    { id: 'currentAnionic', label: 'Current Anionic Percentage', onUpdate: (val: string) => setCurrentAnionic(val) },
    { id: 'desiredAnionic', label: 'Desired Anionic Percentage', onUpdate: (val: string) => setDesiredAnionic(val) },
    { id: 'batchWeightAnionic', label: 'Batch Weight', onUpdate: (val: string) => setBatchWeight(val) },
  ];

  const voiceResultText = waterToAdd !== null ? `Add ${waterToAdd.toFixed(2)} pounds of water.` : undefined;

  return (
    <CalculatorWrapper
      title="Anionic Content Adjustment"
      description="Calculate water to add to adjust anionic content (e.g., Setacin 103 SB US)."
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
      voiceConfig={voiceConfig}
      voiceResultText={voiceResultText}
      onShareSnapshot={getSnapshotUrl}
    >
      <div className="space-y-4">
        <CommonInput
          id="currentAnionic"
          label="Current Anionic %"
          unit="%"
          value={currentAnionic}
          onChange={(e) => setCurrentAnionic(e.target.value)}
          placeholder="e.g., 30.0"
          tooltipText="Current measured anionic percentage of the batch."
        />
        <CommonInput
          id="desiredAnionic"
          label="Desired Anionic %"
          unit="%"
          value={desiredAnionic}
          onChange={(e) => setDesiredAnionic(e.target.value)}
          placeholder="e.g., 28.0"
          tooltipText="Target anionic percentage. Must be less than or equal to current %."
        />
        <CommonInput
          id="batchWeightAnionic"
          label="Batch Weight"
          unit="lbs"
          value={batchWeight}
          onChange={(e) => setBatchWeight(e.target.value)}
          placeholder="e.g., 1000"
          tooltipText="Current weight of the batch in pounds."
        />
        <ResultDisplay label="Water to Add" value={waterToAdd} unit="lbs" variant="highlight" />
        {parseFloat(currentAnionic) < parseFloat(desiredAnionic) && !isNaN(parseFloat(currentAnionic)) && !isNaN(parseFloat(desiredAnionic)) && (
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Note: Desired % cannot be higher than current % for dilution. Use this calculator only for adjusting downward.</p>
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
              <DialogTitle className="text-xl">How to Use the Anionic Content Adjustment Calculator</DialogTitle>
              <DialogDescription>
                This calculator helps determine the amount of water (or other diluent) to add to a batch to reduce its anionic surfactant percentage to a desired level.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">Voice Commands</h4>
                <p className="text-muted-foreground italic mb-2">Try saying things like:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                  <li>"Set current anionic percentage to thirty"</li>
                  <li>"Desired anionic percentage is twenty eight"</li>
                  <li>"Read the result"</li>
                </ul>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Current Anionic %</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the current measured anionic percentage of your batch.
                </p>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input Desired Anionic %</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the target anionic percentage you want to achieve after dilution.
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

export default AnionicContentAdjustmentPage;