import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CalculatorMeta } from '@/types';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatorCardProps {
  calculator: CalculatorMeta;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ calculator }) => {
  const IconComponent = calculator.icon;

  return (
    <Link href={`/${calculator.slug}`} className="group block" aria-label={`Open ${calculator.name} calculator`}>
      <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 animate-fadeIn">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            {IconComponent && <IconComponent className={cn(
              "h-8 w-8 text-primary transition-transform duration-300 ease-in-out",
              "group-hover:scale-110 group-hover:rotate-3",
              "animate-idle-wiggle"
            )} />}
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold">{calculator.name}</CardTitle>
          <CardDescription className="text-sm">{calculator.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default CalculatorCard;
