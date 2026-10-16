import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, children, delay = 0 }: { className?: string; children: ReactNode; delay?: number }) {
  return (
    <div className={cn("glass rise p-4", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, delay }: { label: string; value: ReactNode; sub?: ReactNode; delay?: number }) {
  return (
    <Panel delay={delay}>
      <div className="label-mono">{label}</div>
      <div className="num-display mt-1.5 text-[34px] sm:text-[40px]">{value}</div>
      {sub && <div className="mt-1 font-mono text-[10px] text-foreground/45">{sub}</div>}
    </Panel>
  );
}

const statusMap: Record<Status, { label: string; cls: string; icon: string }> = {
  acima: { label: "acima da meta", cls: "bg-good/10 text-good ring-good/25", icon: "▲" },
  dentro: { label: "dentro da meta", cls: "bg-warn/15 text-foreground ring-warn/40", icon: "●" },
  abaixo: { label: "abaixo da meta", cls: "bg-bad/10 text-bad ring-bad/25", icon: "▼" },
};

export function StatusPill({ status }: { status: Status }) {
  const s = statusMap[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 font-mono text-[10px] font-medium uppercase tracking-[0.15em]", s.cls)}>
      {s.icon} {s.label}
    </span>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between">
      <div className="label-mono text-foreground/60">{children}</div>
      {right}
    </div>
  );
}

export function Money({ v }: { v: number }) {
  const [int, dec] = v.toFixed(2).split(".");
  return (
    <>
      R${Number(int).toLocaleString("pt-BR")}
      <span className="align-top text-[0.55em]">,{dec}</span>
    </>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="glass p-6 text-center text-sm text-muted-foreground">{children}</div>;
}
