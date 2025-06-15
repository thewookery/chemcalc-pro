
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
  const [percentageToAdd, setPercentageToAdd] = useState<number | null>(null);

  const [openCombobox, setOpenCombobox] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState(''); 

  useEffect(() => {
    // This effect synchronizes comboboxInputValue based on materialValue
    // or materialValue based on comboboxInputValue if a known material is typed/selected.
    const knownMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());

    if (knownMaterialByName) {
      if (materialValue !== knownMaterialByName.value.toString()) {
        setMaterialValue(knownMaterialByName.value.toString());
      }
    } else {
      // If comboboxInputValue is not a known material name, it might be a custom numeric value
      // or a partial name. If it's purely numeric, it might have already set materialValue.
      // If materialValue corresponds to a known material, but comboboxInputValue doesn't match its name, update comboboxInputValue.
      const knownMaterialByValue = materialsList.find(m => m.value.toString() === materialValue);
      if (knownMaterialByValue && comboboxInputValue.toLowerCase() !== knownMaterialByValue.name.toLowerCase()) {
         if (parseFloat(materialValue).toString() === materialValue){ // only if materialValue is purely numeric
            setComboboxInputValue(knownMaterialByValue.name);
         }
      } else if (!knownMaterialByValue && materialValue !== comboboxInputValue && parseFloat(materialValue).toString() === materialValue) {
        // materialValue is a custom number, and combobox input is different.
        // This case might be tricky, let's prioritize materialValue if it's a valid number not matching a known material.
        // setComboboxInputValue(materialValue); // Could cause loops if not careful.
        // Better: if user types a number in combobox, materialValue is set.
        // If materialValue is set (e.g. programmatically) to a number for which no material name exists,
        // ensure combobox reflects this numeric value.
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

    if (!isNaN(uAdd) && !isNaN(mVal) && mVal !== 0) {
      const pAdd = (uAdd / mVal) * 100;
      setPercentageToAdd(pAdd);
    } else {
      setPercentageToAdd(null);
    }
  }, [unitsToAdd, materialValue]);

  const formula = "(Units of Component to Add / AV or OH of Material) * 100";
  
  const resultsToCopy = useMemo(() => {
    if (percentageToAdd === null) return "";
    const selectedMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());
    const materialDisplayName = selectedMaterialByName ? selectedMaterialByName.name : (materialValue || "Custom Value");
    
    return `Single Component Excess Add Calculation:
Units of Component to Add: ${unitsToAdd}
Material: ${materialDisplayName} (AV/OH: ${materialValue})
Percentage of Material to Add: ${percentageToAdd.toFixed(3)}%`;
  }, [unitsToAdd, materialValue, percentageToAdd, comboboxInputValue]);

  const comboboxTriggerText = useMemo(() => {
    // Priority: 1. Known material name if combobox input matches one. 2. materialValue if it's a number. 3. comboboxInputValue.
    const knownMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());
    if (knownMaterialByName) {
      return knownMaterialByName.name;
    }
    if (materialValue && !isNaN(parseFloat(materialValue)) && parseFloat(materialValue).toString() === materialValue) {
      // Check if this numeric materialValue corresponds to a known material
      const knownMaterialByValue = materialsList.find(m => m.value.toString() === materialValue);
      if (knownMaterialByValue) return knownMaterialByValue.name; // Prefer name if value matches
      return materialValue; // It's a custom number
    }
    if (comboboxInputValue) return comboboxInputValue; 
    return "Select or type value...";
  }, [materialValue, comboboxInputValue]);


  const materialValueTooltip = "Enter the Acid Value (AV) or Hydroxyl Value (OH) of the material. This value must not be zero. You can select from a predefined list or type a custom value.";

  return (
    <CalculatorWrapper
      title="Single Component Excess Add Calculator"
      description="Calculate the percentage of a single component (e.g., acid or alcohol) to add to a batch based on the units needed and the material's Acid Value (AV) or Hydroxyl Value (OH)."
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
          tooltipText="Enter the amount of the component (e.g., acid or alcohol) you need to add."
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
                filter={(value, search) => { // value is material.name from CommandItem
                  const material = materialsList.find(m => m.name.toLowerCase() === value.toLowerCase());
                  if (!material) return 0; 

                  const nameMatch = material.name.toLowerCase().includes(search.toLowerCase());
                  const materialValStr = material.value.toString();
                  const valueSearchMatch = materialValStr.includes(search);
                  
                  // Exact name match is highest priority
                  if (search.toLowerCase() === material.name.toLowerCase()) return 1;
                  
                  // If search is purely numeric and matches material value exactly
                  if (!isNaN(parseFloat(search)) && search.match(/^[\d.-]*$/) && search.trim() !== "" && materialValStr === search) return 0.95;

                  // If search is numeric, prioritize matching material values
                  if (!isNaN(parseFloat(search)) && search.match(/^[\d.-]*$/) && search.trim() !== "") { 
                    if (valueSearchMatch) return 0.9; // Material value contains numeric search
                    // Don't show if numeric search doesn't match value part, even if name matches
                    return 0; 
                  }
                  
                  // If search is text, prioritize name match
                  if (nameMatch) return 1; 

                  return 0; // No match
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
                        // Only set materialValue if search is a valid, non-empty number string
                        const num = parseFloat(search);
                        if (!isNaN(num) && isFinite(num) && search.match(/^[\d.-]*$/) && search.trim() !== "") {
                          setMaterialValue(num.toString());
                        } else if (search.trim() === "") {
                           setMaterialValue(""); // Clear if input is empty
                        }
                        // If search is non-numeric and not a material name, materialValue remains (or becomes empty if search empty)
                    }
                  }}
                />
                <CommandList>
                  <CommandEmpty>No material found. Type custom numeric value.</CommandEmpty>
                  <CommandGroup>
                    {materialsList.map((material) => (
                      <CommandItem
                        key={material.name + "_" + material.value} 
                        value={material.name} // This value is used by CMDK's filter
                        onSelect={(currentValue) => { // currentValue is material.name
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

        <ResultDisplay label="Percentage of Material to Add" value={percentageToAdd} unit="%" variant="highlight" />
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
                This calculator determines the percentage of a single material (like an acid or alcohol) to add to a batch. This is often used when you need to add a specific amount (units) of a component to react, and you know its Acid Value (AV) or Hydroxyl Value (OH).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm py-4">
              <section>
                <h4 className="font-semibold text-md mb-2">1. Input Units of Component to Add</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the amount (in units, e.g., pounds, kilograms, grams) of the specific component you need to add to your batch. This is the quantity that needs to react or be incorporated.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">e.g., <span className="font-mono p-1 bg-background rounded">10 Units</span></div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">2. Input AV or OH of Material</h4>
                <p className="mb-1 text-muted-foreground">
                  Enter the Acid Value (AV) or Hydroxyl Value (OH) of the raw material you are adding.
                  You can select a material from the dropdown list (which will auto-fill its AV/OH value) or type a custom numeric AV/OH value directly.
                  This value must not be zero for the calculation to be valid.
                </p>
                <div className="my-1 p-2 text-xs bg-muted border border-dashed rounded-md text-foreground/80">
                  Select: <span className="font-mono p-1 bg-background rounded">2-Ethylhexanoic Acid (AV: 389)</span> OR Type: <span className="font-mono p-1 bg-background rounded">389</span>
                </div>
              </section>
              <section>
                <h4 className="font-semibold text-md mb-2">3. Understanding the Result</h4>
                <p className="mb-1 text-muted-foreground">
                  The calculator will display the "Percentage of Material to Add". This is the percentage, based on the material's AV/OH, that corresponds to the "Units of Component to Add" you entered.
                </p>
                <p className="mb-1 text-muted-foreground">The formula used is:</p>
                <code className="block my-1 p-2 bg-muted rounded text-xs font-mono">{formula}</code>
                <p className="text-muted-foreground">
                  This calculation essentially normalizes the "Units to Add" against the material's specific reactivity (AV or OH value) and expresses it as a percentage. This percentage can then be used in other calculations, such as determining the total amount to add to a larger batch if this component is part of a multi-component addition.
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
