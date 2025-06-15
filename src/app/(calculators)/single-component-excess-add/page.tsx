
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

const materialsList = [
  // Acids (AV)
  { name: "2-Ethylhexanoic Acid", value: 389, type: "acid" },
  { name: "Adipic Acid", value: 768, type: "acid" },
  { name: "Azelaic Acid", value: 596, type: "acid" },
  { name: "C 101 (HCFA)", value: 270, type: "acid" },
  { name: "C810 Acid", value: 370, type: "acid" },
  { name: "C9 Acid", value: 350, type: "acid" },
  { name: "Emersol 7036 VEG Stearic", value: 210, type: "acid" },
  { name: "Isononanoic Acid", value: 355, type: "acid" },
  { name: "Isostearic Acid", value: 182, type: "acid" },
  { name: "Lauric Acid", value: 280, type: "acid" },
  { name: "Neodecanoic Acid", value: 326, type: "acid" },
  { name: "Neopentanoic Acid", value: 549, type: "acid" },
  { name: "Oleic Acid", value: 202, type: "acid" },
  { name: "Oleic Acid Veg", value: 202, type: "acid" },
  { name: "Phthalic Acid", value: 675, type: "acid" },
  { name: "Sebacic Acid", value: 553, type: "acid" },
  { name: "Stearic Acid 132", value: 207, type: "acid" },
  { name: "Stearic Acid 1655 VEG", value: 208.5, type: "acid" },
  { name: "TOFA", value: 195, type: "acid" },
  { name: "TOFA VEG", value: 197, type: "acid" },
  { name: "Emery 2016", value: 194, type: "acid" },
  { name: "Palmitic Acid", value: 219, type: "acid" },
  { name: "Century 1107 Isostearic", value: 186, type: "acid" },
  { name: "Century D1 Acid", value: 177, type: "acid" },
  { name: "Heptanoic C7 Acid", value: 431, type: "acid" },
  { name: "Valeric CS Acid", value: 549, type: "acid" },
  { name: "TM Anhydride", value: 876, type: "acid" },
  { name: "Dodecandiodic Acid", value: 487, type: "acid" },
  { name: "Isobutyric Acid", value: 637, type: "acid" },
  { name: "P205", value: 850, type: "acid" },
  { name: "Isocarb 16", value: 215, type: "acid" },
  { name: "Fatty Acid Canola", value: 191, type: "acid" },
  // Alcohols (OH)
  { name: "2-EH (Alcohol)", value: 430, type: "alcohol" },
  { name: "Alfol10", value: 351, type: "alcohol" },
  { name: "Alfol1618", value: 219, type: "alcohol" },
  { name: "Alfol810", value: 387, type: "alcohol" },
  { name: "DEG", value: 1057, type: "alcohol" },
  { name: "Di-Pentaerythritol", value: 1324, type: "alcohol" },
  { name: "Exxal10", value: 337, type: "alcohol" },
  { name: "Exxal13", value: 286, type: "alcohol" },
  { name: "Exxal8", value: 432, type: "alcohol" },
  { name: "Exxal9", value: 389, type: "alcohol" },
  { name: "Glycerin", value: 1834, type: "alcohol" },
  { name: "Isononanol", value: 380, type: "alcohol" },
  { name: "Marlipal013", value: 279, type: "alcohol" },
  { name: "90%NPGSlurry", value: 967.5, type: "alcohol" },
  { name: "NPGFlake", value: 1075, type: "alcohol" },
  { name: "PE-MonoGrade", value: 1640, type: "alcohol" },
  { name: "PEG200", value: 563, type: "alcohol" },
  { name: "PEG300", value: 374, type: "alcohol" },
  { name: "PEG400", value: 280, type: "alcohol" },
  { name: "PEG600", value: 185, type: "alcohol" },
  { name: "Pentaerythritol-Tech", value: 1615, type: "alcohol" },
  { name: "PropyleneGlycol", value: 1475, type: "alcohol" },
  { name: "Sorbitol(70%)", value: 1294, type: "alcohol" },
  { name: "TMP", value: 1247, type: "alcohol" },
  { name: "TriethyleneGlycol", value: 747, type: "alcohol" },
  { name: "Oxocol900", value: 3387, type: "alcohol" },
  { name: "TergitolL61", value: 56, type: "alcohol" },
  { name: "Isofol20", value: 187, type: "alcohol" },
];


