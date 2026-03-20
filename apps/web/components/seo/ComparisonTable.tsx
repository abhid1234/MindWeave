import { Check, X } from 'lucide-react';

export interface ComparisonTableProps {
  competitor: string;
  features: Array<{
    name: string;
    mindweave: boolean;
    competitor: boolean;
  }>;
}

export function ComparisonTable({ competitor, features }: ComparisonTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold">Feature</th>
            <th className="px-4 py-3 text-left font-semibold">Mindweave</th>
            <th className="px-4 py-3 text-left font-semibold">{competitor}</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <tr key={feature.name} className="even:bg-muted/30">
              <td className="px-4 py-3">{feature.name}</td>
              <td className="px-4 py-3">
                {feature.mindweave ? (
                  <Check className="h-5 w-5 text-green-500" aria-label="Supported" />
                ) : (
                  <X className="text-muted-foreground h-5 w-5" aria-label="Not supported" />
                )}
              </td>
              <td className="px-4 py-3">
                {feature.competitor ? (
                  <Check className="h-5 w-5 text-green-500" aria-label="Supported" />
                ) : (
                  <X className="text-muted-foreground h-5 w-5" aria-label="Not supported" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
