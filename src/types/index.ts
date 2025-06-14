export interface CalculatorMeta {
  slug: string;
  name: string;
  description: string;
  icon?: React.ElementType; // Lucide icon component
}

export interface Component {
  id: string; // for unique key in lists
  name: string;
  weight: number;
}

export interface SavedBatch {
  id: string; // unique id for the saved batch
  name: string; // user-defined name for the batch
  originalTotalBatchWeight: number;
  components: Omit<Component, 'id'>[]; // Store components without runtime id
  createdAt: string; // ISO date string
}
