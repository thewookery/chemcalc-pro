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
import { HelpCircle, AlertTriangle } from "lucide-react";
import { useLiveCalculatorSync } from '@/hooks/useLiveCalculatorSync';

const SodaAshTrialsCalculatorPage: React.FC = () => {
  const [acidValue, setAcidValue] = useState<string>('');
  const [batchWeight, setBatchWeight] = useState<string>('');
  const [sodaAshAmount, setSodaAshAmount] = useState<number | null>(null);
  const [isMinimumApplied, setIsMinimumApplied] = useState<boolean>(false);

  const liveData = useMemo(() => ({ acidValue, batchWeight }), [acidValue, batchWeight]);
  const { getSnapshotUrl } = useLiveCalculatorSync('soda-ash-trials', liveData, (remote) => {
    if (remote.acidValue !== undefined) setAcidValue(remote.acidValue);
    if (remote.batchWeight !== undefined) setBatchWeight(remote.batchWeight);
  });

  const MINIMUM_ADD_AMOUNT = 500;

  useEffect(() => {
    const av = parseFloat(acidValue);
    const wt = parseFloat(batchWeight);

    if (!isNaN(av) && !isNaN(wt) && wt > 0 && av >= 0) {
      const calculatedAmount = (5 * av * wt) / 159;
      if (calculatedAmount < MINIMUM_ADD_AMOUNT) {
        setSodaAshAmount(MINIMUM_ADD_AMOUNT);
        setIsMinimumApplied(true);
      } else {
        setSodaAshAmount(calculatedAmount);
        setIsMinimumApplied(false);
      }
    } else {
      setSodaAshAmount(null);
      setIsMinimumApplied(false);
    }
  }, [acidValue, batchWeight]);

  const formula = `Soda Ash Amount (lbs) = ((5 * AV) / 159) * Batch Weight (lbs)`;
  const resultsToCopy = useMemo(() => {
    if (sodaAshAmount === null) return "";
    let text = `Soda Ash Trials Calculation:\nAcid Value (AV): ${acidValue}\nBatch Weight: ${batchWeight} lbs\nCalculated Soda Ash Add Amount: ${sodaAshAmount.toFixed(3)} lbs`;
    if (isMinimumApplied) {
      text += `\n(Note: Minimum add amount of ${MINIMUM_ADD_AMOUNT} lbs applied)`;
    }
    return text;
  }, [acidValue, batchWeight, sodaAshAmount, isMinimumApplied]);

  const voiceConfig = [
    { id: 'acidValue', label: 'Acid Value', onUpdate: (val: string) => setAcidValue(val) },
    { id: 'batchWeightSodaAsh', label: 'Batch Weight', onUpdate: (val: string) => setBatchWeight(val) },
  ];

  const voiceResultText = sodaAshAmount !== null ? `The soda ash amount is ${sodaAshAmount.toFixed(2)} pounds.` : undefined;

  return (
    <CalculatorWrapper
      title="Soda Ash Trials Calculator"
      description={`Calculate the amount of soda ash needed for trials. A minimum add of ${MINIMUM_ADD_AMOUNT} lbs applies.`}
      formula={formula}
      resultsToCopy={resultsToCopy}
      voiceConfig={voiceConfig}
      voiceResultText={voiceResultText}
      onShareSnapshot={getSnapshotUrl}
    >
      <div className="space-y-4">
        <CommonInput
          id="acidValue"
          label="Acid Value (AV)"
          value={acidValue}
          onChange={(e) => setAcidValue(e.target.value)}
          placeholder="e.g., 10.0"
        />
        <CommonInput
          id="batchWeightSodaAsh"
          label="Batch Weight"
          unit="lbs"
          value={batchWeight}
          onChange={(e) => setBatchWeight(e.target.value)}
          placeholder="e.g., 1000"
        />
        <ResultDisplay label="Soda Ash Add Amount" value={sodaAshAmount} unit="lbs" variant="highlight" />
        {isMinimumApplied && (
          <div className="flex items-center p-3 text-sm text-orange-700 bg-orange-100 border border-orange-300 rounded-md dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500/50">
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Note: Minimum add amount of {MINIMUM_ADD_AMOUNT} lbs applied.</span>
          </div>
        )}
      </div>
      <div className="mt-8 pt-6 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <HelpCircle className="mr-2 h-4 w-4" /> How to use voice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Voice Control</DialogTitle>
              <DialogDescription>
                Click the mic and say: "Set acid value to twelve" or "Read the result".
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </CalculatorWrapper>
  );
};

export default SodaAshTrialsCalculatorPage;
