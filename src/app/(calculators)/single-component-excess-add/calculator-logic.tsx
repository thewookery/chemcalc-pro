
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalculatorWrapper from '@/components/calculators/CalculatorWrapper';
import CommonInput from '@/components/calculators/CommonInput';
import ResultDisplay from '@/components/calculators/ResultDisplay';
import { Check, ChevronsUpDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { materialsList, type Material } from '@/lib/materials';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger as HelpDialogTrigger, 
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const SingleComponentExcessAddCalculatorLogic: React.FC = () => {
  const [unitsToAdd, setUnitsToAdd] = useState<string>('');
  const [materialValue, setMaterialValue] = useState<string>(''); 
  const [batchWeight, setBatchWeight] = useState<string>('');
  const [percentageToAdd, setPercentageToAdd] = useState<number | null>(null);
  const [totalAmountToAdd, setTotalAmountToAdd] = useState<number | null>(null);

  const [openCombobox, setOpenCombobox] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState(''); 

  useEffect(() => {
    const knownMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());

    if (knownMaterialByName) {
      if (materialValue !== knownMaterialByName.value.toString()) {
        setMaterialValue(knownMaterialByName.value.toString());
      }
    } else {
      const knownMaterialByValue = materialsList.find(m => m.value.toString() === materialValue);
      if (knownMaterialByValue && comboboxInputValue.toLowerCase() !== knownMaterialByValue.name.toLowerCase()) {
         if (parseFloat(materialValue).toString() === materialValue){ 
            setComboboxInputValue(knownMaterialByValue.name);
         }
      } else if (!knownMaterialByValue && materialValue !== comboboxInputValue && parseFloat(materialValue).toString() === materialValue) {
        if (materialValue && !isNaN(parseFloat(materialValue)) && !knownMaterialByValue) {
           if (comboboxInputValue !== materialValue) {
             setComboboxInputValue(materialValue);
           }
        }
      }
    }
  }, [materialValue, comboboxInputValue]);


  useEffect(() => {
    const uAdd = parseFloat(unitsToAdd);
    const mVal = parseFloat(materialValue);
    const bWt = parseFloat(batchWeight);
    let currentPercentageToAdd: number | null = null;

    if (!isNaN(uAdd) && !isNaN(mVal) && mVal !== 0) {
      const pAdd = (uAdd / mVal) * 100;
      setPercentageToAdd(pAdd);
      currentPercentageToAdd = pAdd;
    } else {
      setPercentageToAdd(null);
    }

    if (currentPercentageToAdd !== null && !isNaN(bWt) && bWt >= 0) {
        const totalAdd = (currentPercentageToAdd / 100) * bWt;
        setTotalAmountToAdd(totalAdd);
    } else {
        setTotalAmountToAdd(null);
    }

  }, [unitsToAdd, materialValue, batchWeight]);

  const formula = "1. Percentage to Add (%) = (Units of Component to Add / AV or OH of Material) * 100\n2. Total Amount to Add (Units) = (Percentage to Add / 100) * Batch Weight";
  
  const resultsToCopy = useMemo(() => {
    const selectedMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());
    const materialDisplayName = selectedMaterialByName ? selectedMaterialByName.name : (materialValue || "Custom Value");
    
    let text = `Single Component Excess Add Calculation:\n`;
    text += `Units of Component to Add: ${unitsToAdd} Units\n`;
    text += `Material: ${materialDisplayName} (AV/OH: ${materialValue})\n`;
    if (percentageToAdd !== null) {
      text += `Calculated Percentage of Material to Add: ${percentageToAdd.toFixed(3)}%\n`;
    }
    text += `Batch Weight: ${batchWeight} Units\n`;
    if (totalAmountToAdd !== null) {
      text += `Total Amount of Material to Add: ${totalAmountToAdd.toFixed(3)} Units\n`;
    }
    return text;
  }, [unitsToAdd, materialValue, percentageToAdd, batchWeight, totalAmountToAdd, comboboxInputValue]);

  const comboboxTriggerText = useMemo(() => {
    const knownMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());
    if (knownMaterialByName) {
      return knownMaterialByName.name;
    }
    if (materialValue && !isNaN(parseFloat(materialValue)) && parseFloat(materialValue).toString() === materialValue) {
      const knownMaterialByValue = materialsList.find(m => m.value.toString() === materialValue);
      if (knownMaterialByValue) return knownMaterialByValue.name; 
      return materialValue; 
    }
    if (comboboxInputValue) return comboboxInputValue; 
    return "Select or type value...";
  }, [materialValue, comboboxInputValue]);


  const materialValueTooltip = "Enter the Acid Value (AV) or Hydroxyl Value (OH) of the material. This value must not be zero. You can select from a predefined list or type a custom value.";

  return (
    <CalculatorWrapper
      title="Single Component Excess Add Calculator"
      description="Calculate the percentage of a single component (e.g., acid or alcohol) to add to a batch based on the units needed, the material's AV/OH, and the total batch weight."
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
          tooltipText="Enter the amount of the component (e.g., acid or alcohol) you need to add. This refers to the reactive part."
        />
        
        <div className="space-y-1.5 w-full">
          <div className="flex items-center justify-between">
            <Label htmlFor="material-value-combobox-trigger">AV or OH of Material</Label>
            {materialValueTooltip && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button type="button" aria-label="Info for AV or OH of Material" className="p-0.5 text-muted-foreground hover:text-foreground">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="end">
                    <p className="max-w-xs">{materialValueTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                id="material-value-combobox-trigger"
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between text-input-foreground calculator-input"
              >
                <span className="truncate">
                  {comboboxTriggerText}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[--radix-popover-trigger-width] p-0 max-h-[300px] overflow-y-auto"
            >
              <Command 
                filter={(value, search) => { 
                  const material = materialsList.find(m => m.name.toLowerCase() === value.toLowerCase());
                  if (!material) return 0; 

                  const nameMatch = material.name.toLowerCase().includes(search.toLowerCase());
                  const materialValStr = material.value.toString();
                  const valueSearchMatch = materialValStr.includes(search);
                  
                  if (search.toLowerCase() === material.name.toLowerCase()) return 1;
                  if (!isNaN(parseFloat(search)) && search.match(/^[\\d.-]*$/) && search.trim() !== "" && materialValStr === search) return 0.95;
                  if (!isNaN(parseFloat(search)) && search.match(/^[\\d.-]*$/) && search.trim() !== "") { 
                    if (valueSearchMatch) return 0.9; 
                    return 0; 
                  }
                  if (nameMatch) return 1; 
                  return 0; 
                }}
              >
                <CommandInput
                  placeholder="Search material or type value..."
                  value={comboboxInputValue}
                  onValueChange={(search) => {
                    setComboboxInputValue(search);
                    const materialByName = materialsList.find(m => m.name.toLowerCase() === search.toLowerCase());
                    if (materialByName) {
                        setMaterialValue(materialByName.value.toString());
                    } else {
                        const num = parseFloat(search);
                        if (!isNaN(num) && isFinite(num) && search.match(/^[\\d.-]*$/) && search.trim() !== "") {
                          setMaterialValue(num.toString());
                        } else if (search.trim() === "") {
                           setMaterialValue(""); 
                        }
                    }
                  }}
                />
                <CommandList>
                  <CommandEmpty>No material found. Type custom numeric value.</CommandEmpty>
                  <CommandGroup>
                    {materialsList.map((material) => (
                      <CommandItem
                        key={material.name + "_" + material.value} 
                        value={material.name} 
                        onSelect={(currentValue) => { 
                          const selected = materialsList.find(m => m.name.toLowerCase() === currentValue.toLowerCase());
                          if (selected) {
                            setMaterialValue(selected.value.toString());
                            setComboboxInputValue(selected.name); 
                          }
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                             (materialValue === material.value.toString() && comboboxInputValue.toLowerCase() === material.name.toLowerCase()) || 
                             (materialValue === material.value.toString() && comboboxInputValue === material.value.toString() && !materialsList.some(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase()))
                             ? "opacity-100" 
                             : "opacity-0"
                          )}
                        />
                        {material.name} ({material.type === "acid" ? "AV" : "OH"}: {material.value})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {parseFloat(materialValue) === 0 && !isNaN(parseFloat(materialValue)) && unitsToAdd !== '' && (
             <p className="text-sm text-orange-600 dark:text-orange-400">AV or OH of Material cannot be zero for this calculation.</p>
          )}
        </div>

        <CommonInput
          id="batchWeight"
          label="Batch Weight"
          unit="Units (e.g., lbs)"
          value={batchWeight}
          onChange={(e) => setBatchWeight(e.target.value)}
          placeholder="e.g., 1000"
          tooltipText="Enter the total weight of the batch. The 'Total Amount to Add' will be in these same units."
        />

        <ResultDisplay label="Calculated Percentage of Material to Add" value={percentageToAdd} unit="%" />
        <ResultDisplay label="Total Amount of Material to Add" value={totalAmountToAdd} unit="Units" variant="highlight" />
      </div>
      <div className="mt-8 pt-6 border-t">
        <Dialog>
          <HelpDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              <HelpCircle className="mr-2 h-4 w-4" /> How to use this calculator
            </Button>
          </HelpDialogTrigger>
          <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">How to Use the Single Component Excess Add Calculator</DialogTitle>
              <DialogDescription>
                This calculator helps determine the total amount of a single material (like an acid or alcohol) to add to a batch, considering its reactivity (AV/OH) and the desired batch weight.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Units of Component to Add</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the amount (in units, e.g., pounds, kilograms, grams) of the specific component (e.g. the acid part of an ester) you need to incorporate into your batch based on its reactive value.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">10 Units</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input AV or OH of Material</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the Acid Value (AV) or Hydroxyl Value (OH) of the raw material you are using.
                  You can select a material from the dropdown list (which will auto-fill its AV/OH value) or type a custom numeric AV/OH value directly.
                  This value must not be zero.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">
                  Select: <span className="font-mono p-1 bg-background rounded">2-Ethylhexanoic Acid (AV: 389)</span> OR Type: <span className="font-mono p-1 bg-background rounded">389</span>
                </div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Input Batch Weight</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the total weight of the batch you are making. The units used here (e.g., pounds, kilograms) will be the same units for the "Total Amount of Material to Add" result.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">1000 lbs</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">4. Understanding the Results</h4>
                <p className="mb-1 text-muted-foreground">
                  The calculator will display two key results:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                  <li><strong>Calculated Percentage of Material to Add:</strong> This is an intermediate value representing the percentage of the material needed, based on its AV/OH and the "Units of Component to Add".</li>
                  <li><strong>Total Amount of Material to Add:</strong> This is the final amount of the raw material (e.g., the actual 2-Ethylhexanoic Acid) you need to weigh out for your specified "Batch Weight".</li>
                </ul>
                <p className="mt-1 mb-1 text-muted-foreground">The formulas used are:</p>
                <code className="block whitespace-pre-wrap my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="text-muted-foreground">
                  This calculation allows you to determine how much of a bulk raw material to use when you know how many "reactive units" you need and the total size of your batch.
                </p>
              </section>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CalculatorWrapper>
  );
};

export default SingleComponentExcessAddCalculatorLogic;

