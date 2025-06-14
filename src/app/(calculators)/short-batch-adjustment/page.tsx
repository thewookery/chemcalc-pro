
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
import { cn } from '@/lib/utils';


interface FormData {
  originalTotalBatchWeight: string;
  components: { name: string; weight: string }[]; // Form data for original components
  limitingComponentIndex: string;
  availableAmountLimitingComponent: string;
  saveBatchName: string;
}

const SAVED_BATCHES_KEY = 'chemcalc_savedShortBatches';

const ShortBatchAdjustmentPage: React.FC = () => {
  const { toast } = useToast();
  const [savedBatches, setSavedBatches] = useLocalStorage<SavedBatch[]>(SAVED_BATCHES_KEY, []);
  const [selectedBatchToLoad, setSelectedBatchToLoad] = useState<string>('');


  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      originalTotalBatchWeight: '',
      components: [{ name: '', weight: '' }],
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

  const [newTotalBatchWeight, setNewTotalBatchWeight] = useState<number | null>(null);
  const [newComponentWeights, setNewComponentWeights] = useState<AdjustedComponent[]>([]);

  useEffect(() => {
    const originalTotalWt = parseFloat(originalTotalBatchWeightStr);
    const limitCompIdx = parseInt(limitingComponentIndexStr, 10);
    const availableAmount = parseFloat(availableAmountLimitingComponentStr);

    if (isNaN(originalTotalWt) || originalTotalWt <= 0 || watchedComponents.length === 0 || isNaN(limitCompIdx) || limitCompIdx < 0 || limitCompIdx >= watchedComponents.length) {
      setNewTotalBatchWeight(null);
      setNewComponentWeights([]);
      return;
    }
    
    const limitingComponent = watchedComponents[limitCompIdx];
    if (!limitingComponent) { // Ensure limiting component exists
        setNewTotalBatchWeight(null);
        setNewComponentWeights([]);
        return;
    }
    const originalLimitingWeight = parseFloat(limitingComponent.weight);

    if (isNaN(originalLimitingWeight) || originalLimitingWeight <= 0 || isNaN(availableAmount) || availableAmount < 0) {
       setNewTotalBatchWeight(null);
       setNewComponentWeights([]);
       return;
    }
    
    const scaleFactor = availableAmount / originalLimitingWeight;
    const newTotalWt = originalTotalWt * scaleFactor;
    setNewTotalBatchWeight(newTotalWt);

    const newComps: AdjustedComponent[] = watchedComponents.map((comp, index) => {
      const originalCompWt = parseFloat(comp.weight);
      let scaledWeight = NaN;
      let percentageInNewBatch = NaN;

      if (!isNaN(originalCompWt)) {
        scaledWeight = originalCompWt * scaleFactor;
        if (newTotalWt > 0 && !isNaN(scaledWeight)) {
          percentageInNewBatch = (scaledWeight / newTotalWt) * 100;
        } else if (newTotalWt === 0 && scaledWeight === 0) {
          // If both are zero, percentage could be considered 0 or NaN.
          // For display, showing what original % was might be more useful if batch size becomes 0.
          // However, typically this means an invalid scenario for percentages.
          // Let's try to match original % if total is 0 and original total was > 0
           const originalTotalWtNum = parseFloat(originalTotalBatchWeightStr);
           if (originalTotalWtNum > 0 && !isNaN(originalCompWt)) {
             percentageInNewBatch = (originalCompWt / originalTotalWtNum) * 100;
           } else {
             percentageInNewBatch = 0; // default to 0 if cannot determine original
           }
        }
      }
      
      return {
        id: String(index),
        name: comp.name,
        weight: scaledWeight,
        percentage: percentageInNewBatch,
      };
    });
    setNewComponentWeights(newComps);

  }, [originalTotalBatchWeightStr, watchedComponents, limitingComponentIndexStr, availableAmountLimitingComponentStr]);

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
      components: watchedComponents.map(c => ({ name: c.name, weight: parseFloat(c.weight) || 0 })),
    };
    
    const newSavedBatch: SavedBatch = {
      ...currentBatchData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    setSavedBatches([...savedBatches, newSavedBatch]);
    setValue('saveBatchName', '');
    toast({ title: "Success", description: `Batch "${newSavedBatch.name}" saved.` });
  };
  
  const handleLoadBatch = (batchId: string) => {
    const batchToLoad = savedBatches.find(b => b.id === batchId);
    if (batchToLoad) {
      reset({ 
        originalTotalBatchWeight: String(batchToLoad.originalTotalBatchWeight),
        components: batchToLoad.components.map(c => ({ name: c.name, weight: String(c.weight) })),
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

  const formula = "New Weight = Original Weight * (Available Limiting / Original Limiting). Percentages are maintained.";

  const resultsToCopy = useMemo(() => {
    if (newTotalBatchWeight === null || newComponentWeights.length === 0) return "";
    let text = `Short Batch Adjustment Results:\n`;
    text += `Original Total Batch Weight: ${originalTotalBatchWeightStr}\n`;
    
    text += `Original Components:\n`;
    const originalTotalWtNumForCopy = parseFloat(originalTotalBatchWeightStr);
    watchedComponents.forEach((comp, index) => {
      const originalCompWeightNum = parseFloat(comp.weight);
      let originalPercStr = "N/A";
      if (originalTotalWtNumForCopy > 0 && !isNaN(originalCompWeightNum) && originalCompWeightNum >=0) {
        originalPercStr = `${((originalCompWeightNum / originalTotalWtNumForCopy) * 100).toFixed(2)}%`;
      }
      text += `  - ${comp.name || `Component ${index+1}`}: ${comp.weight} (Original %: ${originalPercStr})\n`;
    });

    const limitingCompFromWatch = watchedComponents[parseInt(limitingComponentIndexStr)];
    text += `Limiting Component: ${limitingCompFromWatch?.name || 'N/A'} (Original: ${limitingCompFromWatch?.weight || 'N/A'}, Available: ${availableAmountLimitingComponentStr})\n`;
    text += `--- Adjusted Batch ---\n`;
    text += `New Total Batch Weight: ${newTotalBatchWeight.toFixed(3)}\n`;
    text += `Adjusted Components:\n`;
    newComponentWeights.forEach(comp => {
      text += `  - ${comp.name}: ${isNaN(comp.weight) ? 'Invalid Original' : comp.weight.toFixed(3)} (New %: ${isNaN(comp.percentage) ? 'N/A' : comp.percentage.toFixed(2)}%)\n`;
    });
    return text;
  }, [newTotalBatchWeight, newComponentWeights, originalTotalBatchWeightStr, limitingComponentIndexStr, watchedComponents, availableAmountLimitingComponentStr]);

  return (
    <CalculatorWrapper
      title="Short Batch Adjustment Calculator"
      description="Adjust all component weights proportionally for a shorter batch due to material shortage. Component percentages are maintained."
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

            <Label>Original Components</Label>
            {fields.map((field, index) => {
              const componentWeightStr = watch(`components.${index}.weight`);
              const originalTotalWtNum = parseFloat(originalTotalBatchWeightStr);
              const componentWeightNum = parseFloat(componentWeightStr);
              let percentageDisplay = '- %';
              if (originalTotalWtNum > 0 && !isNaN(componentWeightNum) && componentWeightNum >= 0) {
                const perc = (componentWeightNum / originalTotalWtNum) * 100;
                percentageDisplay = `${perc.toFixed(2)}%`;
              }

              return (
                <div key={field.id} className="flex items-start gap-2 p-3 border rounded-md bg-background/50">
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
                  <div className="w-1/4 space-y-1">
                    <Label htmlFor={`components.${index}.weight`} className="text-xs">Weight</Label>
                    <Input
                      id={`components.${index}.weight`}
                      type="number"
                      step="any"
                      placeholder="Weight"
                      {...register(`components.${index}.weight`, { required: "Weight is required", valueAsNumber: true, min: {value: 0, message: "Cannot be negative"} })}
                      className={cn("h-9 calculator-input text-input-foreground", errors.components?.[index]?.weight && "border-destructive")}
                    />
                    {errors.components?.[index]?.weight && <p className="text-xs text-destructive mt-1">{errors.components[index]?.weight?.message}</p>}
                  </div>
                  <div className="w-1/5 space-y-1 pt-1">
                    <Label className="text-xs text-muted-foreground block text-center">Original %</Label>
                    <div className="text-sm text-center h-9 flex items-center justify-center bg-muted/80 rounded-md px-2 text-muted-foreground">
                      {percentageDisplay}
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-5 self-center" aria-label="Remove component">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', weight: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Component
            </Button>
          </div>
        </div>
        
        {watchedComponents.length > 0 && parseFloat(originalTotalBatchWeightStr) > 0 && (
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
                        {watchedComponents.map((comp, index) => (
                          <SelectItem 
                            key={index} 
                            value={String(index)} 
                            disabled={!comp.name || isNaN(parseFloat(comp.weight)) || parseFloat(comp.weight) <=0 }
                          >
                            {comp.name || `Component ${index + 1}`} ({parseFloat(comp.weight) > 0 ? `${comp.weight} units` : 'Invalid original weight'})
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
              { parseFloat(availableAmountLimitingComponentStr) > parseFloat(watchedComponents[parseInt(limitingComponentIndexStr)]?.weight) &&
                !isNaN(parseFloat(availableAmountLimitingComponentStr)) && !isNaN(parseFloat(watchedComponents[parseInt(limitingComponentIndexStr)]?.weight)) &&
                parseInt(limitingComponentIndexStr) >= 0 && parseInt(limitingComponentIndexStr) < watchedComponents.length && // ensure index is valid
                (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Available amount is greater than original for this component. This will scale the batch up.
                  </p>
                )
              }
            </div>
          </div>
        )}

        {newTotalBatchWeight !== null && newComponentWeights.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-3 text-primary">Adjusted Batch Results</h3>
            <ResultDisplay label="New Total Batch Weight" value={newTotalBatchWeight} variant="highlight" />
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2">Adjusted Component Weights:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>New Weight</TableHead>
                    <TableHead className="text-right">New Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newComponentWeights.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell>{comp.name}</TableCell>
                      <TableCell>{isNaN(comp.weight) ? "Invalid Original" : comp.weight.toFixed(3)}</TableCell>
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
              <Input id="saveBatchName" {...register('saveBatchName')} placeholder="e.g., Product XYZ Standard" className="h-9" />
            </div>
            <Button onClick={handleSaveBatch} size="sm" disabled={!originalTotalBatchWeightStr || watchedComponents.length === 0 || watchedComponents.some(c => !c.name || !c.weight)}>
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
