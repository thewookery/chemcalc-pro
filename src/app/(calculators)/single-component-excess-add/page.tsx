
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
        setComboboxInputValue(material.name);
      } else if (!material && comboboxInputValue !== materialValue) {
        setComboboxInputValue(materialValue);
      }
    } else {
      setComboboxInputValue("");
    }
  }, [materialValue]);


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
    const materialDisplayName = selectedMaterialByName ? selectedMaterialByName.name : comboboxInputValue || materialValue;
    
    return `Single Component Excess Add Calculation:
Units of Component to Add: ${unitsToAdd}
Material: ${materialDisplayName} (AV/OH: ${materialValue})
Percentage of Material to Add: ${percentageToAdd.toFixed(3)}%`;
  }, [unitsToAdd, materialValue, percentageToAdd, comboboxInputValue]);

 const comboboxTriggerText = useMemo(() => {
    const knownMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());
    if (knownMaterialByName) {
        if (knownMaterialByName.value.toString() === materialValue) {
            return knownMaterialByName.name;
        }
    }
    const knownMaterialByValue = materialsList.find(m => m.value.toString() === materialValue);
    if (knownMaterialByValue) {
      return knownMaterialByValue.name;
    }
    if (materialValue) return materialValue;
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
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command 
                filter={(value, search) => {
                  const material = materialsList.find(m => m.name.toLowerCase() === value.toLowerCase());
                  if (!material) return 0;

                  const nameMatch = material.name.toLowerCase().includes(search.toLowerCase());
                  const valueMatch = material.value.toString().includes(search);
                  
                  if (!isNaN(parseFloat(search)) && search.length > 0) {
                    if (valueMatch) return 1;
                    if (nameMatch) return 0.5; 
                    return 0;
                  }
                  if (nameMatch) return 1;
                  if (valueMatch) return 0.5; 
                  return 0;
                }}
              >
                <CommandInput
                  placeholder="Search material or type value..."
                  value={comboboxInputValue}
                  onValueChange={(search) => {
                    setComboboxInputValue(search);
                    const num = parseFloat(search);
                    if (!isNaN(num) && isFinite(num) && search.match(/^[\d.]+$/)) {
                      setMaterialValue(search);
                    } else if (search === "") {
                       setMaterialValue("");
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
    
