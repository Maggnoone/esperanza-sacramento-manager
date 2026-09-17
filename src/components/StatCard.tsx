import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  format?: (value: number) => string;
  icon: LucideIcon;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, format, icon: Icon, hint, className }: StatCardProps) {
  return (
    <Card className={cn("shadow-soft transition hover:shadow-elegant", className)}>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-5">
            <Icon aria-hidden="true" />
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="mt-4">
          <CountUp value={value} format={format} className="font-display text-3xl font-semibold" />
        </div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </Card>
  );
}
