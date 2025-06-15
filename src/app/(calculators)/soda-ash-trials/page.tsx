
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

const SodaAshTrialsCalculatorPage: React.FC = () => {
  const [acidValue, setAcidValue] = useState<string>('');
  const [batchWeight, setBatchWeight] = useState<string>('');
  const [sodaAshAmount, setSodaAshAmount] = useState<number | null>(null);
  const [isMinimumApplied, setIsMinimumApplied] = useState<boolean>(false);

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

  const formula = `Soda Ash Amount = (5 * AV * Batch Weight) / 159`;
  const formulaTooltip = `AV: Acid Value. If the calculated amount is less than ${MINIMUM_ADD_AMOUNT}, the amount defaults to ${MINIMUM_ADD_AMOUNT}.`;

  const resultsToCopy = useMemo(() => {
    if (sodaAshAmount === null) return "";
    let text = `Soda Ash Trials Calculation:
Acid Value (AV): ${acidValue}
Batch Weight: ${batchWeight} units
Calculated Soda Ash Add Amount: ${sodaAshAmount.toFixed(3)} units`;
    if (isMinimumApplied) {
      text += `\n(Note: Minimum add amount of ${MINIMUM_ADD_AMOUNT} units applied)`;
    }
    return text;
  }, [acidValue, batchWeight, sodaAshAmount, isMinimumApplied]);

  return (
    <CalculatorWrapper
      title="Soda Ash Trials Calculator"
      description={`Calculate the amount of soda ash needed for trials based on Acid Value and Batch Weight. A minimum add of ${MINIMUM_ADD_AMOUNT} units applies.`}
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="acidValue"
          label="Acid Value (AV)"
          value={acidValue}
          onChange={(e) => setAcidValue(e.target.value)}
          placeholder="e.g., 10.0"
          tooltipText="Enter the Acid Value of the sample."
        />
        <CommonInput
          id="batchWeightSodaAsh"
          label="Batch Weight"
          unit="units"
          value={batchWeight}
          onChange={(e) => setBatchWeight(e.target.value)}
          placeholder="e.g., 1000"
          tooltipText="Enter the total weight of the trial batch (e.g., in grams or pounds)."
        />
        <ResultDisplay label="Soda Ash Add Amount" value={sodaAshAmount} unit="units" variant="highlight" />
        {isMinimumApplied && (
          <div className="flex items-center p-3 text-sm text-orange-700 bg-orange-100 border border-orange-300 rounded-md dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500/50">
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Note: Minimum add amount of {MINIMUM_ADD_AMOUNT} units has been applied.</span>
          </div>
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
              <DialogTitle className="text-xl">How to Use the Soda Ash Trials Calculator</DialogTitle>
              <DialogDescription>
                This calculator determines the amount of soda ash to add for trials based on the sample's Acid Value (AV) and the desired batch weight.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Acid Value (AV)</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the Acid Value (AV) of the substance you are working with.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">10.0</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input Batch Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the total weight of your trial batch. The units for batch weight (e.g., grams, pounds) will be the same as the units for the "Soda Ash Add Amount".
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">1000 units</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Understanding the Result</h4>
                <p className="mb-1 text-muted-foreground">
                  The calculator will display the "Soda Ash Add Amount". The formula used is:
                </p>
                <code className="block my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="font-semibold mt-2">Minimum Add Rule:</p>
                <p className="text-muted-foreground">
                  If the calculated soda ash amount is less than {MINIMUM_ADD_AMOUNT} units, the calculator will automatically set the "Soda Ash Add Amount" to {MINIMUM_ADD_AMOUNT} units. A notification will appear if this minimum is applied.
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

export default SodaAshTrialsCalculatorPage;
