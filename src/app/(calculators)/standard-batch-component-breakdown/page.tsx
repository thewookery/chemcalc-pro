
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
import { Trash2, PlusCircle, Save, Upload, AlertTriangle, ListChecks } from 'lucide-react';
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
  desiredTotalBatchWeight: string;
  components: { name: string; standardPercentage: string }[];
  saveBatchName: string;
  originalStandardTotalBatchWeight: string; // For saving/loading compatibility
}

const SAVED_BATCHES_KEY = 'chemcalc_savedShortBatches_v3_formula_percentage';

const StandardBatchComponentBreakdownPage: React.FC = () => {
  const { toast } = useToast();
  const [savedBatches, setSavedBatches] = useLocalStorage<SavedBatch[]>(SAVED_BATCHES_KEY, []);
  const [selectedBatchToLoad, setSelectedBatchToLoad] = useState<string>('');

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      desiredTotalBatchWeight: '',
      components: [{ name: '', standardPercentage: '' }],
      saveBatchName: '',
      originalStandardTotalBatchWeight: '', // Initialize for the save section
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const watchedDesiredTotalBatchWeight = watch('desiredTotalBatchWeight');
  const watchedComponents = watch('components');
  const watchedOriginalStandardTotalBatchWeight = watch('originalStandardTotalBatchWeight'); // For save button enable/disable

  const [componentBreakdownResults, setComponentBreakdownResults] = useState<AdjustedComponent[]>([]);
  const [sumOfCalculatedComponentWeights, setSumOfCalculatedComponentWeights] = useState<number | null>(null);
  const [totalStandardPercentage, setTotalStandardPercentage] = useState<number>(0);

  useEffect(() => {
    const targetBatchWtNum = parseFloat(watchedDesiredTotalBatchWeight);
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

  }, [watchedDesiredTotalBatchWeight, watchedComponents]);

  const handleSaveBatch = () => {
    const batchName = watch('saveBatchName');
    const origStandardTotalWt = parseFloat(watch('originalStandardTotalBatchWeight')); // Read from the specific input

    if (!batchName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the formula.", variant: "destructive" });
      return;
    }
    if (savedBatches.find(b => b.name === batchName.trim())) {
       toast({ title: "Error", description: `A formula named "${batchName.trim()}" already exists.`, variant: "destructive" });
       return;
    }
     if (isNaN(origStandardTotalWt) || origStandardTotalWt <= 0) {
      toast({ title: "Error", description: "Reference Total Batch Weight for Saved Formula must be a positive number to save.", variant: "destructive" });
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
    // Optionally clear originalStandardTotalBatchWeight from form if it's only for saving
    // setValue('originalStandardTotalBatchWeight', ''); 
    toast({ title: "Success", description: `Formula "${newSavedBatch.name}" saved.` });
  };
  
  const handleLoadBatch = (batchId: string) => {
    const batchToLoad = savedBatches.find(b => b.id === batchId);
    if (batchToLoad) {
      reset({ 
        desiredTotalBatchWeight: '', // Clear this as it's the main input for *this* calc
        originalStandardTotalBatchWt: String(batchToLoad.originalStandardTotalBatchWeight),
        components: batchToLoad.components.map(c => ({ name: c.name, standardPercentage: String(c.standardPercentage) })),
        saveBatchName: '',
      });
      setComponentBreakdownResults([]);
      setSumOfCalculatedComponentWeights(null);
      setSelectedBatchToLoad(''); 
      toast({ title: "Formula Loaded", description: `Data for "${batchToLoad.name}" has been loaded.` });
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    setSavedBatches(savedBatches.filter(b => b.id !== batchId));
    toast({ title: "Formula Deleted", description: "The selected formula has been removed." });
  };

  const formula = "New Component Weight = (Standard Component % / 100) * Desired Total Batch Weight";

  const resultsToCopy = useMemo(() => {
    let text = `Standard Batch Component Breakdown:\n\n`;
    text += `Desired Total Batch Weight: ${watchedDesiredTotalBatchWeight}\n`;
    text += `Components (Standard % from Formula):\n`;
    componentBreakdownResults.forEach((comp, index) => {
      text += `  - ${comp.name || `Component ${index+1}`}: ${isNaN(comp.standardPercentage) ? 'N/A' : comp.standardPercentage.toFixed(2)}%  =>  New Required Weight: ${isNaN(comp.newRequiredWeight) ? 'N/A' : comp.newRequiredWeight.toFixed(4)}\n`;
    });
    text += `Sum of New Component Weights: ${sumOfCalculatedComponentWeights !== null && !isNaN(sumOfCalculatedComponentWeights) ? sumOfCalculatedComponentWeights.toFixed(4) : 'N/A'}\n`;
    if (totalStandardPercentage !== 100 && totalStandardPercentage > 0) {
      text += `Warning: Total standard percentage of components is ${totalStandardPercentage.toFixed(2)}%, not 100%.\n`;
    }
    return text;
  }, [watchedDesiredTotalBatchWeight, componentBreakdownResults, sumOfCalculatedComponentWeights, totalStandardPercentage]);

  return (
    <CalculatorWrapper
      title="Standard Batch Component Breakdown"
      description="Calculate individual component weights for a desired total batch weight based on standard formula percentages."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <form onSubmit={handleSubmit(() => { /* Calculations are real-time via useEffect */ })} className="space-y-8">
        
        <section className="space-y-4 p-4 border rounded-md bg-muted/30">
          <h3 className="text-xl font-semibold mb-3 text-primary">Component Weight Breakdown</h3>
          <CommonInput
            id="desiredTotalBatchWeight"
            label="Desired Total Batch Weight"
            {...register('desiredTotalBatchWeight', { valueAsNumber: true, min: { value: 0, message: "Must be non-negative" }})}
            placeholder="e.g., 1000"
            tooltipText="The total weight of the batch you want to produce."
            errorMessage={errors.desiredTotalBatchWeight?.message}
          />
          
          <Label className="mt-4 block">Components (Standard % in Formula)</Label>
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

          {componentBreakdownResults.length > 0 && (!isNaN(parseFloat(watchedDesiredTotalBatchWeight)) && parseFloat(watchedDesiredTotalBatchWeight) >= 0) && (
            <div className="mt-6">
              <h4 className="text-md font-medium mb-2">Component Breakdown for Desired Total Batch Weight:</h4>
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
              {(sumOfCalculatedComponentWeights !== null && !isNaN(parseFloat(watchedDesiredTotalBatchWeight)) && parseFloat(watchedDesiredTotalBatchWeight) >= 0 && Math.abs(parseFloat(watchedDesiredTotalBatchWeight) - sumOfCalculatedComponentWeights) > 0.001) && (
                <p className="text-sm text-orange-500 mt-2">
                  Note: Sum of new component weights ({sumOfCalculatedComponentWeights.toFixed(4)}) does not exactly match Desired Total Batch Weight ({parseFloat(watchedDesiredTotalBatchWeight).toFixed(4)}). This can happen if component percentages don't sum to 100% or due to rounding.
                </p>
              )}
            </div>
          )}
        </section>
      </form>
      
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-medium mb-3">Manage Saved Standard Formulas</h3>
        <div className="space-y-4 p-4 border rounded-md bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="saveBatchName">Formula Name to Save</Label>
              <Input id="saveBatchName" {...register('saveBatchName')} placeholder="e.g., Product XYZ Standard Formula" className="h-9" />
            </div>
            <CommonInput
              id="originalStandardTotalBatchWeight"
              label="Reference Total Batch Weight for Saved Formula"
              className="h-9 calculator-input"
              tooltipText="Enter the original total weight this formula typically represents. Used for compatibility with other calculators."
              {...register('originalStandardTotalBatchWeight', { 
                  valueAsNumber: true, 
                  min: { value: 0.0001, message: "Must be positive" } 
              })}
              errorMessage={errors.originalStandardTotalBatchWeight?.message}
            />
          </div>
           <Button 
              onClick={handleSaveBatch} 
              size="sm" 
              className="mt-2"
              disabled={
                !watchedOriginalStandardTotalBatchWeight || 
                isNaN(parseFloat(watchedOriginalStandardTotalBatchWeight)) ||
                parseFloat(watchedOriginalStandardTotalBatchWeight) <= 0 ||
                watchedComponents.length === 0 || 
                watchedComponents.some(c => !c.name || !c.standardPercentage || isNaN(parseFloat(c.standardPercentage)))
              }
            >
              <Save className="mr-2 h-4 w-4" /> Save Current Formula
            </Button>


          {savedBatches.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="loadBatchSelect">Load Saved Formula</Label>
               <div className="flex items-center gap-2">
                <Select value={selectedBatchToLoad} onValueChange={(id) => {setSelectedBatchToLoad(id); if(id) handleLoadBatch(id);}}>
                  <SelectTrigger id="loadBatchSelect">
                    <SelectValue placeholder="Select a formula to load..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedBatches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} (Ref Wt: {batch.originalStandardTotalBatchWeight}, Saved: {new Date(batch.createdAt).toLocaleDateString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <h4 className="text-sm font-medium mt-4">Saved Formulas:</h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {savedBatches.map(batch => (
                  <li key={batch.id} className="flex justify-between items-center p-2 border rounded text-sm hover:bg-muted/50">
                    <span>{batch.name} (Ref Wt: {batch.originalStandardTotalBatchWeight})</span>
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

export default StandardBatchComponentBreakdownPage;
