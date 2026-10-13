import type { CalculatorMeta } from '@/types';

export const CATEGORIES = [
  'All',
  'Titration & Analysis',
  'Batch Adjustments',
  'Trials & Formulations',
  'General Math',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CALCULATORS: CalculatorMeta[] = [
  // Titration & Analytical
  {
    slug: 'acid-value',
    name: 'Acid Value Calculator',
    description: 'Calculate Acid Value (AV) from titration volume and sample weight.',
    icon: 'Beaker',
    category: 'Titration & Analysis',
    formulaBadge: '(mL * 5.611) / Wt',
  },
  {
    slug: 'hydroxyl-value',
    name: 'Hydroxyl (OH) Value Calculator',
    description: 'Determine Hydroxyl Value from titrant volumes, normality, and sample weight.',
    icon: 'Thermometer',
    category: 'Titration & Analysis',
    formulaBadge: '[(B - S) * N * 56.1] / W + AV',
  },
  {
    slug: 'saponification-value',
    name: 'Saponification (Sap) Value',
    description: 'Calculate Saponification Value from blank and sample titration volumes.',
    icon: 'FlaskConical',
    category: 'Titration & Analysis',
    formulaBadge: '[(B - S) * N * 56.1] / Wt',
  },
  {
    slug: 'iodine-value',
    name: 'Iodine Value Calculator',
    description: 'Determine Iodine Value of an unsaturated sample via thiosulfate titration.',
    icon: 'Contrast',
    category: 'Titration & Analysis',
    formulaBadge: '[(B - S) * N * 12.69] / Wt',
  },

  // Batch Adjustments
  {
    slug: 'single-component-excess-add',
    name: 'Single Component Excess Add',
    description: 'Calculate % of a single material to add based on target AV or OH.',
    icon: 'FilePlus',
    category: 'Batch Adjustments',
    formulaBadge: '% Add via AV/OH',
  },
  {
    slug: 'multiple-components-excess-add',
    name: 'Multiple Components Calculator',
    description: 'Define components, calculate excess additions, and scale full batch weights.',
    icon: 'Layers',
    category: 'Batch Adjustments',
    formulaBadge: 'Multi-material scaling',
  },
  {
    slug: 'short-batch-adjustment',
    name: 'Short Batch Adjustment',
    description: 'Proportionally scale down all batch components when a limiting material falls short.',
    icon: 'Scaling',
    category: 'Batch Adjustments',
    formulaBadge: 'Proportional batch scaling',
  },
  {
    slug: 'anionic-content-adjustment',
    name: 'Anionic Content Adjustment',
    description: 'Adjust active anionic surfactant content to target percentage using diluent.',
    icon: 'Pipette',
    category: 'Batch Adjustments',
    formulaBadge: 'Active % adjustment',
  },

  // Trials & Formulations
  {
    slug: 'caustic-trial',
    name: 'Caustic Trial Calculator',
    description: 'Calculate caustic soda (NaOH / KOH) amounts for trial solutions and batch scale-up.',
    icon: 'Sigma',
    category: 'Trials & Formulations',
    formulaBadge: 'Trial NaOH / KOH add',
  },
  {
    slug: 'soda-ash-trials',
    name: 'Soda Ash Trials Calculator',
    description: 'Calculate soda ash additions for trials with automatic minimum add thresholds.',
    icon: 'TestTube2',
    category: 'Trials & Formulations',
    formulaBadge: 'Soda ash with min rule',
  },
  {
    slug: 'standard-dilution',
    name: 'Standard Dilution (M1V1 = M2V2)',
    description: 'Calculate stock and solvent volumes for standard concentration dilutions.',
    icon: 'Scaling',
    category: 'Trials & Formulations',
    formulaBadge: 'M1V1 = M2V2',
  },

  // General Math
  {
    slug: 'percentage',
    name: 'Percentage Calculator',
    description: 'Perform quick laboratory percentage calculations, yields, and concentrations.',
    icon: 'Percent',
    category: 'General Math',
    formulaBadge: '% of Total / % Change',
  },
];
