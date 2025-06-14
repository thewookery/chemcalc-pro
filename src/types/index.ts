
export interface CalculatorMeta {
  slug: string;
  name: string;
  description: string;
  icon?: React.ElementType; // Lucide icon component
}

// For use in the Short Batch Adjustment calculator results
export interface AdjustedComponent {
  id: string; // Or index
  name: string;
  originalCalculatedWeight: number; // The original weight calculated from percentage
  newScaledWeight: number; // Adjusted weight
  percentage: number; // Percentage in the batch (should match input)
}

// For storing components in a saved batch configuration
export interface SavedBatchComponent {
  name: string;
  percentage: number; // User-defined target percentage
}

export interface SavedBatch {
  id: string; // unique id for the saved batch
  name: string; // user-defined name for the batch
  originalTotalBatchWeight: number;
  components: SavedBatchComponent[];
  createdAt: string; // ISO date string
}
