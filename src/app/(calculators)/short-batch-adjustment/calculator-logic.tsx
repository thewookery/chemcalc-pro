
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, Save, Upload, AlertTriangle, HelpCircle } from 'lucide-react';
import type { SavedBatch, AdjustedComponent } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogClose,
  DialogContent as HelpDialogContent, 
  DialogDescription as HelpDialogDescription,
  DialogFooter as HelpDialogFooter,
  DialogHeader as HelpDialogHeader,
  DialogTitle as HelpDialogTitle,
  DialogTrigger as HelpDialogTrigger,
  Dialog as HelpDialog,
} from "@/components/ui/dialog";


interface FormData {
  availableLimitingMaterialWt: string;
  ticketLimitingMaterialWt: string;
  originalStandardTotalBatchWt: string;
  targetBatchWeightForComponents: string; 
  components: { name: string; standardPercentage: string }[];
  saveBatchName: string;
}

const SAVED_BATCHES_KEY = 'chemcalc_savedShortBatches_v3_formula_percentage';

const ShortBatchAdjustmentCalculatorLogic: React.FC = () => {
  const { toast } = useToast();
  const [savedBatches, setSavedBatches] = useLocalStorage<SavedBatch[]>(SAVED_BATCHES_KEY, []);
  const [selectedBatchToLoad, setSelectedBatchToLoad] = useState<string>('');

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      availableLimitingMaterialWt: '',
      ticketLimitingMaterialWt: '',
      originalStandardTotalBatchWt: '',
      targetBatchWeightForComponents: '',
      components: [{ name: '', standardPercentage: '' }],
      saveBatchName: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const watchedAvailableLimitingMaterialWt = watch('availableLimitingMaterialWt');
  const watchedTicketLimitingMaterialWt = watch('ticketLimitingMaterialWt');
  const watchedOriginalStandardTotalBatchWt = watch('originalStandardTotalBatchWt');
  const watchedTargetBatchWeightForComponents = watch('targetBatchWeightForComponents');
  const watchedComponents = watch('components');

  const [calculatedAdjustedTotalBatchWeight, setCalculatedAdjustedTotalBatchWeight] = useState<number | null>(null);
  const [componentBreakdownResults, setComponentBreakdownResults] = useState<AdjustedComponent[]>([]);
  const [sumOfCalculatedComponentWeights, setSumOfCalculatedComponentWeights] = useState<number | null>(null);
  const [totalStandardPercentage, setTotalStandardPercentage] = useState<number>(0);

  // Step 1: Calculate Adjusted Total Batch Weight from Limiting Material
  useEffect(() => {
    const availWt = parseFloat(watchedAvailableLimitingMaterialWt);
    const ticketWt = parseFloat(watchedTicketLimitingMaterialWt);
    const origTotalWt = parseFloat(watchedOriginalStandardTotalBatchWt);

    if (!isNaN(availWt) && !isNaN(ticketWt) && ticketWt > 0 && !isNaN(origTotalWt) && origTotalWt > 0 && availWt >=0) {
      const adjustedWt = (availWt / ticketWt) * origTotalWt;
      setCalculatedAdjustedTotalBatchWeight(adjustedWt);
      
      // Auto-fill Target Batch Weight in Part 2, but only if it's currently empty or was previously auto-filled
      if (!watchedTargetBatchWeightForComponents || watchedTargetBatchWeightForComponents === "") {
        setValue('targetBatchWeightForComponents', adjustedWt.toFixed(4));
      }
    } else {
      setCalculatedAdjustedTotalBatchWeight(null);
    }
  }, [watchedAvailableLimitingMaterialWt, watchedTicketLimitingMaterialWt, watchedOriginalStandardTotalBatchWt, setValue, watchedTargetBatchWeightForComponents]);

  // Step 2: Calculate Breakdown based on Target Batch Weight
  useEffect(() => {
    const targetBatchWtNum = parseFloat(watchedTargetBatchWeightForComponents);
    let currentTotalPercentage = 0;
    const newBreakdownResults: AdjustedComponent[] = [];
    let newSumOfWeights = 0;

    const validTargetBatchWt = (!isNaN(targetBatchWtNum) && isFinite(targetBatchWtNum) && targetBatchWtNum >= 0) ? targetBatchWtNum : NaN;

    watchedComponents.forEach(comp => {
      const compName = comp.name || '';
      const compStdPerc = parseFloat(comp.standardPercentage);
      const validCompStdPerc = (!isNaN(compStdPerc) && isFinite(compStdPerc) && compStdPerc >= 0) ? compStdPerc : NaN;

      if (!isNaN(validCompStdPerc)) {
        currentTotalPercentage += validCompStdPerc;
      }

      let calculatedNewWeight = NaN;
      if (!isNaN(validTargetBatchWt) && !isNaN(validCompStdPerc)) {
        calculatedNewWeight = (validCompStdPerc / 100) * validTargetBatchWt;
        if (!isNaN(calculatedNewWeight) && isFinite(calculatedNewWeight)) {
             newSumOfWeights += calculatedNewWeight;
        } else {
            calculatedNewWeight = NaN; 
        }
      }
      
      newBreakdownResults.push({
        name: compName,
        standardPercentage: validCompStdPerc,
        newRequiredWeight: calculatedNewWeight,
      });
    });

    setTotalStandardPercentage(currentTotalPercentage);
    setComponentBreakdownResults(newBreakdownResults);
    
    if (!isNaN(newSumOfWeights) && isFinite(newSumOfWeights) && !isNaN(validTargetBatchWt) && newBreakdownResults.length > 0) {
        setSumOfCalculatedComponentWeights(newSumOfWeights);
    } else {
        setSumOfCalculatedComponentWeights(null);
    }

  }, [watchedTargetBatchWeightForComponents, watchedComponents]);

  const handleSaveBatch = () => {
    const batchName = watch('saveBatchName');
    const origStandardTotalWt = parseFloat(watchedOriginalStandardTotalBatchWt);

    if (!batchName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the formula.", variant: "destructive" });
      return;
    }
     if (isNaN(origStandardTotalWt) || origStandardTotalWt <= 0) {
      toast({ title: "Error", description: "Original Standard Total Batch Weight is required to save a formula.", variant: "destructive" });
      return;
    }

    const newSavedBatch: SavedBatch = {
      id: Date.now().toString(),
      name: batchName.trim(),
      originalStandardTotalBatchWeight: origStandardTotalWt,
      components: watchedComponents
        .filter(c => c.name && !isNaN(parseFloat(c.standardPercentage)))
        .map(c => ({ name: c.name, standardPercentage: parseFloat(c.standardPercentage) })),
      createdAt: new Date().toISOString(),
    };

    setSavedBatches([...savedBatches, newSavedBatch]);
    setValue('saveBatchName', '');
    toast({ title: "Success", description: `Formula "${newSavedBatch.name}" saved.` });
  };
  
  const handleLoadBatch = (batchId: string) => {
    const batchToLoad = savedBatches.find(b => b.id === batchId);
    if (batchToLoad) {
      reset({ 
        availableLimitingMaterialWt: '', 
        ticketLimitingMaterialWt: '',   
        originalStandardTotalBatchWt: String(batchToLoad.originalStandardTotalBatchWeight),
        targetBatchWeightForComponents: '', 
        components: batchToLoad.components.map(c => ({ name: c.name, standardPercentage: String(c.standardPercentage) })),
        saveBatchName: '',
      });
      setSelectedBatchToLoad(''); 
      toast({ title: "Configuration Loaded", description: `Formula "${batchToLoad.name}" loaded.` });
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    setSavedBatches(savedBatches.filter(b => b.id !== batchId));
    toast({ title: "Configuration Deleted", description: "The selected formula has been removed." });
  };

  const formula = "Part 1: Adj. Total Wt = (Avail. Limiting Wt / Ticket Limiting Wt) * Orig. Std. Total Wt. \nPart 2: New Comp. Wt = (Std. Comp. % / 100) * Target Batch Wt.";

  const resultsToCopy = useMemo(() => {
    let text = `Short Batch Adjustment Calculation:\n\n`;
    text += `== Part 1: Adjusted Total Batch Weight ==\n`;
    text += `Available Limiting Material: ${watchedAvailableLimitingMaterialWt}\n`;
    text += `Ticket Amount of Limiting: ${watchedTicketLimitingMaterialWt}\n`;
    text += `Original Standard Total Weight: ${watchedOriginalStandardTotalBatchWt}\n`;
    text += `Calculated Adjusted Total: ${calculatedAdjustedTotalBatchWeight !== null ? calculatedAdjustedTotalBatchWeight.toFixed(4) : 'N/A'}\n\n`;
    
    text += `== Part 2: Component Breakdown ==\n`;
    text += `Target Batch Weight: ${watchedTargetBatchWeightForComponents}\n`;
    componentBreakdownResults.forEach((comp) => {
      text += `  - ${comp.name || 'Unnamed'}: ${isNaN(comp.standardPercentage) ? 'N/A' : comp.standardPercentage.toFixed(2)}% => ${isNaN(comp.newRequiredWeight) ? 'N/A' : comp.newRequiredWeight.toFixed(4)}\n`;
    });
    text += `Sum of Components: ${sumOfCalculatedComponentWeights !== null ? sumOfCalculatedComponentWeights.toFixed(4) : 'N/A'}\n`;
    return text;
  }, [watchedAvailableLimitingMaterialWt, watchedTicketLimitingMaterialWt, watchedOriginalStandardTotalBatchWt, calculatedAdjustedTotalBatchWeight, watchedTargetBatchWeightForComponents, componentBreakdownResults, sumOfCalculatedComponentWeights]);

  return (
    <CalculatorWrapper
      title="Short Batch Adjustment Calculator"
      description="Calculates adjusted batch size based on a limiting material, then breaks down the new batch into component weights."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <div className="space-y-8">
        <form onSubmit={handleSubmit(() => {})} className="space-y-8">
          
          <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Part 1: Adjusted Total Batch Weight</h3>
            <CommonInput
              id="availableLimitingMaterialWt"
              label="Available Amount of Limiting Material"
              {...register('availableLimitingMaterialWt')}
              placeholder="e.g., 50"
              tooltipText="The quantity of the limiting raw material you have on hand."
            />
            <CommonInput
              id="ticketLimitingMaterialWt"
              label="Batch Ticket Amount of Limiting Material"
              {...register('ticketLimitingMaterialWt')}
              placeholder="e.g., 100"
              tooltipText="The amount of this material on a full standard ticket."
            />
            <CommonInput
              id="originalStandardTotalBatchWt"
              label="Original Standard Total Batch Weight"
              {...register('originalStandardTotalBatchWt')}
              placeholder="e.g., 100,000"
              tooltipText="Total weight of a full, standard batch."
            />
            <ResultDisplay label="Calculated Adjusted Total Weight" value={calculatedAdjustedTotalBatchWeight} variant="highlight" />
          </section>

          <Separator />

          <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Part 2: Component Breakdown</h3>
            <CommonInput
              id="targetBatchWeightForComponents"
              label="Target Batch Weight for Breakdown"
              {...register('targetBatchWeightForComponents')}
              placeholder="Auto-filled or manual"
              tooltipText="Total weight for the breakdown calculation."
            />
            
            <Label>Components (Standard %)</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 items-end p-3 border rounded-md bg-background/50">
                <div className="flex-grow space-y-1">
                  <Label htmlFor={`components.${index}.name`} className="text-xs">Name</Label>
                  <Input
                    id={`components.${index}.name`}
                    placeholder={`Material ${index + 1}`}
                    {...register(`components.${index}.name`)}
                  />
                </div>
                
                <CommonInput
                  id={`components.${index}.standardPercentage`}
                  label="Std. %"
                  unit="%"
                  className="h-9 calculator-input"
                  placeholder="25.00"
                  {...register(`components.${index}.standardPercentage`)}
                />

                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="self-center md:self-end">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <div className="flex justify-between items-center mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', standardPercentage: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Material
                </Button>
                <div className="text-sm font-medium">
                    Total Standard %: 
                    <span className={cn("ml-1", Math.abs(totalStandardPercentage - 100) > 0.001 ? "text-orange-500 font-bold" : "text-green-600 font-bold")}>
                        {totalStandardPercentage.toFixed(2)}%
                    </span>
                    {Math.abs(totalStandardPercentage - 100) > 0.001 && totalStandardPercentage > 0 && (
                      <AlertTriangle className="inline-block ml-1 h-4 w-4 text-orange-500" />
                    )}
                </div>
            </div>

            {componentBreakdownResults.length > 0 && watchedTargetBatchWeightForComponents && (
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Std. %</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {componentBreakdownResults.map((comp, index) => (
                      <TableRow key={index}>
                        <TableCell>{comp.name || `Material ${index + 1}`}</TableCell>
                        <TableCell className="text-right">{isNaN(comp.standardPercentage) ? "-" : `${comp.standardPercentage.toFixed(2)}%`}</TableCell>
                        <TableCell className="text-right">{isNaN(comp.newRequiredWeight) ? "-" : comp.newRequiredWeight.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ResultDisplay label="Sum of Component Weights" value={sumOfCalculatedComponentWeights} />
              </div>
            )}
          </section>
        </form>
      </div>
    </CalculatorWrapper>
  );
};

export default ShortBatchAdjustmentCalculatorLogic;
