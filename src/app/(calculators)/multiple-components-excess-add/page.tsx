
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, PlusCircle, Check, ChevronsUpDown, Save, Upload, AlertTriangle } from 'lucide-react';
import type { BatchTicketComponentInput, CalculatedExcessComponent, Part2CalculatedValueComponent, SavedBatch } from '@/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { materialsList, type Material } from '@/lib/materials';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SAVED_BATCHES_KEY = 'chemcalc_savedFormulas_excessAndFull_v1';

interface FormData {
  targetBatchWeight: string;
  totalExcessUnitsToAdd: string;
  components: BatchTicketComponentInput[];
  saveFormulaName: string;
  referenceOriginalTotalBatchWeightForSave: string;
}

interface MaterialNameComboboxProps {
  value: string;
  onChange: (value: string) => void;
  onMaterialSelect?: (material: Material | null) => void;
  materials: Material[];
  placeholder?: string;
  id?: string;
}

const MaterialNameCombobox: React.FC<MaterialNameComboboxProps> = ({ value, onChange, onMaterialSelect, materials, placeholder, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");

  useEffect(() => {
     if (value !== searchTerm) {
        setSearchTerm(value || "");
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleSelect = (materialName: string) => {
    const selectedMaterial = materials.find(m => m.name === materialName) || null;
    onChange(materialName);
    if (onMaterialSelect) {
      onMaterialSelect(selectedMaterial);
    }
    setSearchTerm(materialName);
    setIsOpen(false);
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    onChange(newSearchTerm); 
    if (onMaterialSelect) {
      const selectedMaterial = materials.find(m => m.name.toLowerCase() === newSearchTerm.toLowerCase()) || null;
      onMaterialSelect(selectedMaterial); 
    }
  };

  const triggerText = value || placeholder || "Select or type name...";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between text-input-foreground calculator-input h-9 text-sm"
        >
          <span className="truncate">{triggerText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 max-h-[200px] overflow-y-auto"
      >
        <Command
          filter={(itemValue, search) => {
            if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput
            placeholder="Search material..."
            value={searchTerm}
            onValueChange={handleSearchChange}
            className="text-sm"
          />
          <CommandList>
            <CommandEmpty>No material found. Type custom name.</CommandEmpty>
            <CommandGroup>
              {materials.map((material) => (
                <CommandItem
                  key={material.name + material.value}
                  value={material.name}
                  onSelect={() => handleSelect(material.name)}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === material.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {material.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface DisplayRow {
  name: string;
  percentageFromTicket: number;
  avOrOhValue: number;
  standardizedPercentage: number;
  unitsToAdd: number; // Excess Units
  percentageOfAdd: number;
  unitsForBatchWeight: number; // # to add for Target Batch Wt.
}

const MultipleComponentsExcessAddPage: React.FC = () => {
  const { toast } = useToast();
  const [savedFormulas, setSavedFormulas] = useLocalStorage<SavedBatch[]>(SAVED_BATCHES_KEY, []);
  const [selectedFormulaToLoad, setSelectedFormulaToLoad] = useState<string>('');

  const { register, control, watch, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>({
    defaultValues: {
      targetBatchWeight: '',
      totalExcessUnitsToAdd: '',
      components: [
        { name: '', percentageFromTicket: '', avOrOhValue: '' },
        { name: '', percentageFromTicket: '', avOrOhValue: '' },
        { name: '', percentageFromTicket: '', avOrOhValue: '' },
      ],
      saveFormulaName: '',
      referenceOriginalTotalBatchWeightForSave: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'components',
  });

  const watchedComponents = watch('components');
  const watchedTotalExcessUnitsToAdd = watch('totalExcessUnitsToAdd');
  const watchedTargetBatchWeight = watch('targetBatchWeight');
  const watchedReferenceOriginalTotalBatchWeightForSave = watch('referenceOriginalTotalBatchWeightForSave');


  const [excessAddResults, setExcessAddResults] = useState<CalculatedExcessComponent[]>([]);
  const [totalOriginalPercentage, setTotalOriginalPercentage] = useState<number>(0);
  const [sumOfStandardizedPercentage, setSumOfStandardizedPercentage] = useState<number>(0);
  const [sumOfCalculatedExcessUnits, setSumOfCalculatedExcessUnits] = useState<number>(0);

  const [part2Results, setPart2Results] = useState<Part2CalculatedValueComponent[]>([]);
  const [sumOfUnitsForTargetBatchWeight, setSumOfUnitsForTargetBatchWeight] = useState<number | null>(null);

  const [displayResults, setDisplayResults] = useState<DisplayRow[]>([]);


  useEffect(() => {
    const parsedTotalExcessUnits = parseFloat(watchedTotalExcessUnitsToAdd);
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
    let currentSumOfExcessUnits = 0;

    if (currentTotalOriginalPerc > 0) {
      watchedComponents.forEach(comp => {
        const originalPerc = parseFloat(comp.percentageFromTicket);
        const avOhVal = parseFloat(comp.avOrOhValue);

        if (!isNaN(originalPerc) && originalPerc > 0) {
          const standardizedPerc = (originalPerc / currentTotalOriginalPerc) * 100;
          currentSumOfStandardizedPerc += standardizedPerc;

          let unitsForThisComponent = NaN;
          if (!isNaN(parsedTotalExcessUnits) && parsedTotalExcessUnits >= 0) { // Allow 0 excess units
            unitsForThisComponent = (standardizedPerc / 100) * parsedTotalExcessUnits;
            if(!isNaN(unitsForThisComponent)) {
                 currentSumOfExcessUnits += unitsForThisComponent;
            }
          }
          tempResults.push({
            name: comp.name || '',
            percentageFromTicket: originalPerc,
            standardizedPercentage: standardizedPerc,
            unitsToAdd: unitsForThisComponent,
            avOrOhValue: isNaN(avOhVal) ? NaN : avOhVal,
          });
        } else {
             tempResults.push({
                name: comp.name || '',
                percentageFromTicket: NaN,
                standardizedPercentage: NaN,
                unitsToAdd: NaN,
                avOrOhValue: isNaN(avOhVal) ? NaN : avOhVal,
            });
        }
      });
    } else {
        watchedComponents.forEach(comp => {
            const avOhVal = parseFloat(comp.avOrOhValue);
            tempResults.push({
                name: comp.name || '',
                percentageFromTicket: NaN,
                standardizedPercentage: NaN,
                unitsToAdd: NaN,
                avOrOhValue: isNaN(avOhVal) ? NaN : avOhVal,
            });
        });
    }

    setExcessAddResults(tempResults);
    setSumOfStandardizedPercentage(currentSumOfStandardizedPerc);
    setSumOfCalculatedExcessUnits((!isNaN(parsedTotalExcessUnits) && parsedTotalExcessUnits >= 0) ? currentSumOfExcessUnits : 0);

  }, [watchedComponents, watchedTotalExcessUnitsToAdd]);

  useEffect(() => {
    const newPart2Results: Part2CalculatedValueComponent[] = [];
    let currentSumOfUnitsForBatchWeight = 0;
    let allInputsValidForSum = true;
    const parsedTargetBatchWeight = parseFloat(watchedTargetBatchWeight);

    excessAddResults.forEach(compFromPart1 => {
      const excessUnits = compFromPart1.unitsToAdd;
      const avOrOh = compFromPart1.avOrOhValue;
      let percentageOfAdd = NaN;
      let unitsForBatchWeightCalc = NaN;

      if (!isNaN(excessUnits) && !isNaN(avOrOh) && avOrOh !== 0) { 
        percentageOfAdd = (excessUnits / avOrOh) * 100;
        if (!isNaN(parsedTargetBatchWeight) && parsedTargetBatchWeight > 0 && !isNaN(percentageOfAdd)) {
            unitsForBatchWeightCalc = (percentageOfAdd / 100) * parsedTargetBatchWeight;
            if (!isNaN(unitsForBatchWeightCalc)) {
                currentSumOfUnitsForBatchWeight += unitsForBatchWeightCalc;
            } else {
               allInputsValidForSum = false; // if unitsForBatchWeightCalc becomes NaN
            }
        } else if (!isNaN(parsedTargetBatchWeight) && parsedTargetBatchWeight > 0) {
            allInputsValidForSum = false; 
        }
      } else {
        if (!isNaN(excessUnits) && excessUnits !== 0) { 
            allInputsValidForSum = false;
        }
      }
      
      newPart2Results.push({
        name: compFromPart1.name,
        excessUnits: isNaN(excessUnits) ? NaN : excessUnits,
        avOrOhValue: isNaN(avOrOh) ? NaN : avOrOh,
        percentageOfAdd: percentageOfAdd,
        unitsForBatchWeight: unitsForBatchWeightCalc,
      });
    });

    setPart2Results(newPart2Results);
    
    if (allInputsValidForSum && !isNaN(currentSumOfUnitsForBatchWeight) && !isNaN(parsedTargetBatchWeight) && parsedTargetBatchWeight > 0 && newPart2Results.some(r => !isNaN(r.unitsForBatchWeight))) {
        setSumOfUnitsForTargetBatchWeight(currentSumOfUnitsForBatchWeight);
    } else if (newPart2Results.some(r => !isNaN(r.excessUnits) && r.excessUnits !== 0 && (!isNaN(parsedTargetBatchWeight) && parsedTargetBatchWeight > 0))) {
        setSumOfUnitsForTargetBatchWeight(allInputsValidForSum ? currentSumOfUnitsForBatchWeight : null);
    } else {
        setSumOfUnitsForTargetBatchWeight(null);
    }

  }, [excessAddResults, watchedTargetBatchWeight]);

  useEffect(() => {
    const combined: DisplayRow[] = excessAddResults.map((exRes, index) => {
      const p2Res = part2Results[index] || { percentageOfAdd: NaN, unitsForBatchWeight: NaN };
      return {
        name: exRes.name,
        percentageFromTicket: exRes.percentageFromTicket,
        avOrOhValue: exRes.avOrOhValue,
        standardizedPercentage: exRes.standardizedPercentage,
        unitsToAdd: exRes.unitsToAdd,
        percentageOfAdd: p2Res.percentageOfAdd,
        unitsForBatchWeight: p2Res.unitsForBatchWeight,
      };
    });
    setDisplayResults(combined);
  }, [excessAddResults, part2Results]);


  const formula = `1. Std. % = (Comp. % / Total Orig. %) * 100.\n2. Excess Units = (Std. % / 100) * Total Excess Units.\n3. % of Add = (Excess Units / AV_OH) * 100.\n4. # to Add (Batch Wt.) = (% of Add / 100) * Target Batch Wt.`;

  const resultsToCopy = useMemo(() => {
    let text = `Multiple Components Calculation:\n\n`;
    text += `Batch Weight: ${watchedTargetBatchWeight}\n`;
    text += `Total Excess Units to Add: ${watchedTotalExcessUnitsToAdd}\n\n`;
    text += `Components (Original % from Batch Ticket & AV/OH):\n`;
    watchedComponents.forEach((comp, index) => {
      text += `  - ${comp.name || `Component ${index+1}`}: ${comp.percentageFromTicket}% (AV/OH: ${comp.avOrOhValue || 'N/A'})\n`;
    });
    text += `Total Original % from Batch Ticket: ${totalOriginalPercentage.toFixed(2)}%\n\n`;

    text += `Calculated Breakdown:\n`;
    text += `Comp. Name | Orig. % | AV/OH | Std. % | Excess Units | % of Add | # to Add (Batch Wt.)\n`;
    text += `-------------------------------------------------------------------------------------------\n`;
    displayResults.forEach(res => {
      text += `${(res.name || '-').padEnd(12)} | `
      text += `${isNaN(res.percentageFromTicket) ? 'N/A'.padEnd(7) : (res.percentageFromTicket.toFixed(2) + '%').padEnd(7)} | `
      text += `${isNaN(res.avOrOhValue) ? 'N/A'.padEnd(5) : res.avOrOhValue.toString().padEnd(5)} | `
      text += `${isNaN(res.standardizedPercentage) ? 'N/A'.padEnd(6) : (res.standardizedPercentage.toFixed(2) + '%').padEnd(6)} | `
      text += `${isNaN(res.unitsToAdd) ? 'N/A'.padEnd(12) : res.unitsToAdd.toFixed(3).padEnd(12)} | `
      text += `${isNaN(res.percentageOfAdd) ? 'N/A'.padEnd(8) : (res.percentageOfAdd.toFixed(3) + '%').padEnd(8)} | `
      text += `${isNaN(res.unitsForBatchWeight) ? 'N/A' : res.unitsForBatchWeight.toFixed(3)}\n`;
    });
    text += `\nSum of Standardized Percentages: ${sumOfStandardizedPercentage.toFixed(2)}%\n`;
    text += `Sum of Calculated Excess Units: ${sumOfCalculatedExcessUnits.toFixed(3)}\n`;
    text += `Sum of '# to add (Batch Wt.)' Values: ${sumOfUnitsForTargetBatchWeight !== null && !isNaN(sumOfUnitsForTargetBatchWeight) ? sumOfUnitsForTargetBatchWeight.toFixed(3) : 'N/A'}\n`;

    return text;
  }, [watchedTargetBatchWeight, watchedTotalExcessUnitsToAdd, watchedComponents, totalOriginalPercentage, displayResults, sumOfStandardizedPercentage, sumOfCalculatedExcessUnits, sumOfUnitsForTargetBatchWeight]);

  const handleSaveFormula = () => {
    const formulaName = watch('saveFormulaName');
    const refTotalWt = parseFloat(watch('referenceOriginalTotalBatchWeightForSave'));

    if (!formulaName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the formula.", variant: "destructive" });
      return;
    }
    if (savedFormulas.find(f => f.name === formulaName.trim())) {
       toast({ title: "Error", description: `A formula named "${formulaName.trim()}" already exists.`, variant: "destructive" });
       return;
    }
     if (isNaN(refTotalWt) || refTotalWt <= 0) {
      toast({ title: "Error", description: "Reference Original Total Batch Weight must be a positive number to save.", variant: "destructive" });
      return;
    }

    const componentsToSave = watchedComponents
        .filter(c => c.name && c.percentageFromTicket && !isNaN(parseFloat(c.percentageFromTicket)))
        .map(c => ({
            name: c.name,
            standardPercentage: parseFloat(c.percentageFromTicket),
            avOrOhValue: c.avOrOhValue && !isNaN(parseFloat(c.avOrOhValue)) ? parseFloat(c.avOrOhValue) : undefined
        }));

    if (componentsToSave.length === 0) {
      toast({ title: "Error", description: "At least one component with a valid name and original batch ticket percentage is required to save.", variant: "destructive" });
      return;
    }

    const newSavedFormula: SavedBatch = {
      id: Date.now().toString(),
      name: formulaName.trim(),
      originalStandardTotalBatchWeight: refTotalWt,
      components: componentsToSave,
      createdAt: new Date().toISOString(),
    };

    setSavedFormulas([...savedFormulas, newSavedFormula]);
    setValue('saveFormulaName', '');
    toast({ title: "Success", description: `Formula "${newSavedFormula.name}" saved.` });
  };

  const handleLoadFormula = (formulaId: string) => {
    const formulaToLoad = savedFormulas.find(f => f.id === formulaId);
    if (formulaToLoad) {
      reset({
        targetBatchWeight: '', 
        totalExcessUnitsToAdd: '', 
        components: formulaToLoad.components.map(c => ({
             name: c.name,
             percentageFromTicket: String(c.standardPercentage),
             avOrOhValue: c.avOrOhValue !== undefined ? String(c.avOrOhValue) : ''
        })),
        saveFormulaName: '',
        referenceOriginalTotalBatchWeightForSave: String(formulaToLoad.originalStandardTotalBatchWeight),
      });
      setSelectedFormulaToLoad('');
      toast({ title: "Formula Loaded", description: `Data for "${formulaToLoad.name}" has been loaded.` });
    }
  };

  const handleDeleteFormula = (formulaId: string) => {
    setSavedFormulas(savedFormulas.filter(f => f.id !== formulaId));
    toast({ title: "Formula Deleted", description: "The selected formula has been removed." });
  };

  const sumOfStandardizedPercentageClass = Math.abs(sumOfStandardizedPercentage - 100) < 0.001 ? 'text-green-600 dark:text-green-400' : 'text-destructive';


  return (
    <CalculatorWrapper
      title="Multiple Components Calculator"
      description="Define components, calculate excess additions, and determine full batch component weights based on a target batch size."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <form onSubmit={handleSubmit(() => { /* Calculations are real-time */ })} className="space-y-8">
        
        <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Component Details</h3>
            <p className="text-sm text-muted-foreground mb-3">Enter each component, its original batch ticket %, and its AV/OH value.</p>
            {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end p-3 mb-2 border rounded-md bg-background/50 shadow-sm">
                <div className="space-y-1">
                    <Label htmlFor={`components.${index}.name`} className="text-xs">Name</Label>
                    <Controller
                    control={control}
                    name={`components.${index}.name`}
                    defaultValue=""
                    render={({ field: { onChange, value } }) => (
                        <MaterialNameCombobox
                        id={`components.${index}.name`}
                        value={value}
                        onChange={onChange}
                        materials={materialsList}
                        placeholder={`Component ${index + 1}`}
                        onMaterialSelect={(material) => {
                            if (material) {
                                setValue(`components.${index}.avOrOhValue`, material.value.toString(), { shouldValidate: true, shouldDirty: true });
                            }
                        }}
                        />
                    )}
                    />
                    {errors.components?.[index]?.name && <p className="text-xs text-destructive mt-1">{errors.components[index]?.name?.message}</p>}
                </div>

                <CommonInput
                    id={`components.${index}.percentageFromTicket`}
                    label="Batch Ticket %"
                    className="h-9 calculator-input text-input-foreground"
                    unit="%"
                    placeholder="e.g., 78.89"
                    {...register(`components.${index}.percentageFromTicket`, {
                        setValueAs: (v) => v === "" ? "" : (parseFloat(v) >= 0 ? parseFloat(v).toString() : ""),
                        validate: value => value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0) || "% must be positive or empty"
                    })}
                    errorMessage={errors.components?.[index]?.percentageFromTicket?.message}
                />

                <CommonInput
                    id={`components.${index}.avOrOhValue`}
                    label="AV/OH Value"
                    className="h-9 calculator-input text-input-foreground"
                    placeholder="e.g., 389"
                    tooltipText="Acid Value or Hydroxyl Value of this material. Pre-fills if material is selected."
                    {...register(`components.${index}.avOrOhValue`, {
                        setValueAs: (v) => v === "" ? "" : (parseFloat(v).toString()), 
                        validate: value => value === "" || (!isNaN(parseFloat(value))) || "Must be a number or empty"
                    })}
                    errorMessage={errors.components?.[index]?.avOrOhValue?.message}
                />

                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="self-center md:self-end" aria-label="Remove component">
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                </div>
            ))}
            <div className="flex justify-between items-center mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', percentageFromTicket: '', avOrOhValue: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Component
                </Button>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Original % from Ticket:</p>
                    <p className="text-lg font-semibold">{totalOriginalPercentage.toFixed(2)}%</p>
                </div>
            </div>
        </section>
        
        <Separator />

        <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Overall Batch Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CommonInput
                id="targetBatchWeight"
                label="Batch Weight"
                unit="Units"
                {...register('targetBatchWeight', {
                    setValueAs: (v) => v === "" ? "" : (parseFloat(v) >= 0 ? parseFloat(v).toString() : ""),
                    validate: value => value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0) || "Must be positive or empty"
                })}
                placeholder="e.g., 1000"
                tooltipText="The total weight for the final batch calculation using % of add values."
                errorMessage={errors.targetBatchWeight?.message}
                />
                <CommonInput
                id="totalExcessUnitsToAdd"
                label="Total Excess Units to Add"
                unit="Units"
                {...register('totalExcessUnitsToAdd', {
                    setValueAs: (v) => v === "" ? "" : (parseFloat(v) >= 0 ? parseFloat(v).toString() : ""),
                    validate: value => value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0) || "Must be positive or empty"
                })}
                placeholder="e.g., 20"
                tooltipText="The total combined amount of all excess components you intend to add."
                errorMessage={errors.totalExcessUnitsToAdd?.message}
                />
            </div>
        </section>

        <Separator />

        {displayResults.length > 0 && (
        <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Calculated Results</h3>
             <div className="flex p-2 mb-1 font-semibold text-sm text-muted-foreground border-b">
                <div className="flex-1">Component Name</div>
                <div className="w-1/3 md:w-1/4 text-right">% of Add</div>
                <div className="w-1/3 md:w-1/4 text-right"># to Add (Batch Wt.)</div>
                <div className="w-10 md:w-12 text-center"> </div> 
            </div>
            <Accordion type="single" collapsible className="w-full space-y-1">
              {displayResults.map((comp, index) => (
                <AccordionItem value={`item-${index}`} key={`display-accordion-${index}`} className="border rounded-md overflow-hidden shadow-sm">
                  <AccordionTrigger className="flex w-full items-center p-3 hover:bg-muted/50 text-sm data-[state=open]:bg-muted/60 [&[data-state=open]>svg]:text-primary">
                    <div className="flex-1 text-left font-medium truncate pr-2">{comp.name || `Component ${index + 1}`}</div>
                    <div className="w-1/3 md:w-1/4 text-right">{isNaN(comp.percentageOfAdd) ? '-' : `${comp.percentageOfAdd.toFixed(3)}%`}</div>
                    <div className="w-1/3 md:w-1/4 text-right font-semibold text-primary">{isNaN(comp.unitsForBatchWeight) ? '-' : comp.unitsForBatchWeight.toFixed(3)}</div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-background border-t">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground">Original %:</p>
                        <p className="text-foreground">{isNaN(comp.percentageFromTicket) ? '-' : `${comp.percentageFromTicket.toFixed(2)}%`}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">AV/OH:</p>
                        <p className="text-foreground">{isNaN(comp.avOrOhValue) ? '-' : comp.avOrOhValue.toString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Std. %:</p>
                        <p className="text-foreground">{isNaN(comp.standardizedPercentage) ? '-' : `${comp.standardizedPercentage.toFixed(2)}%`}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Excess Units:</p>
                        <p className="text-foreground">{isNaN(comp.unitsToAdd) ? '-' : comp.unitsToAdd.toFixed(3)}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t mt-4">
                <ResultDisplay 
                    label="Sum of Standardized %" 
                    value={sumOfStandardizedPercentage} 
                    unit="%" 
                    valueClassName={sumOfStandardizedPercentageClass}
                />
                <ResultDisplay label="Sum of Calculated Excess Units" value={sumOfCalculatedExcessUnits} unit="Units" />
                <ResultDisplay label="Sum of '# to Add (Batch Wt.)'" value={sumOfUnitsForTargetBatchWeight} unit="Units" variant="highlight"/>
            </div>

            { Math.abs(parseFloat(watchedTotalExcessUnitsToAdd) - sumOfCalculatedExcessUnits) > 0.001 && !isNaN(parseFloat(watchedTotalExcessUnitsToAdd)) && sumOfCalculatedExcessUnits > 0 && watchedComponents.some(c => c.percentageFromTicket && parseFloat(c.percentageFromTicket) > 0) && (
                <p className="text-sm text-orange-500 dark:text-orange-400">
                    Note: Sum of calculated excess units ({sumOfCalculatedExcessUnits.toFixed(3)}) may not exactly match total excess units input due to rounding or if total original % is zero.
                </p>
            )}
            { totalOriginalPercentage === 0 && watchedComponents.some(c => c.percentageFromTicket === '' || parseFloat(c.percentageFromTicket) === 0) && parseFloat(watchedTotalExcessUnitsToAdd) > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                    Enter component percentages from the batch ticket to calculate excess units. Total original percentage is currently zero.
                </p>
            )}
            { displayResults.some(r => !isNaN(r.unitsToAdd) && r.unitsToAdd !== 0 && (isNaN(r.avOrOhValue) || r.avOrOhValue === 0)) && (
                 <p className="text-sm text-amber-600 dark:text-amber-400">
                    Enter a non-zero AV/OH value for components with excess units to calculate '% of Add' and subsequent '# to Add'.
                </p>
            )}
            {displayResults.some(r => !isNaN(r.percentageOfAdd) && (isNaN(parseFloat(watchedTargetBatchWeight)) || parseFloat(watchedTargetBatchWeight) <= 0)) && (
                 <p className="text-sm text-amber-600 dark:text-amber-400">
                    Enter a valid Batch Weight to calculate final '# to add' values.
                </p>
            )}
        </section>
        )}
      </form>

      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-medium mb-3">Manage Saved Formulas</h3>
        <div className="space-y-4 p-4 border rounded-md bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
                <Label htmlFor="saveFormulaName">Formula Name to Save</Label>
                <Input id="saveFormulaName" {...register('saveFormulaName')} placeholder="e.g., Product XYZ Standard Formula" className="h-9" />
            </div>
            <CommonInput
              id="referenceOriginalTotalBatchWeightForSave"
              label="Reference Original Total Batch Weight for Saved Formula"
              className="h-9 calculator-input"
              tooltipText="Enter the original total weight this formula's percentages typically represent (e.g., 100000 lbs). Used for compatibility if loading into Short Batch Adjustment calculator."
              {...register('referenceOriginalTotalBatchWeightForSave', {
                  setValueAs: (v) => v === "" ? "" : (parseFloat(v) > 0 ? parseFloat(v).toString() : ""),
                  validate: value => value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) > 0) || "Must be a positive number"
              })}
              errorMessage={errors.referenceOriginalTotalBatchWeightForSave?.message}
            />
          </div>
          <Button
            onClick={handleSaveFormula}
            size="sm"
            className="mt-2"
            disabled={
              !watch('saveFormulaName').trim() ||
              !watchedReferenceOriginalTotalBatchWeightForSave ||
              isNaN(parseFloat(watchedReferenceOriginalTotalBatchWeightForSave)) ||
              parseFloat(watchedReferenceOriginalTotalBatchWeightForSave) <= 0 ||
              watchedComponents.length === 0 ||
              watchedComponents.some(c => !c.name || !c.percentageFromTicket || isNaN(parseFloat(c.percentageFromTicket)))
            }
          >
            <Save className="mr-2 h-4 w-4" /> Save Current Formula (Original %s & AV/OH)
          </Button>

          {savedFormulas.length > 0 && (
            <div className="space-y-2 pt-4 border-t mt-4">
              <Label htmlFor="loadFormulaSelect">Load Saved Formula</Label>
               <div className="flex items-center gap-2">
                <select
                    id="loadFormulaSelect"
                    value={selectedFormulaToLoad}
                    onChange={(e) => {
                        setSelectedFormulaToLoad(e.target.value);
                        if(e.target.value) handleLoadFormula(e.target.value);
                    }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="">Select a formula to load...</option>
                    {savedFormulas.map(formula => (
                      <option key={formula.id} value={formula.id}>
                        {formula.name} (Ref Wt: {formula.originalStandardTotalBatchWeight}, Saved: {new Date(formula.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                </select>
              </div>

              <h4 className="text-sm font-medium mt-4">Saved Formulas:</h4>
              <ul className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
                {savedFormulas.map(formula => (
                  <li key={formula.id} className="flex justify-between items-center p-2 text-sm hover:bg-muted/50 rounded">
                    <span className="truncate pr-2">{formula.name} (Ref Wt: {formula.originalStandardTotalBatchWeight})</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleLoadFormula(formula.id)} aria-label={`Load ${formula.name}`}>
                            <Upload className="h-4 w-4"/>
                        </Button>
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-7 w-7" aria-label={`Delete ${formula.name}`}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the formula "{formula.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteFormula(formula.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
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
           {savedFormulas.length === 0 && <p className="text-sm text-muted-foreground mt-4">No formulas saved yet.</p>}
        </div>
      </div>
    </CalculatorWrapper>
  );
};

export default MultipleComponentsExcessAddPage;
