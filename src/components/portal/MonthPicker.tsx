import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { monthLabel, recentMonths } from "@/lib/format";

export function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-auto gap-2 rounded-full bg-card font-mono text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {recentMonths(6).map((m) => (
          <SelectItem key={m} value={m}>{monthLabel(m)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
