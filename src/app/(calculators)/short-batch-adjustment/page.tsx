
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, Save, Upload, AlertTriangle } from 'lucide-react';
import type { SavedBatch, AdjustedComponent, SavedBatchComponent } from '@/types';
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

interface FormData {
  availableLimitingMaterialWt: string;
  ticketLimitingMaterialWt: string;
  originalStandardTotalBatchWt: string;
  targetBatchWeightForComponents: string; // Can be auto-filled from Part 1 or manual
  components: { name: string; standardPercentage: string }[];
  saveBatchName: string;
}

const SAVED_BATCHES_KEY = 'chemcalc_savedShortBatches_v3_formula_percentage';

const ShortBatchAdjustmentPage: React.FC = () => {
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

  // Part 1: Calculate Adjusted Total Batch Weight
  useEffect(() => {
    const availWt = parseFloat(watchedAvailableLimitingMaterialWt);
    const ticketWt = parseFloat(watchedTicketLimitingMaterialWt);
    const origTotalWt = parseFloat(watchedOriginalStandardTotalBatchWt);

    if (!isNaN(availWt) && !isNaN(ticketWt) && ticketWt > 0 && !isNaN(origTotalWt) && origTotalWt > 0 && availWt >=0) {
      const adjustedWt = (availWt / ticketWt) * origTotalWt;
      setCalculatedAdjustedTotalBatchWeight(adjustedWt);
      if (!isNaN(adjustedWt) && isFinite(adjustedWt)) {
        setValue('targetBatchWeightForComponents', adjustedWt.toFixed(4), { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      } else {
        // If Part 1 calculation is invalid, don't auto-fill Part 2, allow manual entry
      }
    } else {
      setCalculatedAdjustedTotalBatchWeight(null);
      // If Part 1 inputs are incomplete/invalid, don't auto-fill Part 2
    }
  }, [watchedAvailableLimitingMaterialWt, watchedTicketLimitingMaterialWt, watchedOriginalStandardTotalBatchWt, setValue]);

  // Part 2: Calculate New Component Weights & Total Standard Percentage
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
    
    if (!isNaN(newSumOfWeights) && isFinite(newSumOfWeights) && !isNaN(validTargetBatchWt)) {
        setSumOfCalculatedComponentWeights(newSumOfWeights);
    } else {
        setSumOfCalculatedComponentWeights(null);
    }

  }, [watchedTargetBatchWeightForComponents, watchedComponents]);

  const handleSaveBatch = () => {
    const batchName = watch('saveBatchName');
    const origStandardTotalWt = parseFloat(watchedOriginalStandardTotalBatchWt);

    if (!batchName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the batch configuration.", variant: "destructive" });
      return;
    }
    if (savedBatches.find(b => b.name === batchName.trim())) {
       toast({ title: "Error", description: `A configuration named "${batchName.trim()}" already exists.`, variant: "destructive" });
       return;
    }
     if (isNaN(origStandardTotalWt) || origStandardTotalWt <= 0) {
      toast({ title: "Error", description: "Original Standard Total Batch Weight must be a positive number to save.", variant: "destructive" });
      return;
    }
    if (watchedComponents.length === 0 || watchedComponents.some(c => !c.name || !c.standardPercentage || isNaN(parseFloat(c.standardPercentage)))) {
      toast({ title: "Error", description: "At least one component with a valid name and standard percentage is required to save.", variant: "destructive" });
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
    toast({ title: "Success", description: `Batch configuration "${newSavedBatch.name}" saved.` });
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
      setCalculatedAdjustedTotalBatchWeight(null);
      setComponentBreakdownResults([]);
      setSumOfCalculatedComponentWeights(null);
      setSelectedBatchToLoad(''); 
      toast({ title: "Configuration Loaded", description: `Data for "${batchToLoad.name}" has been loaded.` });
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    setSavedBatches(savedBatches.filter(b => b.id !== batchId));
    toast({ title: "Configuration Deleted", description: "The selected configuration has been removed." });
  };

  const formula = "Part 1: Adj. Total Wt = (Avail. Limiting Wt / Ticket Limiting Wt) * Orig. Std. Total Wt. \nPart 2: New Comp. Wt = (Std. Comp. % / 100) * Target Batch Wt (from Part 1 or manual).";

  const resultsToCopy = useMemo(() => {
    let text = `Short Batch Adjustment Calculation:\n\n`;
    text += `== Part 1: Calculate Adjusted Total Batch Weight ==\n`;
    text += `Available Limiting Material Weight: ${watchedAvailableLimitingMaterialWt}\n`;
    text += `Batch Ticket Amount of Limiting Material: ${watchedTicketLimitingMaterialWt}\n`;
    text += `Original Standard Total Batch Weight: ${watchedOriginalStandardTotalBatchWt}\n`;
    text += `Calculated Adjusted Total Batch Weight: ${calculatedAdjustedTotalBatchWeight !== null && !isNaN(calculatedAdjustedTotalBatchWeight) ? calculatedAdjustedTotalBatchWeight.toFixed(4) : 'N/A'}\n\n`;
    
    text += `== Part 2: Calculate New Component Weights ==\n`;
    text += `Target Batch Weight for Components: ${watchedTargetBatchWeightForComponents}\n`;
    text += `Components (Standard % from Batch Ticket):\n`;
    componentBreakdownResults.forEach((comp, index) => {
      text += `  - ${comp.name || `Component ${index+1}`}: ${isNaN(comp.standardPercentage) ? 'N/A' : comp.standardPercentage.toFixed(2)}%  =>  New Required Weight: ${isNaN(comp.newRequiredWeight) ? 'N/A' : comp.newRequiredWeight.toFixed(4)}\n`;
    });
    text += `Sum of New Component Weights: ${sumOfCalculatedComponentWeights !== null && !isNaN(sumOfCalculatedComponentWeights) ? sumOfCalculatedComponentWeights.toFixed(4) : 'N/A'}\n`;
    if (totalStandardPercentage !== 100 && totalStandardPercentage > 0) {
      text += `Warning: Total standard percentage of components is ${totalStandardPercentage.toFixed(2)}%, not 100%.\n`;
    }
    return text;
  }, [watchedAvailableLimitingMaterialWt, watchedTicketLimitingMaterialWt, watchedOriginalStandardTotalBatchWt, calculatedAdjustedTotalBatchWeight, watchedTargetBatchWeightForComponents, componentBreakdownResults, sumOfCalculatedComponentWeights, totalStandardPercentage]);

  return (
    <CalculatorWrapper
      title="Short Batch Adjustment Calculator"
      description="Calculates adjusted batch size based on a limiting material, then breaks down the new batch into component weights using standard formula percentages."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <form onSubmit={handleSubmit(() => { /* Calculations are real-time via useEffect */ })} className="space-y-8">
        
        <section className="space-y-4 p-4 border rounded-md bg-muted/30">
          <h3 className="text-xl font-semibold mb-3 text-primary">Part 1: Determine Adjusted Total Batch Weight</h3>
          <CommonInput
            id="availableLimitingMaterialWt"
            label="Available Amount of Limiting Material"
            {...register('availableLimitingMaterialWt', { valueAsNumber: true, min: { value: 0, message: "Must be non-negative" } })}
            placeholder="e.g., 50"
            tooltipText="The actual amount of the single limiting raw material you have on hand."
            errorMessage={errors.availableLimitingMaterialWt?.message}
          />
          <CommonInput
            id="ticketLimitingMaterialWt"
            label="Batch Ticket Amount of Limiting Material"
            {...register('ticketLimitingMaterialWt', { valueAsNumber: true, min: { value: 0.0001, message: "Must be positive" } })}
            placeholder="e.g., 100"
            tooltipText="The amount of this limiting material specified on the original, full standard batch ticket."
            errorMessage={errors.ticketLimitingMaterialWt?.message}
          />
          <CommonInput
            id="originalStandardTotalBatchWt"
            label="Original Standard Total Batch Weight"
            {...register('originalStandardTotalBatchWt', { valueAsNumber: true, min: { value: 0.0001, message: "Must be positive" } })}
            placeholder="e.g., 100000"
            tooltipText="The total weight of the full, original standard batch as per the batch ticket."
            errorMessage={errors.originalStandardTotalBatchWt?.message}
          />
          <ResultDisplay label="Calculated Adjusted Total Batch Weight" value={calculatedAdjustedTotalBatchWeight} variant="highlight" />
        </section>

        <Separator />

        <section className="space-y-4 p-4 border rounded-md bg-muted/30">
          <h3 className="text-xl font-semibold mb-3 text-primary">Part 2: Calculate Component Weights for Adjusted Batch</h3>
          <CommonInput
            id="targetBatchWeightForComponents"
            label="Target Batch Weight for Components"
            {...register('targetBatchWeightForComponents', { valueAsNumber: true, min: { value: 0, message: "Must be non-negative" }})}
            placeholder="e.g., 50000 (auto-filled from Part 1 or enter manually)"
            tooltipText="The desired total weight for the new batch. Auto-filled from Part 1, or can be entered manually."
            errorMessage={errors.targetBatchWeightForComponents?.message}
          />
          
          <Label>Components (Standard % on Batch Ticket)</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 items-end p-3 border rounded-md bg-background/50">
              <div className="flex-grow space-y-1">
                <Label htmlFor={`components.${index}.name`} className="text-xs">Name</Label>
                <Input
                  id={`components.${index}.name`}
                  placeholder={`Component ${index + 1}`}
                  {...register(`components.${index}.name`)}
                  className={cn("h-9", errors.components?.[index]?.name && "border-destructive")}
                />
                {errors.components?.[index]?.name && <p className="text-xs text-destructive mt-1">{errors.components[index]?.name?.message}</p>}
              </div>
              
              <CommonInput
                id={`components.${index}.standardPercentage`}
                label="Standard %"
                unit="%"
                className="h-9 calculator-input text-input-foreground"
                placeholder="e.g., 25"
                {...register(`components.${index}.standardPercentage`, { 
                    valueAsNumber: true, 
                    min: {value: 0, message: "% >= 0"},
                    // max: {value: 100, message: "% <= 100"} // Max 100 for individual component is typical but not strictly required for math if sum can be >100
                })}
                errorMessage={errors.components?.[index]?.standardPercentage?.message}
              />

              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="self-center md:self-end" aria-label="Remove component">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex justify-between items-center mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', standardPercentage: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Component
              </Button>
              <div className="text-sm font-medium">
                  Total Standard %: 
                  <span className={cn("ml-1", totalStandardPercentage !== 100 && (totalStandardPercentage > 0 || watchedComponents.some(c => !!c.standardPercentage && !isNaN(parseFloat(c.standardPercentage)))) ? "text-orange-500 font-bold" : "text-green-600 font-bold")}>
                      {isNaN(totalStandardPercentage) ? 'N/A' : totalStandardPercentage.toFixed(2)}%
                  </span>
                  {totalStandardPercentage !== 100 && (totalStandardPercentage > 0 || watchedComponents.some(c => !!c.standardPercentage && !isNaN(parseFloat(c.standardPercentage)))) && (
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" aria-label="Total standard percentage warning">
                                  <AlertTriangle className="inline-block ml-1 h-4 w-4 text-orange-500" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>Total standard percentage of components does not sum to 100%. The sum of new component weights might not match the target batch weight.</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                  )}
              </div>
          </div>

          {componentBreakdownResults.length > 0 && (!isNaN(parseFloat(watchedTargetBatchWeightForComponents)) && parseFloat(watchedTargetBatchWeightForComponents) >= 0) && (
            <div className="mt-6">
              <h4 className="text-md font-medium mb-2">Component Breakdown for Target Batch Weight:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Standard %</TableHead>
                    <TableHead className="text-right">New Required Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {componentBreakdownResults.map((comp, index) => (
                    <TableRow key={index}>
                      <TableCell>{comp.name || `Component ${index + 1}`}</TableCell>
                      <TableCell className="text-right">{isNaN(comp.standardPercentage) ? "-" : `${comp.standardPercentage.toFixed(2)}%`}</TableCell>
                      <TableCell className="text-right">{isNaN(comp.newRequiredWeight) ? "Invalid Input" : comp.newRequiredWeight.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ResultDisplay label="Sum of New Component Weights" value={sumOfCalculatedComponentWeights} />
              {(sumOfCalculatedComponentWeights !== null && !isNaN(parseFloat(watchedTargetBatchWeightForComponents)) && parseFloat(watchedTargetBatchWeightForComponents) >= 0 && Math.abs(parseFloat(watchedTargetBatchWeightForComponents) - sumOfCalculatedComponentWeights) > 0.001) && (
                <p className="text-sm text-orange-500 mt-2">
                  Note: Sum of new component weights ({sumOfCalculatedComponentWeights.toFixed(4)}) does not exactly match Target Batch Weight ({parseFloat(watchedTargetBatchWeightForComponents).toFixed(4)}). This can happen if component percentages don't sum to 100% or due to rounding.
                </p>
              )}
            </div>
          )}
        </section>
      </form>
      
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-medium mb-3">Manage Saved Standard Formulas</h3>
        <div className="space-y-4 p-4 border rounded-md bg-muted/30">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Label htmlFor="saveBatchName">Formula Name to Save</Label>
              <Input id="saveBatchName" {...register('saveBatchName')} placeholder="e.g., Product XYZ Standard Formula" className="h-9" />
            </div>
            <Button 
              onClick={handleSaveBatch} 
              size="sm" 
              disabled={
                !watchedOriginalStandardTotalBatchWt || 
                isNaN(parseFloat(watchedOriginalStandardTotalBatchWt)) ||
                parseFloat(watchedOriginalStandardTotalBatchWt) <= 0 ||
                watchedComponents.length === 0 || 
                watchedComponents.some(c => !c.name || !c.standardPercentage || isNaN(parseFloat(c.standardPercentage)))
              }
            >
              <Save className="mr-2 h-4 w-4" /> Save Current Formula
            </Button>
          </div>

          {savedBatches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="loadBatchSelect">Load Saved Formula</Label>
               <div className="flex items-center gap-2">
                <Select value={selectedBatchToLoad} onValueChange={(id) => {setSelectedBatchToLoad(id); if(id) handleLoadBatch(id);}}>
                  <SelectTrigger id="loadBatchSelect">
                    <SelectValue placeholder="Select a formula to load..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedBatches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} (Saved: {new Date(batch.createdAt).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <h4 className="text-sm font-medium mt-4">Saved Formulas:</h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {savedBatches.map(batch => (
                  <li key={batch.id} className="flex justify-between items-center p-2 border rounded text-sm hover:bg-muted/50">
                    <span>{batch.name}</span>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleLoadBatch(batch.id)} aria-label={`Load ${batch.name}`}>
                            <Upload className="h-3 w-3"/>
                        </Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" aria-label={`Delete ${batch.name}`}>
                                <Trash2 className="h-3 w-3"/>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the formula "{batch.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBatch(batch.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
           {savedBatches.length === 0 && <p className="text-sm text-muted-foreground">No standard formulas saved yet.</p>}
        </div>
      </div>

    </CalculatorWrapper>
  );
};

export default ShortBatchAdjustmentPage;

    