import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Panel, SectionTitle, StatusPill } from "@/components/portal/bits";
import { ProdLineChart, ValueAreaChart } from "@/components/portal/charts";
import { MonthPicker } from "@/components/portal/MonthPicker";
import { goalStatus } from "@/lib/data";
import { brl, currentMonth, dm, num } from "@/lib/format";
import { useMyMonth } from "@/lib/use-my-month";

export const Route = createFileRoute("/app/desempenho")({ component: Desempenho });

function Desempenho() {
  const [ym, setYm] = useState(currentMonth());
  const { cfg, rows, sum, loading } = useMyMonth(ym);
  const meta = Number(cfg?.meta_caixas_hora ?? 0);
  let acc = 0;
  const accData = rows.map((r) => ({ d: dm(r.data), v: (acc += Number(r.valor_gerado)) }));
  const dayData = rows.map((r) => ({ d: dm(r.data), v: Number(r.valor_gerado) }));

  const stats: [string, string][] = [
    ["Dias trabalhados", String(sum.dias)],
    ["Total de caixas", num(sum.caixas)],
    ["Média cx/hora", sum.cxh.toFixed(1)],
    ["Maior produtividade", `${sum.max} cx/h`],
    ["Menor produtividade", `${sum.min} cx/h`],
    ["Total acumulado", brl(sum.valor)],
    ["Média diária", brl(sum.mediaDiaria)],
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
          <Panel className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="label-mono">Média do mês vs meta</div>
              <div className="num-display mt-1 text-5xl">{sum.cxh.toFixed(1)} <span className="font-mono text-sm text-foreground/45">/ {meta} cx/h</span></div>
            </div>
            {sum.dias > 0 && <StatusPill status={goalStatus(sum.cxh, cfg)} />}
          </Panel>

          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map(([k, v], i) => (
              <Panel key={k} delay={i * 40}>
                <div className="label-mono">{k}</div>
                <div className="mt-1 text-xl font-semibold tracking-tight">{v}</div>
              </Panel>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <SectionTitle>Caixas por hora · por dia</SectionTitle>
              <Panel>{rows.length ? <ProdLineChart rows={rows} meta={meta} /> : <p className="py-8 text-center text-sm text-muted-foreground">Sem registros.</p>}</Panel>
            </div>
            <div>
              <SectionTitle>Valor gerado · por dia</SectionTitle>
              <Panel><ValueAreaChart data={dayData} /></Panel>
            </div>
          </div>
          <SectionTitle>Evolução do acumulado</SectionTitle>
          <Panel><ValueAreaChart data={accData} height={160} /></Panel>
        </>
      )}
    </>
  );
}
