
export interface CalculatorMeta {
  slug: string;
  name: string;
  description: string;
  icon?: React.ElementType; // Lucide icon component
}

// For use in the Short Batch Adjustment calculator results
export interface AdjustedComponent {
  id: string;
  name: string;
  weight: number; // Adjusted weight
  percentage: number; // Percentage in the adjusted batch
}

// For storing components in a saved batch configuration
export interface SavedBatchComponent {
  name: string;
  weight: number; // Original weight
}

export interface SavedBatch {
  id: string; // unique id for the saved batch
  name: string; // user-defined name for the batch
  originalTotalBatchWeight: number;
  components: SavedBatchComponent[]; // Use the refined type
  createdAt: string; // ISO date string
}
