"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';

const AnionicContentAdjustmentPage: React.FC = () => {
  const [currentAnionic, setCurrentAnionic] = useState<string>('');
  const [desiredAnionic, setDesiredAnionic] = useState<string>('');
  const [batchWeight, setBatchWeight] = useState<string>('');
  const [waterToAdd, setWaterToAdd] = useState<number | null>(null);

  useEffect(() => {
    const current = parseFloat(currentAnionic);
    const desired = parseFloat(desiredAnionic);
    const batchWt = parseFloat(batchWeight);

    if (!isNaN(current) && !isNaN(desired) && !isNaN(batchWt) && desired > 0 && batchWt > 0 && current >= desired) {
      // Water to add = Initial Batch Weight * (Initial % / Final %) - Initial Batch Weight
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
Water to Add: ${waterToAdd.toFixed(3)} lbs`;
  }, [currentAnionic, desiredAnionic, batchWeight, waterToAdd]);

  return (
    <CalculatorWrapper
      title="Anionic Content Adjustment"
      description="Calculate water to add to adjust anionic content (e.g., Setacin 103 SB US)."
      formula={formula}
      formulaTooltip={formulaTooltip}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-4">
        <CommonInput
          id="currentAnionic"
          label="Current Anionic %"
          unit="%"
          value={currentAnionic}
          onChange={(e) => setCurrentAnionic(e.target.value)}
          placeholder="e.g., 30.0"
          tooltipText="Current anionic percentage of the batch."
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
          <p className="text-sm text-orange-600 dark:text-orange-400">Note: Desired % cannot be higher than current % for dilution with water.</p>
        )}
      </div>
    </CalculatorWrapper>
  );
};

export default AnionicContentAdjustmentPage;
