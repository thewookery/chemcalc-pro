
export interface CalculatorMeta {
  slug: string;
  name: string;
  description: string;
  icon?: string;
  category: 'Titration & Analysis' | 'Batch Adjustments' | 'Trials & Formulations' | 'General Math';
  formulaBadge?: string;
}

// For use in the Short Batch Adjustment calculator results
export interface AdjustedComponent {
  name: string;
  standardPercentage: number; // The standard % from the batch ticket
  newRequiredWeight: number;   // The calculated weight for the adjusted batch
}

// For storing components in a saved batch configuration (Short Batch Adj & Multi-Comp)
export interface SavedBatchComponent {
  name: string;
  standardPercentage: number; // Standard percentage on the batch ticket
  avOrOhValue?: number; // Optional AV/OH value, for Part 2 of Multi-Comp calc
}

export interface SavedBatch {
  id: string; // unique id for the saved batch
  name: string; // user-defined name for the batch
  originalStandardTotalBatchWeight: number; // The total weight of a full, standard batch (relevant for Short Batch Adj)
  components: SavedBatchComponent[]; // List of components
  createdAt: string; // ISO date string
}

// For Multiple Components Excess Add Calculator - Part 1 Inputs
export interface BatchTicketComponentInput {
  name: string;
  percentageFromTicket: string; // User input as string, will be parsed to number
  avOrOhValue: string; // User input for AV/OH for Part 2 calculation
}

// For Multiple Components Excess Add Calculator - Part 1 Results
export interface CalculatedExcessComponent {
  name: string;
  percentageFromTicket: number; // Parsed original percentage
  standardizedPercentage: number; // Calculated standardized percentage
  unitsToAdd: number; // Calculated units of this component to add for excess
  avOrOhValue: number; // Parsed AV/OH value for this component
}

// For Multiple Components Excess Add Calculator - Part 2 Results
export interface Part2CalculatedValueComponent {
  name: string;
  excessUnits: number; // from Part 1
  avOrOhValue: number; // from input
  percentageOfAdd: number; // (Excess Units / AV_OH) * 100
  unitsForBatchWeight: number; // (percentageOfAdd / 100) * part2BatchWeight (will be NaN if not calculable)
}

