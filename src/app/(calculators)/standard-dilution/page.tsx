"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';

const StandardDilutionPage: React.FC = () => {
  const [m1, setM1] = useState<string>(''); // Stock concentration
  const [m2, setM2] = useState<string>(''); // Target concentration
  const [v2, setV2] = useState<string>(''); // Final volume
  const [v1, setV1] = useState<number | null>(null); // Volume of stock to use
  const [waterToAdd, setWaterToAdd] = useState<number | null>(null); // Water to add

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

  const formula = "V1 (Stock Volume) = (M2 * V2) / M1; Water to Add = V2 - V1";
  const formulaTooltip = "M1: Stock Concentration, V1: Stock Volume, M2: Target Concentration, V2: Final Volume. Ensure units for M1 & M2 are consistent, and V1 & V2 are consistent.";

  const resultsToCopy = useMemo(() => {
    if (v1 === null || waterToAdd === null) return "";
    return `Standard Dilution (M1V1 = M2V2):
Stock Concentration (M1): ${m1} (units)
Target Concentration (M2): ${m2} (units)
Final Volume (V2): ${v2} (units)
---
Volume of Stock to Use (V1): ${v1.toFixed(3)} (units)
Water/Diluent to Add: ${waterToAdd.toFixed(3)} (units)`;
  }, [m1, m2, v2, v1, waterToAdd]);

  return (
    <CalculatorWrapper
      title="Standard Dilution Calculator (M1V1 = M2V2)"
      description="Calculate the volume of stock solution needed and the volume of diluent to add."
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="m1"
          label="Stock Concentration (M1)"
          value={m1}
          onChange={(e) => setM1(e.target.value)}
          placeholder="e.g., 10 (M, %, etc.)"
          tooltipText="Concentration of your stock solution."
        />
        <CommonInput
          id="m2"
          label="Target Concentration (M2)"
          value={m2}
          onChange={(e) => setM2(e.target.value)}
          placeholder="e.g., 1 (M, %, etc.)"
          tooltipText="Desired final concentration."
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
          <p className="text-sm text-orange-600 dark:text-orange-400">Note: Stock concentration (M1) cannot be less than target concentration (M2) for dilution.</p>
        )}
      </div>
    </CalculatorWrapper>
  );
};

export default StandardDilutionPage;
