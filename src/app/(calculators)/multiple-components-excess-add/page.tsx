
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
import { Trash2, PlusCircle, Layers, Check, ChevronsUpDown, HelpCircle, Save, Upload, AlertTriangle } from 'lucide-react';
import type { BatchTicketComponentInput, CalculatedExcessComponent, SavedBatch, SavedBatchComponent, AdjustedComponent } from '@/types';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

const SAVED_BATCHES_KEY = 'chemcalc_savedFormulas_excessAndFull_v1';

interface FormData {
  totalExcessUnitsToAdd: string;
  components: BatchTicketComponentInput[];
  saveFormulaName: string;
  referenceOriginalTotalBatchWeightForSave: string; 
}

interface MaterialNameComboboxProps {
  value: string;
  onChange: (value: string) => void;
  materials: Material[];
  placeholder?: string;
  id?: string;
}

const MaterialNameCombobox: React.FC<MaterialNameComboboxProps> = ({ value, onChange, materials, placeholder, id }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");

  useEffect(() => {
     if (value !== searchTerm) {
        setSearchTerm(value || "");
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleSelect = (materialName: string) => {
    onChange(materialName);
    setSearchTerm(materialName);
    setIsOpen(false);
  };

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    onChange(newSearchTerm); 
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
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <span className="truncate">{triggerText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0 max-h-[200px] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
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


const MultipleComponentsExcessAddPage: React.FC = () => {
  const { toast } = useToast();
  const [savedFormulas, setSavedFormulas] = useLocalStorage<SavedBatch[]>(SAVED_BATCHES_KEY, []);
  const [selectedFormulaToLoad, setSelectedFormulaToLoad] = useState<string>('');

  const { register, control, watch, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>({
    defaultValues: {
      totalExcessUnitsToAdd: '',
      components: [
        { name: '', percentageFromTicket: '' },
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
  const watchedReferenceOriginalTotalBatchWeightForSave = watch('referenceOriginalTotalBatchWeightForSave');

  // State for Part 1: Excess Add Calculation
  const [excessAddResults, setExcessAddResults] = useState<CalculatedExcessComponent[]>([]);
  const [totalOriginalPercentage, setTotalOriginalPercentage] = useState<number>(0);
  const [sumOfStandardizedPercentage, setSumOfStandardizedPercentage] = useState<number>(0);
  const [sumOfCalculatedExcessUnits, setSumOfCalculatedExcessUnits] = useState<number>(0);

  // State for Part 2: Full Batch Component Breakdown
  const [desiredTotalBatchWeightForFullBatch, setDesiredTotalBatchWeightForFullBatch] = useState<string>('');
  const [fullBatchBreakdownResults, setFullBatchBreakdownResults] = useState<AdjustedComponent[]>([]);
  const [sumOfFullBatchWeights, setSumOfFullBatchWeights] = useState<number | null>(null);


  // Effect for Part 1: Excess Add Calculation
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
        if (!isNaN(originalPerc) && originalPerc > 0) {
          const standardizedPerc = (originalPerc / currentTotalOriginalPerc) * 100;
          currentSumOfStandardizedPerc += standardizedPerc;
          
          let unitsForThisComponent = NaN;
          if (!isNaN(parsedTotalExcessUnits) && parsedTotalExcessUnits > 0) {
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
          });
        } else {
             tempResults.push({
                name: comp.name || '',
                percentageFromTicket: NaN,
                standardizedPercentage: NaN,
                unitsToAdd: NaN,
            });
        }
      });
    } else {
        watchedComponents.forEach(comp => {
            tempResults.push({
                name: comp.name || '',
                percentageFromTicket: NaN,
                standardizedPercentage: NaN,
                unitsToAdd: NaN,
            });
        });
    }
    
    setExcessAddResults(tempResults);
    setSumOfStandardizedPercentage(currentSumOfStandardizedPerc);
    setSumOfCalculatedExcessUnits((!isNaN(parsedTotalExcessUnits) && parsedTotalExcessUnits > 0) ? currentSumOfExcessUnits : 0);

  }, [watchedComponents, watchedTotalExcessUnitsToAdd]);

  // Effect for Part 2: Full Batch Component Breakdown
  useEffect(() => {
    const targetFullBatchWtNum = parseFloat(desiredTotalBatchWeightForFullBatch);
    const newFullBatchResults: AdjustedComponent[] = [];
    let newSumOfFullWeights = 0;

    const validTargetFullBatchWt = (!isNaN(targetFullBatchWtNum) && isFinite(targetFullBatchWtNum) && targetFullBatchWtNum >= 0) ? targetFullBatchWtNum : NaN;

    // Part 2 calculation is dependent on sumOfCalculatedExcessUnits being positive from Part 1
    if (sumOfCalculatedExcessUnits > 0 && !isNaN(validTargetFullBatchWt) && excessAddResults.length > 0) {
      excessAddResults.forEach(compFromPart1 => {
        const compName = compFromPart1.name || '';
        const unitsForThisComp = compFromPart1.unitsToAdd; // This is the 'excess unit' for the component from Part 1

        let calculatedNewWeightForFullBatch = NaN;
        let proportionAsPercentage = NaN;

        // Ensure unitsForThisComp is a valid number and sumOfCalculatedExcessUnits is positive to avoid division by zero
        if (!isNaN(unitsForThisComp) && isFinite(unitsForThisComp) && unitsForThisComp >= 0 && sumOfCalculatedExcessUnits > 0) {
          const proportion = unitsForThisComp / sumOfCalculatedExcessUnits;
          proportionAsPercentage = proportion * 100;
          
          if (!isNaN(proportion) && isFinite(proportion)) {
            calculatedNewWeightForFullBatch = proportion * validTargetFullBatchWt;
            if (!isNaN(calculatedNewWeightForFullBatch) && isFinite(calculatedNewWeightForFullBatch)) {
              newSumOfFullWeights += calculatedNewWeightForFullBatch;
            } else {
              calculatedNewWeightForFullBatch = NaN;
            }
          }
        }
        
        newFullBatchResults.push({
          name: compName,
          // This field in AdjustedComponent now stores the component's share of total excess, as a percentage
          standardPercentage: !isNaN(proportionAsPercentage) ? proportionAsPercentage : NaN, 
          newRequiredWeight: calculatedNewWeightForFullBatch,
        });
      });
    } else {
      // If dependencies for Part 2 calc are not met (e.g., no excess units calculated), create empty/placeholder results
      const sourceForPlaceholders = excessAddResults.length > 0 ? excessAddResults : watchedComponents;
      sourceForPlaceholders.forEach(comp => {
        newFullBatchResults.push({
          name: comp.name || (comp as BatchTicketComponentInput).name || '', // Ensure name is accessible
          standardPercentage: NaN,
          newRequiredWeight: NaN,
        });
      });
    }

    setFullBatchBreakdownResults(newFullBatchResults);
    // Only set sum if calculation was possible
    if (sumOfCalculatedExcessUnits > 0 && !isNaN(newSumOfFullWeights) && isFinite(newSumOfFullWeights) && !isNaN(validTargetFullBatchWt)) {
        setSumOfFullBatchWeights(newSumOfFullWeights);
    } else {
        setSumOfFullBatchWeights(null);
    }
  }, [excessAddResults, desiredTotalBatchWeightForFullBatch, sumOfCalculatedExcessUnits, watchedComponents]);


  const formula = "1. Std. % (for Excess) = (Comp. % / Total Original %) * 100. Excess Units = (Std. % / 100) * Total Excess Units.\n2. Full Batch Wt. (per Comp.) = (Comp. Excess Units / Total Excess Units) * Desired Total Full Batch Wt.";
  
  const resultsToCopy = useMemo(() => {
    let text = `Multiple Components Calculation:\n\n== Part 1: Excess Add Calculation ==\n`;
    text += `Components (% from Batch Ticket):\n`;
    watchedComponents.forEach((comp, index) => {
      text += `  - ${comp.name || `Component ${index+1}`}: ${comp.percentageFromTicket}%\n`;
    });
    text += `Total Original % from Batch Ticket: ${totalOriginalPercentage.toFixed(2)}%\n`;
    text += `Total Excess Units to Add to Batch: ${watchedTotalExcessUnitsToAdd}\n\n`;
    text += `Calculated Excess Breakdown:\n`;
    text += `Component Name | % from Ticket | Standardized % | Excess Units to Add\n`;
    text += `-----------------------------------------------------------------------\n`;
    excessAddResults.forEach(res => {
      text += `${(res.name || '-').padEnd(14)} | ${isNaN(res.percentageFromTicket) ? 'N/A'.padEnd(13) : (res.percentageFromTicket.toFixed(2) + '%').padEnd(13)} | ${isNaN(res.standardizedPercentage) ? 'N/A'.padEnd(14) : (res.standardizedPercentage.toFixed(2) + '%').padEnd(14)} | ${isNaN(res.unitsToAdd) ? 'N/A' : res.unitsToAdd.toFixed(3)}\n`;
    });
    text += `\nSum of Standardized Percentages: ${sumOfStandardizedPercentage.toFixed(2)}%\n`;
    text += `Sum of Calculated Excess Units: ${sumOfCalculatedExcessUnits.toFixed(3)}\n\n`;

    text += `== Part 2: Full Batch Component Breakdown ==\n`;
    text += `Desired Total Batch Weight (for Full Batch): ${desiredTotalBatchWeightForFullBatch}\n`;
    if (sumOfCalculatedExcessUnits > 0 && parseFloat(desiredTotalBatchWeightForFullBatch) > 0) {
        text += `Component Breakdown (based on share of calculated excess from Part 1):\n`;
        text += `Component Name | Share of Excess (%) | Weight for Full Batch\n`;
        text += `-------------------------------------------------------------\n`;
        fullBatchBreakdownResults.forEach(res => {
        // res.standardPercentage now holds (Comp.Excess/TotalExcess)*100
        text += `${(res.name || '-').padEnd(14)} | ${isNaN(res.standardPercentage) ? 'N/A'.padEnd(19) : (res.standardPercentage.toFixed(2) + '%').padEnd(19)} | ${isNaN(res.newRequiredWeight) ? 'N/A' : res.newRequiredWeight.toFixed(3)}\n`;
        });
        text += `Sum of Calculated Weights for Full Batch: ${sumOfFullBatchWeights !== null ? sumOfFullBatchWeights.toFixed(3) : 'N/A'}\n`;
    } else {
        text += `Full batch breakdown requires valid excess unit calculations in Part 1 and a desired total batch weight.\n`;
    }

    return text;
  }, [watchedTotalExcessUnitsToAdd, watchedComponents, totalOriginalPercentage, excessAddResults, sumOfStandardizedPercentage, sumOfCalculatedExcessUnits, desiredTotalBatchWeightForFullBatch, fullBatchBreakdownResults, sumOfFullBatchWeights]);

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
        .map(c => ({ name: c.name, standardPercentage: parseFloat(c.percentageFromTicket) }));

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
    setValue('referenceOriginalTotalBatchWeightForSave', '');
    toast({ title: "Success", description: `Formula "${newSavedFormula.name}" saved.` });
  };

  const handleLoadFormula = (formulaId: string) => {
    const formulaToLoad = savedFormulas.find(f => f.id === formulaId);
    if (formulaToLoad) {
      reset({
        totalExcessUnitsToAdd: '', 
        components: formulaToLoad.components.map(c => ({ name: c.name, percentageFromTicket: String(c.standardPercentage) })),
        saveFormulaName: '',
        referenceOriginalTotalBatchWeightForSave: String(formulaToLoad.originalStandardTotalBatchWeight), 
      });
      setDesiredTotalBatchWeightForFullBatch(''); 
      setSelectedFormulaToLoad(''); 
      toast({ title: "Formula Loaded", description: `Data for "${formulaToLoad.name}" has been loaded.` });
    }
  };

  const handleDeleteFormula = (formulaId: string) => {
    setSavedFormulas(savedFormulas.filter(f => f.id !== formulaId));
    toast({ title: "Formula Deleted", description: "The selected formula has been removed." });
  };


  return (
    <CalculatorWrapper
      title="Multiple Components Calculator"
      description="Standardize component percentages for excess addition, then optionally calculate a full batch breakdown using these standardized proportions."
      formula={formula}
      resultsToCopy={resultsToCopy}
    >
      <form onSubmit={handleSubmit(() => { /* Calculations are real-time */ })} className="space-y-8">
        {/* Part 1: Excess Add Section */}
        <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Part 1: Excess Add Calculation</h3>
            <div>
                <Label className="text-lg font-semibold">Component Percentages from Batch Ticket</Label>
                <p className="text-sm text-muted-foreground mb-3">Enter each component and its percentage as listed on the original batch ticket.</p>
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_1fr_auto] gap-2 items-end p-3 mb-2 border rounded-md bg-background/50 shadow-sm">
                    <div className="space-y-1 col-span-1 md:col-span-1">
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

                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="self-center md:self-end col-start-2 md:col-start-auto" aria-label="Remove component">
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

            <Separator />
            
            <CommonInput
            id="totalExcessUnitsToAdd"
            label="Total Excess Units to Add to Batch"
            unit="Units"
            {...register('totalExcessUnitsToAdd', { 
                setValueAs: (v) => v === "" ? "" : (parseFloat(v) >= 0 ? parseFloat(v).toString() : ""),
                validate: value => value === "" || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0) || "Must be positive or empty"
            })}
            placeholder="e.g., 20"
            tooltipText="The total combined amount of all excess components you intend to add."
            errorMessage={errors.totalExcessUnitsToAdd?.message}
            />


            {excessAddResults.length > 0 && (
            <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Calculated Excess Breakdown</h3>
                <Table>
                <TableHeader className="hidden md:table-header-group">
                    <TableRow>
                    <TableHead>Component Name</TableHead>
                    <TableHead className="text-right">Original %</TableHead>
                    <TableHead className="text-right">Standardized %</TableHead>
                    <TableHead className="text-right">Excess Units to Add</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {excessAddResults.map((comp, index) => (
                    <TableRow 
                        key={index} 
                        className="block md:table-row mb-4 md:mb-0 p-3 md:p-0 border rounded-lg md:border-b md:border-0 md:rounded-none shadow-md md:shadow-none last:mb-0 md:last:mb-0"
                    >
                        <TableCell className="block md:table-cell p-1 md:p-4 font-medium">
                            <div className="flex justify-between items-center md:block">
                                <span className="text-sm font-semibold text-muted-foreground md:hidden">Name:</span>
                                <span>{comp.name || `Component ${index + 1}`}</span>
                            </div>
                        </TableCell>
                        <TableCell className="block md:table-cell p-1 md:p-4 md:text-right">
                            <div className="flex justify-between items-center md:block">
                                <span className="text-sm font-semibold text-muted-foreground md:hidden">Original %:</span>
                                <span>{isNaN(comp.percentageFromTicket) ? '-' : `${comp.percentageFromTicket.toFixed(2)}%`}</span>
                            </div>
                        </TableCell>
                        <TableCell className="block md:table-cell p-1 md:p-4 md:text-right">
                            <div className="flex justify-between items-center md:block">
                                <span className="text-sm font-semibold text-muted-foreground md:hidden">Std. %:</span>
                                <span>{isNaN(comp.standardizedPercentage) ? '-' : `${comp.standardizedPercentage.toFixed(2)}%`}</span>
                            </div>
                        </TableCell>
                        <TableCell className="block md:table-cell p-1 md:p-4 md:text-right">
                            <div className="flex justify-between items-center md:block">
                                <span className="text-sm font-semibold text-muted-foreground md:hidden">Excess Units:</span>
                                <span className="font-semibold md:font-normal text-primary md:text-foreground">
                                    {isNaN(comp.unitsToAdd) ? '-' : comp.unitsToAdd.toFixed(3)}
                                </span>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <ResultDisplay label="Sum of Standardized %" value={sumOfStandardizedPercentage} unit="%" />
                    <ResultDisplay label="Sum of Calculated Excess Units" value={sumOfCalculatedExcessUnits} unit="Units" />
                </div>
                { Math.abs(parseFloat(watchedTotalExcessUnitsToAdd) - sumOfCalculatedExcessUnits) > 0.001 && !isNaN(parseFloat(watchedTotalExcessUnitsToAdd)) && sumOfCalculatedExcessUnits > 0 && watchedComponents.some(c => c.percentageFromTicket && parseFloat(c.percentageFromTicket) > 0) && (
                    <p className="text-sm text-orange-500">
                        Note: The sum of calculated excess units ({sumOfCalculatedExcessUnits.toFixed(3)}) does not exactly match the total excess units input ({!isNaN(parseFloat(watchedTotalExcessUnitsToAdd)) ? parseFloat(watchedTotalExcessUnitsToAdd).toFixed(3) : 'N/A'}). This may be due to rounding or if total original % is zero.
                    </p>
                )}
                { totalOriginalPercentage === 0 && watchedComponents.some(c => c.percentageFromTicket === '' || parseFloat(c.percentageFromTicket) === 0) && parseFloat(watchedTotalExcessUnitsToAdd) > 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        Enter component percentages from the batch ticket to calculate excess units. Total original percentage is currently zero.
                    </p>
                )}
            </div>
            )}
        </section>

        <Separator />

        {/* Part 2: Full Batch Component Breakdown Section */}
        <section className="space-y-4 p-4 border rounded-md bg-muted/30">
            <h3 className="text-xl font-semibold mb-3 text-primary">Part 2: Full Batch Component Breakdown</h3>
            <p className="text-sm text-muted-foreground mb-3">
                This section uses the **share of calculated excess units** from Part 1 to break down a desired total batch weight.
            </p>
            <CommonInput
                id="desiredTotalBatchWeightForFullBatch"
                label="Desired Total Batch Weight (for Full Batch)"
                unit="Units"
                value={desiredTotalBatchWeightForFullBatch}
                onChange={(e) => setDesiredTotalBatchWeightForFullBatch(e.target.value)}
                placeholder="e.g., 1000"
                tooltipText="Enter the total weight of the full batch you want to produce."
                
            />

            {fullBatchBreakdownResults.length > 0 && parseFloat(desiredTotalBatchWeightForFullBatch) > 0 && sumOfCalculatedExcessUnits > 0 && (
                <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">Calculated Full Batch Breakdown</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Component Name</TableHead>
                                <TableHead className="text-right">Share of Excess (%)</TableHead>
                                <TableHead className="text-right">Weight for Full Batch</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fullBatchBreakdownResults.map((comp, index) => (
                                <TableRow key={`full_batch_comp_${index}`}>
                                    <TableCell>{comp.name || `Component ${index + 1}`}</TableCell>
                                    {/* comp.standardPercentage now stores (Comp.Excess/TotalExcess)*100 */}
                                    <TableCell className="text-right">{isNaN(comp.standardPercentage) ? '-' : `${comp.standardPercentage.toFixed(2)}%`}</TableCell>
                                    <TableCell className="text-right font-semibold text-primary">{isNaN(comp.newRequiredWeight) ? '-' : comp.newRequiredWeight.toFixed(3)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <ResultDisplay label="Sum of Calculated Weights for Full Batch" value={sumOfFullBatchWeights} unit="Units" />
                     {sumOfFullBatchWeights !== null && !isNaN(parseFloat(desiredTotalBatchWeightForFullBatch)) && parseFloat(desiredTotalBatchWeightForFullBatch) > 0 && Math.abs(parseFloat(desiredTotalBatchWeightForFullBatch) - sumOfFullBatchWeights) > 0.001 && (
                        <p className="text-sm text-orange-500 mt-2">
                        Note: Sum of calculated weights for full batch ({sumOfFullBatchWeights.toFixed(3)}) does not exactly match the desired total batch weight ({parseFloat(desiredTotalBatchWeightForFullBatch).toFixed(3)}). This can occur due to rounding.
                        </p>
                    )}
                </div>
            )}
            { (sumOfCalculatedExcessUnits <= 0 || isNaN(sumOfCalculatedExcessUnits)) && parseFloat(desiredTotalBatchWeightForFullBatch) > 0 && (
                 <p className="text-sm text-amber-600 dark:text-amber-400">
                    Full batch breakdown requires valid component percentages and a positive "Total Excess Units to Add" in Part 1.
                </p>
            )}
        </section>
      </form>

      {/* Save/Load Section */}
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
            <Save className="mr-2 h-4 w-4" /> Save Current Formula (Original %s)
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
        
 
    
