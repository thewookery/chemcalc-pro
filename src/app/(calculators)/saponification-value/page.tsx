"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';

const SaponificationValueCalculatorPage: React.FC = () => {
  const [blankTitrated, setBlankTitrated] = useState<string>('');
  const [sampleTitrate, setSampleTitrate] = useState<string>('');
  const [sampleWeight, setSampleWeight] = useState<string>('');
  const [sapValue, setSapValue] = useState<number | null>(null);

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

  const formula = "Sap Value = (Blank Titrated - Sample Titrate) * 28.05 / Sample Weight";
  const resultsToCopy = useMemo(() => {
    if (sapValue === null) return "";
    return `Saponification Value Calculation:
Blank Titrated: ${blankTitrated} mL
Sample Titrate: ${sampleTitrate} mL
Sample Weight: ${sampleWeight} g
Saponification Value: ${sapValue.toFixed(3)}`;
  }, [blankTitrated, sampleTitrate, sampleWeight, sapValue]);

  return (
    <CalculatorWrapper
      title="Saponification (Sap) Value Calculator"
      description="Calculate the Saponification Value from titration data and sample weight."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="blankTitrated"
          label="Blank Titrated"
          unit="mL"
          value={blankTitrated}
          onChange={(e) => setBlankTitrated(e.target.value)}
          placeholder="e.g., 40.0"
          tooltipText="Volume of titrant used for the blank."
        />
        <CommonInput
          id="sampleTitrate"
          label="Sample Titrate"
          unit="mL"
          value={sampleTitrate}
          onChange={(e) => setSampleTitrate(e.target.value)}
          placeholder="e.g., 25.0"
          tooltipText="Volume of titrant used for the sample."
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
    </CalculatorWrapper>
  );
};

export default SaponificationValueCalculatorPage;
