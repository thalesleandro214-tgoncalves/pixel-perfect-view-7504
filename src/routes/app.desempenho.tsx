import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, SectionTitle } from "@/components/portal/bits";
import { ProdLineChart, ValueAreaChart } from "@/components/portal/charts";
import { MonthPicker } from "@/components/portal/MonthPicker";
import { brl, currentMonth, dm, num } from "@/lib/format";
import { useMyMonth } from "@/lib/use-my-month";

export const Route = createFileRoute("/app/desempenho")({ component: Desempenho });

function Desempenho() {
  const [ym, setYm] = useState(currentMonth());
  const { rows, sum, loading } = useMyMonth(ym);
  const accData = rows.map((r) => ({ d: dm(r.data), v: Number(r.acumulado_periodo) }));
  const dayData = rows.map((r) => ({ d: dm(r.data), v: Number(r.pagamento_diario) }));

  const stats: [string, string][] = [
    ["Dias registrados", String(sum.dias)],
    ["Total de caixas", num(sum.caixas)],
    ["Total de paletes", num(sum.paletes)],
    ["Maior CX/H", `${sum.max} cx/h`],
    ["Menor CX/H", `${sum.min} cx/h`],
    ["Acumulado no período", brl(sum.acumulado)],
    ["Média oficial do período", `${sum.mediaOficial.toFixed(1)} cx/h`],
  ];

  return (
    <>
      <div className="flex items-center justify-between pt-5">
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">Meu desempenho no mês</h1>
        <MonthPicker value={ym} onChange={setYm} />
      </div>
      {loading ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(([k, v], i) => (
              <Panel key={k} delay={i * 40}>
                <div className="label-mono">{k}</div>
                <div className="mt-1 text-xl font-semibold tracking-tight">{v}</div>
              </Panel>
            ))}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <SectionTitle>CX/H · por dia</SectionTitle>
              <Panel>{rows.length ? <ProdLineChart rows={rows} /> : <p className="py-8 text-center text-sm text-muted-foreground">Sem registros.</p>}</Panel>
            </div>
            <div>
              <SectionTitle>Gratificação · por dia</SectionTitle>
              <Panel><ValueAreaChart data={dayData} /></Panel>
            </div>
          </div>
          <SectionTitle>Acumulado no período (oficial)</SectionTitle>
          <Panel><ValueAreaChart data={accData} height={160} /></Panel>
        </>
      )}
    </>
  );
}
