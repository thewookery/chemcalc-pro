"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';

const IodineValueCalculatorPage: React.FC = () => {
  const [blank, setBlank] = useState<string>('');
  const [sample, setSample] = useState<string>('');
  const [sampleWeight, setSampleWeight] = useState<string>(''); // Added based on thought process
  const [iodineValue, setIodineValue] = useState<number | null>(null);

  // Constants from formula: (Blank - Sample) * 0.1 * 12.7 / Weight
  // Let's use 0.1 * 12.7 = 1.27 as the factor
  const FACTOR = 1.27;

  useEffect(() => {
    const b = parseFloat(blank);
    const s = parseFloat(sample);
    const wt = parseFloat(sampleWeight);

    if (!isNaN(b) && !isNaN(s) && !isNaN(wt) && wt > 0) {
      // Original prompt: Iodine Value = (Blank - Sample) * 0.1 * 12.7 / 0.3
      // Interpreted as: Iodine Value = (Blank - Sample) * FACTOR / Sample_Weight
      const iv = ((b - s) * FACTOR) / wt;
      setIodineValue(iv);
    } else {
      setIodineValue(null);
    }
  }, [blank, sample, sampleWeight]);

  const formula = `Iodine Value = (Blank - Sample) * ${FACTOR} / Sample Weight`;
  const formulaTooltip = `The factor ${FACTOR} is derived from (0.1 * 12.7) as per the typical calculation involving thiosulfate normality and iodine's atomic weight.`;
  
  const resultsToCopy = useMemo(() => {
    if (iodineValue === null) return "";
    return `Iodine Value Calculation:
Blank Titration: ${blank} mL
Sample Titration: ${sample} mL
Sample Weight: ${sampleWeight} g
Iodine Value: ${iodineValue.toFixed(3)} g I₂/100g`;
  }, [blank, sample, sampleWeight, iodineValue]);

  return (
    <CalculatorWrapper
      title="Iodine Value Calculator"
      description="Calculate the Iodine Value (IV) which measures the degree of unsaturation."
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
          tooltipText="Volume of titrant (e.g., sodium thiosulfate) for the blank."
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
          tooltipText="Weight of the sample in grams. The original example used 0.3g."
        />
        <ResultDisplay label="Iodine Value" value={iodineValue} unit="g I₂/100g" variant="highlight" />
      </div>
    </CalculatorWrapper>
  );
};

export default IodineValueCalculatorPage;
