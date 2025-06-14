"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';

const AcidValueCalculatorPage: React.FC = () => {
  const [mlTitrated, setMlTitrated] = useState<string>('');
  const [sampleWeight, setSampleWeight] = useState<string>('');
  const [acidValue, setAcidValue] = useState<number | null>(null);

  useEffect(() => {
    const ml = parseFloat(mlTitrated);
    const wt = parseFloat(sampleWeight);

    if (!isNaN(ml) && !isNaN(wt) && wt > 0) {
      const av = (ml * 5.611) / wt;
      setAcidValue(av);
    } else {
      setAcidValue(null);
    }
  }, [mlTitrated, sampleWeight]);

  const formula = "(ML Titrated * 5.611) / Sample Weight";
  const resultsToCopy = useMemo(() => {
    if (acidValue === null) return "";
    return `Acid Value Calculation:
ML Titrated: ${mlTitrated} mL
Sample Weight: ${sampleWeight} g
Acid Value: ${acidValue.toFixed(3)} mg KOH/g`;
  }, [mlTitrated, sampleWeight, acidValue]);

  return (
    <CalculatorWrapper
      title="Acid Value Calculator"
      description="Calculate the Acid Value (AV) of a sample based on titration volume and sample weight."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="mlTitrated"
          label="Titrant Volume"
          unit="mL"
          value={mlTitrated}
          onChange={(e) => setMlTitrated(e.target.value)}
          placeholder="e.g., 1.5"
          tooltipText="Enter the volume of titrant (e.g., KOH solution) used in mL."
        />
        <CommonInput
          id="sampleWeight"
          label="Sample Weight"
          unit="g"
          value={sampleWeight}
          onChange={(e) => setSampleWeight(e.target.value)}
          placeholder="e.g., 10.0"
          tooltipText="Enter the weight of the sample in grams."
        />
        <ResultDisplay label="Acid Value" value={acidValue} unit="mg KOH/g" variant="highlight" />
      </div>
    </CalculatorWrapper>
  );
};

export default AcidValueCalculatorPage;
