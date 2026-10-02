import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel } from "@/components/portal/bits";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { rankBy, useColabs, useProdRange } from "@/lib/admin-data";
import { brl, isoDate, num, todayIso } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/ranking")({ component: Ranking });

function range(p: string): [string, string] {
  const t = new Date();
  if (p === "dia") return [todayIso(), todayIso()];
  if (p === "semana") {
    const s = new Date(t);
    s.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    return [isoDate(s), todayIso()];
  }
  return [isoDate(new Date(t.getFullYear(), t.getMonth(), 1)), todayIso()];
}

function Ranking() {
  const [p, setP] = useState("mes");
  const [a, b] = range(p);
  const colabs = useColabs().data ?? [];
  const rows = useProdRange(a, b).data ?? [];
  const rk = rankBy(rows, colabs.filter((c) => c.status === "ativo"));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-5">
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">Ranking · caixas por hora</h1>
        <ToggleGroup type="single" value={p} onValueChange={(v) => v && setP(v)} className="rounded-full bg-card p-1">
          {[["dia", "Dia"], ["semana", "Semana"], ["mes", "Mês"]].map(([v, l]) => (
            <ToggleGroupItem key={v} value={v} className="rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{l}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="mt-4 space-y-2.5">
        {!rk.length && <Panel className="text-center text-sm text-muted-foreground">Sem registros no período.</Panel>}
        {rk.map((r, i) => (
          <Panel key={r.colab.id} delay={i * 30} className="flex items-center gap-4">
            <span className={cn("num-display w-12 text-[34px]", i === 0 ? "text-primary" : i < 3 ? "text-primary-deep" : "text-foreground/40")}>#{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{r.colab.nome}</div>
              <div className="font-mono text-[10px] text-foreground/50">{r.colab.equipe} · {num(r.caixas)} caixas · {brl(r.valor)}</div>
            </div>
            <div className="text-right">
              <div className="num-display text-3xl">{r.cxh.toFixed(1)}</div>
              <div className="label-mono">cx/h</div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
