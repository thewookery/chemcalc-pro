
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, PlusCircle, Layers } from 'lucide-react';
import type { BatchTicketComponentInput, CalculatedExcessComponent } from '@/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface FormData {
  totalUnitsToAddToBatch: string;
  components: BatchTicketComponentInput[];
}

const MultipleComponentsExcessAddPage: React.FC = () => {
  const { register, control, watch, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      totalUnitsToAddToBatch: '',
      components: [{ name: '', percentageFromTicket: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const watchedComponents = watch('components');
  const watchedTotalUnitsToAddToBatch = watch('totalUnitsToAddToBatch');

  const [calculatedResults, setCalculatedResults] = useState<CalculatedExcessComponent[]>([]);
  const [totalOriginalPercentage, setTotalOriginalPercentage] = useState<number>(0);
  const [sumOfStandardizedPercentage, setSumOfStandardizedPercentage] = useState<number>(0);
  const [sumOfCalculatedUnitsToAdd, setSumOfCalculatedUnitsToAdd] = useState<number>(0);

  useEffect(() => {
    const parsedTotalUnits = parseFloat(watchedTotalUnitsToAddToBatch);
    let currentTotalOriginalPerc = 0;
    const tempResults: CalculatedExcessComponent[] = [];

    watchedComponents.forEach(comp => {
      const perc = parseFloat(comp.percentageFromTicket);
      if (!isNaN(perc) && perc > 0) {
        currentTotalOriginalPerc += perc;
      }
    });
    setTotalOriginalPercentage(currentTotalOriginalPerc);

    let currentSumOfStandardizedPerc = 0;
    let currentSumOfUnitsToAdd = 0;

    if (currentTotalOriginalPerc > 0) {
      watchedComponents.forEach(comp => {
        const originalPerc = parseFloat(comp.percentageFromTicket);
        if (!isNaN(originalPerc) && originalPerc > 0) {
          const standardizedPerc = (originalPerc / currentTotalOriginalPerc) * 100;
          currentSumOfStandardizedPerc += standardizedPerc;
          
          let unitsForThisComponent = NaN;
          if (!isNaN(parsedTotalUnits) && parsedTotalUnits > 0) {
            unitsForThisComponent = (standardizedPerc / 100) * parsedTotalUnits;
            if(!isNaN(unitsForThisComponent)) {
                 currentSumOfUnitsToAdd += unitsForThisComponent;
            }
          }
          tempResults.push({
            name: comp.name || '',
            percentageFromTicket: originalPerc,
            standardizedPercentage: standardizedPerc,
            unitsToAdd: unitsForThisComponent,
          });
        } else {
            // Push placeholder for invalid/empty inputs to maintain row structure
             tempResults.push({
                name: comp.name || '',
                percentageFromTicket: NaN,
                standardizedPercentage: NaN,
                unitsToAdd: NaN,
            });
        }
      });
    } else {
        // If totalOriginalPerc is 0, create empty results for each component
        watchedComponents.forEach(comp => {
            tempResults.push({
                name: comp.name || '',
                percentageFromTicket: NaN,
                standardizedPercentage: NaN,
                unitsToAdd: NaN,
            });
        });
    }
    
    setCalculatedResults(tempResults);
    setSumOfStandardizedPercentage(currentSumOfStandardizedPerc);
    setSumOfCalculatedUnitsToAdd(currentSumOfUnitsToAdd);

  }, [watchedComponents, watchedTotalUnitsToAddToBatch]);

  const formula = "1. Standardized % = (Component % / Total Original %) * 100\n2. Units to Add = (Standardized % / 100) * Total Units to Add";
  
  const resultsToCopy = useMemo(() => {
    let text = `Multiple Components Excess Add Calculation:\n`;
    text += `Total Units to Add to Batch: ${watchedTotalUnitsToAddToBatch}\n\n`;
    text += `Components (% from Batch Ticket):\n`;
    watchedComponents.forEach((comp, index) => {
      text += `  - ${comp.name || `Component ${index+1}`}: ${comp.percentageFromTicket}%\n`;
    });
    text += `Total Original % from Batch Ticket: ${totalOriginalPercentage.toFixed(2)}%\n\n`;
    text += `Calculated Breakdown:\n`;
    text += `Component Name | % from Ticket | Standardized % | Units to Add\n`;
    text += `------------------------------------------------------------------\n`;
    calculatedResults.forEach(res => {
      text += `${res.name.padEnd(14)} | ${isNaN(res.percentageFromTicket) ? 'N/A'.padEnd(13) : (res.percentageFromTicket.toFixed(2) + '%').padEnd(13)} | ${isNaN(res.standardizedPercentage) ? 'N/A'.padEnd(14) : (res.standardizedPercentage.toFixed(2) + '%').padEnd(14)} | ${isNaN(res.unitsToAdd) ? 'N/A' : res.unitsToAdd.toFixed(3)}\n`;
    });
    text += `\nSum of Standardized Percentages: ${sumOfStandardizedPercentage.toFixed(2)}%\n`;
    text += `Sum of Calculated Units to Add: ${sumOfCalculatedUnitsToAdd.toFixed(3)}\n`;
    return text;
  }, [watchedTotalUnitsToAddToBatch, watchedComponents, totalOriginalPercentage, calculatedResults, sumOfStandardizedPercentage, sumOfCalculatedUnitsToAdd]);

  return (
    <CalculatorWrapper
      title="Multiple Components Excess Add Calculator"
      description="Standardize component percentages from a batch ticket and calculate how much of each to add for a total excess addition."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <form onSubmit={handleSubmit(() => { /* Calculations are real-time */ })} className="space-y-6">
        <CommonInput
          id="totalUnitsToAddToBatch"
          label="Total Units to Add to Batch"
          unit="Units"
          {...register('totalUnitsToAddToBatch', { valueAsNumber: true, min: {value: 0, message: "Must be positive"} })}
          placeholder="e.g., 20"
          tooltipText="The total combined amount of all excess components you intend to add."
          errorMessage={errors.totalUnitsToAddToBatch?.message}
        />

        <Separator />

        <div>
          <Label className="text-lg font-semibold">Component Percentages from Batch Ticket</Label>
          <p className="text-sm text-muted-foreground mb-3">Enter each component and its percentage as listed on the original batch ticket.</p>
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-end p-3 mb-2 border rounded-md bg-muted/20">
              <div className="space-y-1">
                <Label htmlFor={`components.${index}.name`} className="text-xs">Name</Label>
                <Input
                  id={`components.${index}.name`}
                  placeholder={`Component ${index + 1}`}
                  {...register(`components.${index}.name`)}
                  className="h-9"
                />
              </div>
              
              <CommonInput
                id={`components.${index}.percentageFromTicket`}
                label="Batch Ticket %"
                className="h-9 calculator-input text-input-foreground"
                unit="%"
                placeholder="e.g., 78.89"
                {...register(`components.${index}.percentageFromTicket`, { valueAsNumber: true, min: {value: 0, message: "% must be positive"} })}
                errorMessage={errors.components?.[index]?.percentageFromTicket?.message}
              />

              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="self-center md:self-end" aria-label="Remove component">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex justify-between items-center mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', percentageFromTicket: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Component
            </Button>
            <div className="text-right">
                 <p className="text-sm text-muted-foreground">Total Original % from Ticket:</p>
                 <p className="text-lg font-semibold">{totalOriginalPercentage.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {calculatedResults.length > 0 && (
          <div className="mt-6 space-y-4">
             <Separator />
            <h3 className="text-xl font-semibold">Calculated Breakdown</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component Name</TableHead>
                  <TableHead className="text-right">Original %</TableHead>
                  <TableHead className="text-right">Standardized %</TableHead>
                  <TableHead className="text-right">Units to Add</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculatedResults.map((comp, index) => (
                  <TableRow key={index}>
                    <TableCell>{comp.name || `Component ${index + 1}`}</TableCell>
                    <TableCell className="text-right">{isNaN(comp.percentageFromTicket) ? '-' : `${comp.percentageFromTicket.toFixed(2)}%`}</TableCell>
                    <TableCell className="text-right">{isNaN(comp.standardizedPercentage) ? '-' : `${comp.standardizedPercentage.toFixed(2)}%`}</TableCell>
                    <TableCell className="text-right">{isNaN(comp.unitsToAdd) ? '-' : comp.unitsToAdd.toFixed(3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <ResultDisplay label="Sum of Standardized %" value={sumOfStandardizedPercentage} unit="%" />
                <ResultDisplay label="Sum of Calculated Units to Add" value={sumOfCalculatedUnitsToAdd} unit="Units" />
            </div>
             { Math.abs(parseFloat(watchedTotalUnitsToAddToBatch) - sumOfCalculatedUnitsToAdd) > 0.001 && !isNaN(parseFloat(watchedTotalUnitsToAddToBatch)) && sumOfCalculatedUnitsToAdd > 0 && (
                <p className="text-sm text-orange-500">
                    Note: The sum of calculated units to add ({sumOfCalculatedUnitsToAdd.toFixed(3)}) does not exactly match the total units to add input ({parseFloat(watchedTotalUnitsToAddToBatch).toFixed(3)}). This may be due to rounding or if total original % is zero.
                </p>
            )}
          </div>
        )}
      </form>
    </CalculatorWrapper>
  );
};

export default MultipleComponentsExcessAddPage;
