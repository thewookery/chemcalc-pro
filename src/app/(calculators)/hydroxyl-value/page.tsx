
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';

const HydroxylValueCalculatorPage: React.FC = () => {
  const [blank, setBlank] = useState<string>('');
  const [sample, setSample] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [acidValue, setAcidValue] = useState<string>(''); // AV is an input here
  const [hydroxylValue, setHydroxylValue] = useState<number | null>(null);

  useEffect(() => {
    const b = parseFloat(blank);
    const s = parseFloat(sample);
    const wt = parseFloat(weight);
    const av = parseFloat(acidValue); // AV input

    if (!isNaN(b) && !isNaN(s) && !isNaN(wt) && !isNaN(av) && wt > 0) {
      // Corrected formula: OH = (((Blank - Sample) * 0.5 * 56.11) / Weight) + AV
      // The factor 0.5 often represents the Normality of KOH.
      const ohIntermediate = ((b - s) * 0.5 * 56.11) / wt;
      const ohFinal = ohIntermediate + av;
      setHydroxylValue(ohFinal);
    } else {
      setHydroxylValue(null);
    }
  }, [blank, sample, weight, acidValue]);

  const formula = "OH Value = (((Blank - Sample) * 0.5 * 56.11) / Weight) + Acid Value";
  const formulaTooltip = "This formula calculates the Hydroxyl Value. It first determines an intermediate value based on titration volumes (Blank, Sample), sample weight, and a constant (0.5 * 56.11, where 0.5 is often titrant normality and 56.11 is MW of KOH). The sample's Acid Value (AV) is then added to this intermediate value.";

  const resultsToCopy = useMemo(() => {
    if (hydroxylValue === null) return "";
    return `Hydroxyl Value Calculation:
Blank Titration: ${blank} mL
Sample Titration: ${sample} mL
Sample Weight: ${weight} g
Acid Value (AV): ${acidValue} mg KOH/g
Hydroxyl Value: ${hydroxylValue.toFixed(3)} mg KOH/g`;
  }, [blank, sample, weight, acidValue, hydroxylValue]);
  
  return (
    <CalculatorWrapper
      title="Hydroxyl (OH) Value Calculator"
      description="Determine the Hydroxyl Value. Input blank and sample titration values, sample weight, and the sample's Acid Value (AV)."
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
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
        <ResultDisplay label="Hydroxyl Value" value={hydroxylValue} unit="mg KOH/g" variant="highlight" />
      </div>
    </CalculatorWrapper>
  );
};

export default HydroxylValueCalculatorPage;
