
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
import { Trash2, PlusCircle, Save, Upload, AlertTriangle, PercentIcon } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface FormData {
  originalTotalBatchWeight: string;
  components: { name: string; percentage: string }[];
  limitingComponentIndex: string;
  availableAmountLimitingComponent: string;
  saveBatchName: string;
}

interface CalculatedOriginalComponent {
  name: string;
  percentage: number;
  originalWeight: number;
}

const SAVED_BATCHES_KEY = 'chemcalc_savedShortBatches_v2_percentage'; // Changed key to avoid conflicts

const ShortBatchAdjustmentPage: React.FC = () => {
  const { toast } = useToast();
  const [savedBatches, setSavedBatches] = useLocalStorage<SavedBatch[]>(SAVED_BATCHES_KEY, []);
  const [selectedBatchToLoad, setSelectedBatchToLoad] = useState<string>('');

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      originalTotalBatchWeight: '',
      components: [{ name: '', percentage: '' }],
      limitingComponentIndex: '',
      availableAmountLimitingComponent: '',
      saveBatchName: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const watchedComponents = watch('components');
  const originalTotalBatchWeightStr = watch('originalTotalBatchWeight');
  const limitingComponentIndexStr = watch('limitingComponentIndex');
  const availableAmountLimitingComponentStr = watch('availableAmountLimitingComponent');

  const [calculatedOriginalComponents, setCalculatedOriginalComponents] = useState<CalculatedOriginalComponent[]>([]);
  const [adjustedBatchResults, setAdjustedBatchResults] = useState<AdjustedComponent[]>([]);
  const [newTotalBatchWeight, setNewTotalBatchWeight] = useState<number | null>(null);
  const [totalOriginalPercentage, setTotalOriginalPercentage] = useState<number>(0);

  useEffect(() => {
    const originalTotalWt = parseFloat(originalTotalBatchWeightStr);
    let currentTotalPercentage = 0;
    const newCalculatedOriginals: CalculatedOriginalComponent[] = [];

    if (!isNaN(originalTotalWt) && originalTotalWt > 0) {
      watchedComponents.forEach(comp => {
        const perc = parseFloat(comp.percentage);
        if (!isNaN(perc) && perc >= 0) {
          currentTotalPercentage += perc;
          newCalculatedOriginals.push({
            name: comp.name || '',
            percentage: perc,
            originalWeight: (originalTotalWt * perc) / 100,
          });
        } else {
           newCalculatedOriginals.push({ // Push with NaN weight if percentage is invalid
            name: comp.name || '',
            percentage: NaN,
            originalWeight: NaN,
          });
        }
      });
    } else {
       watchedComponents.forEach(comp => {
         const perc = parseFloat(comp.percentage);
         newCalculatedOriginals.push({
           name: comp.name || '',
           percentage: isNaN(perc) ? NaN : perc,
           originalWeight: NaN, // No total weight, so original weights are NaN
         });
         if(!isNaN(perc) && perc >=0) currentTotalPercentage += perc;
       });
    }
    setCalculatedOriginalComponents(newCalculatedOriginals);
    setTotalOriginalPercentage(currentTotalPercentage);
  }, [originalTotalBatchWeightStr, watchedComponents]);


  useEffect(() => {
    const limitCompIdx = parseInt(limitingComponentIndexStr, 10);
    const availableAmount = parseFloat(availableAmountLimitingComponentStr);
    const originalTotalWtNum = parseFloat(originalTotalBatchWeightStr);

    if (
      isNaN(originalTotalWtNum) || originalTotalWtNum <= 0 ||
      calculatedOriginalComponents.length === 0 ||
      isNaN(limitCompIdx) || limitCompIdx < 0 || limitCompIdx >= calculatedOriginalComponents.length
    ) {
      setAdjustedBatchResults([]);
      setNewTotalBatchWeight(null);
      return;
    }

    const limitingComponent = calculatedOriginalComponents[limitCompIdx];
    if (!limitingComponent || isNaN(limitingComponent.originalWeight) || limitingComponent.originalWeight < 0) {
      setAdjustedBatchResults([]);
      setNewTotalBatchWeight(null);
      return;
    }
    
    // If original limiting weight is 0, but available amount is > 0, it's an impossible scale up.
    // If original limiting weight is 0 and available amount is 0, scale factor is effectively 1 (or NaN if we want to be strict, but 1 avoids division by zero for other non-zero components)
    let scaleFactor: number;
    if (limitingComponent.originalWeight === 0) {
        if (availableAmount === 0) {
            scaleFactor = 1; // No change if both are zero
        } else {
            // Trying to make something from nothing for the limiting component.
            // This scenario implies that other components might scale up infinitely if their original weight was non-zero.
            // Or, if we want to be strict, this is an invalid scenario. Let's treat it as no scaling.
            toast({ title: "Warning", description: "Limiting component has 0 original weight. Cannot scale based on a positive available amount.", variant: "destructive" });
            setAdjustedBatchResults([]);
            setNewTotalBatchWeight(null);
            return;
        }
    } else {
        if (isNaN(availableAmount) || availableAmount < 0) {
             setAdjustedBatchResults([]);
             setNewTotalBatchWeight(null);
             return;
        }
        scaleFactor = availableAmount / limitingComponent.originalWeight;
    }


    const newAdjustedResults: AdjustedComponent[] = calculatedOriginalComponents.map((comp, index) => ({
      id: String(index),
      name: comp.name,
      originalCalculatedWeight: comp.originalWeight,
      newScaledWeight: !isNaN(comp.originalWeight) ? comp.originalWeight * scaleFactor : NaN,
      percentage: comp.percentage, // This is the user-inputted target percentage
    }));

    setAdjustedBatchResults(newAdjustedResults);
    const newTotal = newAdjustedResults.reduce((sum, comp) => sum + (isNaN(comp.newScaledWeight) ? 0 : comp.newScaledWeight), 0);
    setNewTotalBatchWeight(newTotal);

  }, [calculatedOriginalComponents, limitingComponentIndexStr, availableAmountLimitingComponentStr, originalTotalBatchWeightStr, toast]);


  const handleSaveBatch = () => {
    const batchName = watch('saveBatchName');
    if (!batchName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the batch.", variant: "destructive" });
      return;
    }
    if (savedBatches.find(b => b.name === batchName.trim())) {
       toast({ title: "Error", description: `A batch named "${batchName.trim()}" already exists.`, variant: "destructive" });
       return;
    }

    const currentBatchData: Omit<SavedBatch, 'id' | 'createdAt'> = {
      name: batchName.trim(),
      originalTotalBatchWeight: parseFloat(originalTotalBatchWeightStr) || 0,
      components: watchedComponents.map(c => ({ name: c.name, percentage: parseFloat(c.percentage) || 0 })),
    };
    
    const newSavedBatch: SavedBatch = {
      ...currentBatchData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setSavedBatches([...savedBatches, newSavedBatch]);
    setValue('saveBatchName', ''); // Clear input after save
    toast({ title: "Success", description: `Batch "${newSavedBatch.name}" saved.` });
  };
  
  const handleLoadBatch = (batchId: string) => {
    const batchToLoad = savedBatches.find(b => b.id === batchId);
    if (batchToLoad) {
      reset({ 
        originalTotalBatchWeight: String(batchToLoad.originalTotalBatchWeight),
        components: batchToLoad.components.map(c => ({ name: c.name, percentage: String(c.percentage) })),
        limitingComponentIndex: '', 
        availableAmountLimitingComponent: '',
        saveBatchName: '',
      });
      setSelectedBatchToLoad(''); 
      toast({ title: "Batch Loaded", description: `Data for "${batchToLoad.name}" has been loaded.` });
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    setSavedBatches(savedBatches.filter(b => b.id !== batchId));
    toast({ title: "Batch Deleted", description: "The selected batch has been removed." });
  };

  const formula = "Calc. Original Weight = (Total Weight * %) / 100. New Scaled Weight = Calc. Original Weight * (Available Limiting / Original Limiting of selected component). Percentages are user-defined and maintained.";

  const resultsToCopy = useMemo(() => {
    if (newTotalBatchWeight === null || adjustedBatchResults.length === 0) return "";
    let text = `Short Batch Adjustment Results (Percentage Based):\n`;
    text += `Original Total Batch Weight: ${originalTotalBatchWeightStr}\n`;
    
    text += `Original Components (User-defined %):\n`;
    calculatedOriginalComponents.forEach((comp, index) => {
      text += `  - ${comp.name || `Component ${index+1}`}: ${isNaN(comp.percentage) ? 'N/A' : comp.percentage.toFixed(2)}% (Calculated Original Wt: ${isNaN(comp.originalWeight) ? 'N/A' : comp.originalWeight.toFixed(3)})\n`;
    });

    const limitingCompOriginal = calculatedOriginalComponents[parseInt(limitingComponentIndexStr)];
    text += `Limiting Component: ${limitingCompOriginal?.name || 'N/A'} (Original Calc. Wt: ${limitingCompOriginal?.originalWeight?.toFixed(3) || 'N/A'}, Available: ${availableAmountLimitingComponentStr})\n`;
    text += `--- Adjusted Batch ---\n`;
    text += `New Total Batch Weight: ${newTotalBatchWeight.toFixed(3)}\n`;
    text += `Adjusted Components:\n`;
    adjustedBatchResults.forEach(comp => {
      text += `  - ${comp.name}: ${isNaN(comp.newScaledWeight) ? 'Invalid Original' : comp.newScaledWeight.toFixed(3)} (Target %: ${isNaN(comp.percentage) ? 'N/A' : comp.percentage.toFixed(2)}%)\n`;
    });
    return text;
  }, [newTotalBatchWeight, adjustedBatchResults, originalTotalBatchWeightStr, limitingComponentIndexStr, calculatedOriginalComponents, availableAmountLimitingComponentStr]);

  return (
    <CalculatorWrapper
      title="Short Batch Adjustment Calculator (Percentage Based)"
      description="Input target percentages for components in an original batch. The calculator derives original weights. Then, adjust all component weights proportionally based on a limiting material, maintaining target percentages."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <form onSubmit={handleSubmit(() => { /* Calculation is real-time via useEffect */ })} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Original Batch Configuration</h3>
          <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <CommonInput
              id="originalTotalBatchWeight"
              label="Original Total Batch Weight"
              {...register('originalTotalBatchWeight', { required: "This field is required", valueAsNumber: true, min: {value: 0.0001, message: "Must be positive"} })}
              placeholder="e.g., 100000"
              tooltipText="The total weight of the full, original batch."
              errorMessage={errors.originalTotalBatchWeight?.message}
            />

            <Label>Original Components (Define by Target %)</Label>
            {fields.map((field, index) => {
              const calculatedOrig = calculatedOriginalComponents[index];
              return (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-start p-3 border rounded-md bg-background/50">
                  <div className="flex-grow space-y-1">
                    <Label htmlFor={`components.${index}.name`} className="text-xs">Name</Label>
                    <Input
                      id={`components.${index}.name`}
                      placeholder={`Component ${index + 1}`}
                      {...register(`components.${index}.name`, { required: "Name is required" })}
                      className={cn("h-9", errors.components?.[index]?.name && "border-destructive")}
                    />
                    {errors.components?.[index]?.name && <p className="text-xs text-destructive mt-1">{errors.components[index]?.name?.message}</p>}
                  </div>
                  
                  <CommonInput
                    id={`components.${index}.percentage`}
                    label="Target %"
                    unit="%"
                    className="h-9 calculator-input text-input-foreground"
                    placeholder="e.g., 25"
                    {...register(`components.${index}.percentage`, { 
                        required: "Percentage is required", 
                        valueAsNumber: true, 
                        min: {value: 0, message: "% >= 0"},
                        max: {value: 100, message: "% <= 100"}
                    })}
                    errorMessage={errors.components?.[index]?.percentage?.message}
                  />

                  <div className="space-y-1 pt-1">
                    <Label className="text-xs text-muted-foreground block">Calc. Orig. Wt.</Label>
                    <div className="text-sm h-9 flex items-center bg-muted/80 rounded-md px-3 text-muted-foreground">
                      {calculatedOrig && !isNaN(calculatedOrig.originalWeight) ? calculatedOrig.originalWeight.toFixed(3) : '-'}
                    </div>
                  </div>

                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-5 self-center md:self-end" aria-label="Remove component">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
            <div className="flex justify-between items-center">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', percentage: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Component
                </Button>
                <div className="text-sm font-medium">
                    Total Original %: 
                    <span className={cn("ml-1", totalOriginalPercentage !== 100 && (totalOriginalPercentage > 0 || watchedComponents.some(c => c.percentage)) ? "text-orange-500 font-bold" : "text-green-600 font-bold")}>
                        {totalOriginalPercentage.toFixed(2)}%
                    </span>
                    {totalOriginalPercentage !== 100 && (totalOriginalPercentage > 0 || watchedComponents.some(c => c.percentage)) && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertTriangle className="inline-block ml-1 h-4 w-4 text-orange-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Total percentage of components does not sum to 100%. Batch weights may not be as expected.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
          </div>
        </div>
        
        {calculatedOriginalComponents.length > 0 && parseFloat(originalTotalBatchWeightStr) > 0 && totalOriginalPercentage > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Shortage Information</h3>
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
               <div>
                <Label htmlFor="limitingComponentIndex">Limiting Component</Label>
                <Controller
                  name="limitingComponentIndex"
                  control={control}
                  rules={{ required: "Please select a limiting component."}}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <SelectTrigger id="limitingComponentIndex" className={cn(errors.limitingComponentIndex && "border-destructive")}>
                        <SelectValue placeholder="Select limiting component" />
                      </SelectTrigger>
                      <SelectContent>
                        {calculatedOriginalComponents.map((comp, index) => (
                          <SelectItem 
                            key={index} 
                            value={String(index)} 
                            disabled={!comp.name || isNaN(comp.originalWeight) || comp.originalWeight < 0} // Disable if original weight is invalid/negative
                          >
                            {comp.name || `Component ${index + 1}`} (Calc. Orig. Wt: {!isNaN(comp.originalWeight) && comp.originalWeight >=0 ? `${comp.originalWeight.toFixed(3)} units` : 'Invalid % or Total Wt'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.limitingComponentIndex && <p className="text-xs text-destructive mt-1">{errors.limitingComponentIndex.message}</p>}
              </div>

              <CommonInput
                id="availableAmountLimitingComponent"
                label="Available Amount of Limiting Component"
                {...register('availableAmountLimitingComponent', { required: "This field is required", valueAsNumber: true, min: {value: 0, message: "Cannot be negative"} })}
                placeholder="e.g., 40"
                tooltipText="The actual amount you have of the limiting component."
                errorMessage={errors.availableAmountLimitingComponent?.message}
              />
              { parseInt(limitingComponentIndexStr) >= 0 && parseInt(limitingComponentIndexStr) < calculatedOriginalComponents.length &&
                calculatedOriginalComponents[parseInt(limitingComponentIndexStr)] &&
                !isNaN(parseFloat(availableAmountLimitingComponentStr)) &&
                !isNaN(calculatedOriginalComponents[parseInt(limitingComponentIndexStr)].originalWeight) &&
                parseFloat(availableAmountLimitingComponentStr) > calculatedOriginalComponents[parseInt(limitingComponentIndexStr)].originalWeight &&
                calculatedOriginalComponents[parseInt(limitingComponentIndexStr)].originalWeight >= 0 && // only show if original weight is non-negative
                (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Available amount is greater than its calculated original weight. This will scale the batch up.
                  </p>
                )
              }
            </div>
          </div>
        )}

        {newTotalBatchWeight !== null && adjustedBatchResults.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3 text-primary">Adjusted Batch Results</h3>
            <ResultDisplay label="New Total Batch Weight" value={newTotalBatchWeight} variant="highlight" />
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2">Adjusted Component Details:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>New Scaled Weight</TableHead>
                    <TableHead className="text-right">Target Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adjustedBatchResults.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell>{comp.name}</TableCell>
                      <TableCell>{isNaN(comp.newScaledWeight) ? "Invalid Original" : comp.newScaledWeight.toFixed(3)}</TableCell>
                      <TableCell className="text-right">{isNaN(comp.percentage) ? "-" : `${comp.percentage.toFixed(2)}%`}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </form>
      
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-medium mb-3">Manage Saved Batches</h3>
        <div className="space-y-4 p-4 border rounded-md bg-muted/30">
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <Label htmlFor="saveBatchName">Batch Name to Save</Label>
              <Input id="saveBatchName" {...register('saveBatchName')} placeholder="e.g., Product XYZ Standard %" className="h-9" />
            </div>
            <Button 
              onClick={handleSaveBatch} 
              size="sm" 
              disabled={
                !originalTotalBatchWeightStr || 
                watchedComponents.length === 0 || 
                watchedComponents.some(c => !c.name || !c.percentage || isNaN(parseFloat(c.percentage))) ||
                totalOriginalPercentage === 0
              }
            >
              <Save className="mr-2 h-4 w-4" /> Save Current Configuration
            </Button>
          </div>

          {savedBatches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="loadBatchSelect">Load Saved Batch</Label>
               <div className="flex items-center gap-2">
                <Select value={selectedBatchToLoad} onValueChange={(id) => {setSelectedBatchToLoad(id); if(id) handleLoadBatch(id);}}>
                  <SelectTrigger id="loadBatchSelect">
                    <SelectValue placeholder="Select a batch to load..." />
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
              
              <h4 className="text-sm font-medium mt-4">Saved Batches:</h4>
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
                                This action cannot be undone. This will permanently delete the batch "{batch.name}".
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
           {savedBatches.length === 0 && <p className="text-sm text-muted-foreground">No batches saved yet.</p>}
        </div>
      </div>

    </CalculatorWrapper>
  );
};

export default ShortBatchAdjustmentPage;
