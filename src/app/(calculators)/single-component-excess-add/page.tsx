
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
import { materialsList } from '@/lib/materials';


const SingleComponentExcessAddCalculatorPage: React.FC = () => {
  const [unitsToAdd, setUnitsToAdd] = useState<string>('');
  const [materialValue, setMaterialValue] = useState<string>(''); // AV or OH value as string
  const [percentageToAdd, setPercentageToAdd] = useState<number | null>(null);

  const [openCombobox, setOpenCombobox] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState(''); // Tracks text in CommandInput

  useEffect(() => {
    if (materialValue) {
      const material = materialsList.find(m => m.value.toString() === materialValue);
      if (material && comboboxInputValue.toLowerCase() !== material.name.toLowerCase()) {
        // If a materialValue is set (e.g. from direct input) and it matches a known material,
        // update the comboboxInputValue to the material's name if it's not already matching.
        // This handles cases where materialValue might be set externally or by typing a number.
        setComboboxInputValue(material.name);
      } else if (!material && comboboxInputValue !== materialValue) {
        // If materialValue is a custom number not in the list, display that number as input value.
        setComboboxInputValue(materialValue);
      }
    } else {
      setComboboxInputValue(""); // Clear input if materialValue is cleared.
    }
  }, [materialValue]); // Removed comboboxInputValue from deps to avoid loops with setComboboxInputValue


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
    // Try to find the name based on comboboxInputValue first (if it's a full name match)
    // Otherwise, use the materialValue (which could be a number or a name if partially typed)
    const selectedMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());
    const materialDisplayName = selectedMaterialByName ? selectedMaterialByName.name : comboboxInputValue || materialValue;
    
    return `Single Component Excess Add Calculation:
Units of Component to Add: ${unitsToAdd}
Material: ${materialDisplayName} (AV/OH: ${materialValue})
Percentage of Material to Add: ${percentageToAdd.toFixed(3)}%`;
  }, [unitsToAdd, materialValue, percentageToAdd, comboboxInputValue]);

 const comboboxTriggerText = useMemo(() => {
    // Priority:
    // 1. If comboboxInputValue is a name of a known material, show that name.
    const knownMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());
    if (knownMaterialByName) {
        // Ensure the actual materialValue (the number) matches if a name is selected
        if (knownMaterialByName.value.toString() === materialValue) {
            return knownMaterialByName.name;
        }
    }
    // 2. If materialValue (the number) corresponds to a known material, show its name.
    //    This covers cases where materialValue was set directly or by selecting.
    const knownMaterialByValue = materialsList.find(m => m.value.toString() === materialValue);
    if (knownMaterialByValue) {
      return knownMaterialByValue.name;
    }
    // 3. If materialValue is set (likely a custom number), show that.
    if (materialValue) return materialValue;
    // 4. Fallback placeholder.
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
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[300px] overflow-y-auto">
              <Command 
                filter={(value, search) => {
                  // value is material.name from CommandItem
                  // search is comboboxInputValue
                  const material = materialsList.find(m => m.name.toLowerCase() === value.toLowerCase());
                  if (!material) return 0; // Should not happen if value comes from list

                  const nameMatch = material.name.toLowerCase().includes(search.toLowerCase());
                  const valueMatch = material.value.toString().includes(search);
                  
                  // If search is a number, prioritize value matching or partial name match
                  if (!isNaN(parseFloat(search)) && search.length > 0) {
                    if (valueMatch) return 1;
                    if (nameMatch) return 0.5; // Lower prio for name match if number is typed
                    return 0;
                  }
                  // If search is not a number, prioritize name matching
                  if (nameMatch) return 1;
                  if (valueMatch) return 0.5; // Lower prio for value match if text is typed
                  return 0;
                }}
              >
                <CommandInput
                  placeholder="Search material or type value..."
                  value={comboboxInputValue}
                  onValueChange={(search) => {
                    setComboboxInputValue(search);
                    const num = parseFloat(search);
                    // If the search term is purely numeric, set materialValue to it.
                    // Otherwise, it's a name search, don't set materialValue yet.
                    if (!isNaN(num) && isFinite(num) && search.match(/^[\d.]+$/)) {
                      setMaterialValue(search);
                    } else if (search === "") {
                       setMaterialValue(""); // Clear if search box is emptied
                    }
                    // If search is textual, materialValue is set onSelect or if user blurs with a number.
                  }}
                />
                <CommandList>
                  <CommandEmpty>No material found. Type custom numeric value.</CommandEmpty>
                  <CommandGroup>
                    {materialsList.map((material) => (
                      <CommandItem
                        key={material.name + "_" + material.value} 
                        value={material.name} // value for CMDK filtering/selection
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
                             materialValue === material.value.toString() && comboboxInputValue.toLowerCase() === material.name.toLowerCase() 
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
    </CalculatorWrapper>
  );
};

export default SingleComponentExcessAddCalculatorPage;
    