const SingleComponentExcessAddCalculatorPage: React.FC = () => {
  const [unitsToAdd, setUnitsToAdd] = useState<string>('');
  const [materialValue, setMaterialValue] = useState<string>(''); // AV or OH value as string
  const [percentageToAdd, setPercentageToAdd] = useState<number | null>(null);

  const [openCombobox, setOpenCombobox] = useState(false);
  const [comboboxInputValue, setComboboxInputValue] = useState(''); // Tracks text in CommandInput

  useEffect(() => {
    if (materialValue) {
      const material = materialsList.find(m => m.value.toString() === materialValue);
      // If the combobox input value is already the name of the found material, don't change it.
      // This prevents the input value from changing if user types a name that's also a value (e.g. "DEG")
      // or if they just selected it.
      // If it's not the material's name (e.g., it's just the numeric value, or a partial search) then update it.
      if (material && comboboxInputValue.toLowerCase() !== material.name.toLowerCase()) {
        setComboboxInputValue(material.name);
      } else if (!material && comboboxInputValue !== materialValue) {
        // If a custom value is set and it's not what's in the input box
        setComboboxInputValue(materialValue);
      }
    } else {
      setComboboxInputValue("");
    }
  }, [materialValue]); // Only run when materialValue changes


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
    const materialDisplayName = materialsList.find(m => m.value.toString() === materialValue)?.name || materialValue;
    return `Single Component Excess Add Calculation:
Units of Component to Add: ${unitsToAdd}
Material: ${materialDisplayName} (AV/OH: ${materialValue})
Percentage of Material to Add: ${percentageToAdd.toFixed(3)}%`;
  }, [unitsToAdd, materialValue, percentageToAdd]);

 const comboboxTriggerText = useMemo(() => {
    const knownMaterialByName = materialsList.find(m => m.name.toLowerCase() === comboboxInputValue.toLowerCase());
    if (knownMaterialByName) {
        // If the input value matches a material name, and that material's value is the current materialValue, show the name.
        if (knownMaterialByName.value.toString() === materialValue) {
            return knownMaterialByName.name;
        }
    }
    // If materialValue is set and corresponds to a known material (selected from list), show its name.
    const knownMaterialByValue = materialsList.find(m => m.value.toString() === materialValue);
    if (knownMaterialByValue) {
      return knownMaterialByValue.name;
    }
    // If materialValue is set but not in the list (custom number), show materialValue.
    if (materialValue) return materialValue;
    // If materialValue is not set, show placeholder.
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
                  const material = materialsList.find(m => m.name.toLowerCase() === value.toLowerCase());
                  const nameMatch = material?.name.toLowerCase().includes(search.toLowerCase());
                  const valueMatch = material?.value.toString().includes(search);
                  if (nameMatch || valueMatch) return 1;
                  // Allow searching by direct numeric input if not found in names
                  if (!isNaN(parseFloat(search)) && search.length > 0) return 1; 
                  return 0;
                }}
              >
                <CommandInput
                  placeholder="Search material or type value..."
                  value={comboboxInputValue}
                  onValueChange={(search) => {
                    setComboboxInputValue(search);
                    const num = parseFloat(search);
                    // Only set materialValue if it's a valid number
                    // Or if search is empty, clear materialValue
                    if (!isNaN(num) && isFinite(num)) {
                      setMaterialValue(search);
                    } else if (search === "") {
                      setMaterialValue("");
                    } else {
                      // If it's not a number and not empty, check if it matches a name
                      const matchedMaterial = materialsList.find(m => m.name.toLowerCase() === search.toLowerCase());
                      if (matchedMaterial) {
                        setMaterialValue(matchedMaterial.value.toString());
                      } else {
                        // Keep materialValue as is, or clear if no match from previous state is intended
                        // For now, we allow comboboxInputValue to be free text until a selection or valid number
                      }
                    }
                  }}
                />
                <CommandList>
                  <CommandEmpty>No material found. Type custom numeric value.</CommandEmpty>
                  <CommandGroup>
                    {materialsList.map((material) => (
                      <CommandItem
                        key={material.name}
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
                             materialValue === material.value.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {material.name} ({material.value})
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
    
