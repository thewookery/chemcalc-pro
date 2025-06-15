
export interface CalculatorMeta {
  slug: string;
  name: string;
  description: string;
  icon?: React.ElementType; // Lucide icon component
}

// For use in the Short Batch Adjustment calculator results
export interface AdjustedComponent {
  name: string;
  standardPercentage: number; // The standard % from the batch ticket
  newRequiredWeight: number;   // The calculated weight for the adjusted batch
}

// For storing components in a saved batch configuration (Short Batch Adj)
export interface SavedBatchComponent {
  name: string;
  standardPercentage: number; // Standard percentage on the batch ticket
}

export interface SavedBatch {
  id: string; // unique id for the saved batch
  name: string; // user-defined name for the batch
  originalStandardTotalBatchWeight: number; // The total weight of a full, standard batch
  components: SavedBatchComponent[]; // List of components with their standard percentages
  createdAt: string; // ISO date string
}

// For Multiple Components Excess Add Calculator
export interface BatchTicketComponentInput {
  name: string;
  percentageFromTicket: string; // User input as string, will be parsed to number
}

export interface CalculatedExcessComponent {
  name: string;
  percentageFromTicket: number; // Parsed original percentage
  standardizedPercentage: number; // Calculated standardized percentage
  unitsToAdd: number; // Calculated units of this component to add
}
