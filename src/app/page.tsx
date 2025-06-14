import CalculatorCard from '@/components/CalculatorCard';
import type { CalculatorMeta } from '@/types';
import { Beaker, Percent, FlaskConical, Thermometer, Contrast, Sigma, Weight, Scaling, Pipette } from 'lucide-react';

const calculators: CalculatorMeta[] = [
  { slug: 'acid-value', name: 'Acid Value Calculator', description: 'Calculate Acid Value from titration data.', icon: Beaker },
  { slug: 'hydroxyl-value', name: 'Hydroxyl (OH) Value Calculator', description: 'Determine Hydroxyl Value.', icon: Thermometer },
  { slug: 'saponification-value', name: 'Saponification (Sap) Value', description: 'Calculate Saponification Value.', icon: FlaskConical },
  { slug: 'iodine-value', name: 'Iodine Value Calculator', description: 'Determine Iodine Value of a substance.', icon: Contrast },
  { slug: 'anionic-content-adjustment', name: 'Anionic Content Adjustment', description: 'Adjust anionic content to desired percentage.', icon: Pipette },
  { slug: 'standard-dilution', name: 'Standard Dilution (M1V1=M2V2)', description: 'Calculate volumes for dilutions.', icon: Scaling },
  { slug: 'percentage', name: 'Percentage Calculator', description: 'Perform various percentage calculations.', icon: Percent },
  { slug: 'caustic-trial', name: 'Caustic Trial Calculator', description: 'Calculate caustic amounts for trial solutions.', icon: Sigma },
  { slug: 'batch-caustic-add', name: 'Batch Caustic Add Calculator', description: 'Determine caustic needed for batch adjustments.', icon: Weight },
  { slug: 'short-batch-adjustment', name: 'Short Batch Adjustment', description: 'Proportionally adjust batch components.', icon: Scaling },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center animate-slideUp">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl font-headline">
          Welcome to ChemCalc Pro
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:mt-5 sm:text-lg md:text-xl">
          Your everyday toolkit for chemical calculations. Select a calculator below to get started.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {calculators.map((calc) => (
          <CalculatorCard key={calc.slug} calculator={calc} />
        ))}
      </section>
    </div>
  );
}
