
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';

const SingleComponentExcessAddCalculatorPage: React.FC = () => {
  const [unitsToAdd, setUnitsToAdd] = useState<string>('');
  const [materialValue, setMaterialValue] = useState<string>(''); // AV or OH value
  const [percentageToAdd, setPercentageToAdd] = useState<number | null>(null);

  useEffect(() => {
    const uAdd = parseFloat(unitsToAdd);
    const mVal = parseFloat(materialValue);

    if (!isNaN(uAdd) && !isNaN(mVal) && mVal !== 0) {
      const pAdd = (uAdd / mVal) * 100;
      setPercentageToAdd(pAdd);
    } else {
      setPercentageToAdd(null);
    }
  }, [unitsToAdd, materialValue]);

  const formula = "(Units of Component to Add / AV or OH of Material) * 100";
  
  const resultsToCopy = useMemo(() => {
    if (percentageToAdd === null) return "";
    return `Single Component Excess Add Calculation:
Units of Component to Add: ${unitsToAdd}
AV or OH of Material: ${materialValue}
Percentage of Material to Add: ${percentageToAdd.toFixed(3)}%`;
  }, [unitsToAdd, materialValue, percentageToAdd]);

  return (
    <CalculatorWrapper
      title="Single Component Excess Add Calculator"
      description="Calculate the percentage of a single component (e.g., acid or alcohol) to add to a batch based on the units needed and the material's Acid Value (AV) or Hydroxyl Value (OH)."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="unitsToAdd"
          label="Units of Component to Add"
          unit="Units"
          value={unitsToAdd}
          onChange={(e) => setUnitsToAdd(e.target.value)}
          placeholder="e.g., 10"
          tooltipText="Enter the amount of the component (e.g., acid or alcohol) you need to add."
        />
        <CommonInput
          id="materialValue"
          label="AV or OH of Material"
          value={materialValue}
          onChange={(e) => setMaterialValue(e.target.value)}
          placeholder="e.g., 430"
          tooltipText="Enter the Acid Value (AV) or Hydroxyl Value (OH) of the material. This value must not be zero."
        />
        <ResultDisplay label="Percentage of Material to Add" value={percentageToAdd} unit="%" variant="highlight" />
        {parseFloat(materialValue) === 0 && !isNaN(parseFloat(materialValue)) && unitsToAdd !== '' && (
           <p className="text-sm text-orange-600 dark:text-orange-400">AV or OH of Material cannot be zero for this calculation.</p>
        )}
      </div>
    </CalculatorWrapper>
  );
};

export default SingleComponentExcessAddCalculatorPage;
