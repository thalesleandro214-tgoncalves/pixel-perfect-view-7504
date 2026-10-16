import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel } from "@/components/portal/bits";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { rankBy, useColabs, useProdRange } from "@/lib/admin-data";
import { brl, dm, num } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/ranking")({ component: Ranking });

function Ranking() {
  const [by, setBy] = useState<"cxh" | "acumulado">("cxh");
  const [a, setA] = useState("2026-09-01");
  const [b, setB] = useState("2026-09-30");
  const colabs = useColabs().data ?? [];
  const rows = useProdRange(a, b).data ?? [];
  const rk = rankBy(rows, colabs.filter((c) => c.status === "ativo"), by);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-5">
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">Ranking · {by === "cxh" ? "CX/H" : "gratificação acumulada"}</h1>
        <ToggleGroup type="single" value={by} onValueChange={(v) => v && setBy(v as typeof by)} className="rounded-full bg-card p-1">
          {[["cxh", "CX/H"], ["acumulado", "Gratificação"]].map(([v, l]) => (
            <ToggleGroupItem key={v} value={v} className="rounded-full px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{l}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <Panel className="mt-3 grid grid-cols-2 gap-2">
        <Input type="date" value={a} onChange={(e) => setA(e.target.value)} />
        <Input type="date" value={b} onChange={(e) => setB(e.target.value)} />
      </Panel>
      <p className="mt-2 font-mono text-[10px] text-foreground/50">
        {by === "cxh" ? "CX/H do período = caixas ÷ horas de operação nos dias filtrados." : "Valor oficial de ACUMULADO NO PERÍODO na última data registrada dentro do filtro (sem somar acumulados)."}
      </p>
      <div className="mt-3 space-y-2.5">
        {!rk.length && <Panel className="text-center text-sm text-muted-foreground">Sem registros no período.</Panel>}
        {rk.map((r, i) => (
          <Panel key={r.colab.id} delay={Math.min(i, 20) * 20} className="flex items-center gap-4">
            <span className={cn("num-display w-12 text-[34px]", i === 0 ? "text-primary" : i < 3 ? "text-primary-deep" : "text-foreground/40")}>#{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{r.colab.nome}</div>
              <div className="font-mono text-[10px] text-foreground/50">{r.colab.unidade} · {r.dias} dias · {num(r.caixas)} caixas · {num(r.paletes)} paletes</div>
            </div>
            <div className="text-right">
              {by === "cxh" ? (
                <><div className="num-display text-3xl">{r.cxh.toFixed(1)}</div><div className="label-mono">cx/h</div></>
              ) : (
                <><div className="num-display text-2xl">{brl(r.acumulado)}</div><div className="label-mono">até {dm(r.ultima)}</div></>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
