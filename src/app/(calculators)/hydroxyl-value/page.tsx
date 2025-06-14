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
      // OH = ((Blank - Sample) * N_KOH * 56.11) / Weight + AV
      // The provided formula: OH = ((Blank - Sample) * 0.5 * 56.11) / (Weight * AV) is unusual.
      // A more common formula is: OH Value = [((B - S) * Normality of KOH * 56.1) / Sample Weight] + Acid Value
      // Assuming 0.5 is Normality of KOH.
      // The provided formula uses (Weight * AV) in denominator, which seems incorrect if AV is to be added or subtracted.
      // Let's implement the provided formula: ((Blank - Sample) * 0.5 * 56.11) / (Weight * AV)
      // If AV is 0, this will lead to division by zero. Add check for AV > 0 if it's in denominator.
      // For now, I'll assume AV is part of the calculation as described and not an additive correction, if it's in denominator.
      // If AV is truly meant to be an additive correction, the formula would be:
      // OH_calc = ((B-S) * 0.5 * 56.11) / Wt;  OH_final = OH_calc + AV (or -AV, or similar adjustment)
      // Using the given formula: OH = ((Blank - Sample) * 0.5 * 56.11) / (Weight * AV)
      // This formula only works if AV is not zero.
      // User prompt formula: OH = ((Blank - Sample) * 0.5 * 56.11) / (Weight * AV)

      if (av !== 0) { // ensure AV is not zero for the denominator
        const oh = ((b - s) * 0.5 * 56.11) / (wt * av);
        setHydroxylValue(oh);
      } else if (wt > 0) { // If AV is zero, perhaps the formula should not include AV in denom? Or result is undefined.
        // A common simplified OH value (if no free acid or ester is present, or AV is handled separately)
        // OH = ((B - S) * Normality * 56.1) / Wt. Using 0.5 as normality.
        // const oh_simplified = ((b-s) * 0.5 * 56.11) / wt;
        // For now, if AV is zero, and it's in denominator, the result is undefined with the given formula.
        setHydroxylValue(null); // Or handle as an error/warning
      } else {
        setHydroxylValue(null);
      }

    } else {
      setHydroxylValue(null);
    }
  }, [blank, sample, weight, acidValue]);

  const formula = "OH Value = ((Blank - Sample) * 0.5 * 56.11) / (Weight * Acid Value)";
  const formulaTooltip = "This formula assumes Acid Value (AV) is used in the denominator. Ensure AV is not zero. A common alternative hydroxyl value calculation adds the Acid Value at the end: [((B-S) * N_KOH * 56.1) / W] + AV.";

  const resultsToCopy = useMemo(() => {
    if (hydroxylValue === null) return "";
    return `Hydroxyl Value Calculation:
Blank Titration: ${blank} mL
Sample Titration: ${sample} mL
Sample Weight: ${weight} g
Acid Value (AV): ${acidValue}
Hydroxyl Value: ${hydroxylValue.toFixed(3)} mg KOH/g`;
  }, [blank, sample, weight, acidValue, hydroxylValue]);
  
  return (
    <CalculatorWrapper
      title="Hydroxyl (OH) Value Calculator"
      description="Determine the Hydroxyl Value. Input the blank and sample titration values, sample weight, and the sample's Acid Value (AV)."
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
          tooltipText="Volume of titrant for the blank run."
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
          tooltipText="Acid Value of the sample. If AV is 0, the provided formula might be problematic."
        />
        <ResultDisplay label="Hydroxyl Value" value={hydroxylValue} unit="mg KOH/g" variant="highlight" />
        {parseFloat(acidValue) === 0 && parseFloat(weight)>0 && !isNaN(parseFloat(blank)) && !isNaN(parseFloat(sample)) && (
            <p className="text-sm text-orange-600 dark:text-orange-400">Warning: Acid Value is 0. The provided formula results in division by zero or an undefined value.</p>
        )}
      </div>
    </CalculatorWrapper>
  );
};

export default HydroxylValueCalculatorPage;
