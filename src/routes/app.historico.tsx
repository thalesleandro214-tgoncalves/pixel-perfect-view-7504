import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Empty } from "@/components/portal/bits";
import { MonthPicker } from "@/components/portal/MonthPicker";
import { brl, currentMonth, dmy, num } from "@/lib/format";
import { useMyMonth } from "@/lib/use-my-month";

export const Route = createFileRoute("/app/historico")({ component: Historico });

function Historico() {
  const [ym, setYm] = useState(currentMonth());
  const { rows, loading } = useMyMonth(ym);
  const list = [...rows].reverse();

  return (
    <>
      <div className="flex items-center justify-between pt-5">
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">Histórico diário</h1>
        <MonthPicker value={ym} onChange={setYm} />
      </div>
      <div className="mt-4">
        {loading ? null : !list.length ? (
          <Empty>Nenhum registro neste mês.</Empty>
        ) : (
          <>
            <div className="space-y-2.5 md:hidden">
              {list.map((r) => (
                <div key={r.id} className="glass p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{dmy(r.data)}</div>
                    <div className="num-display text-2xl">{Number(r.caixas_por_hora)} <span className="font-mono text-[10px]">cx/h</span></div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] text-foreground/60">
                    <span>{r.duracao_operacao} de operação</span>
                    <span>{num(r.caixas_produzidas)} cx · {num(Number(r.paletes_total))} pal.</span>
                    <span>Dia: <b className="text-foreground">{brl(Number(r.pagamento_diario))}</b></span>
                    <span>Acum.: <b className="text-foreground">{brl(Number(r.acumulado_periodo))}</b></span>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    {["Data", "Operação", "Caixas", "Paletes", "CX/H", "Gratificação", "Acumulado"].map((h) => (
                      <th key={h} className="label-mono px-4 py-3 font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{dmy(r.data)}</td>
                      <td className="px-4 py-3 font-mono">{r.duracao_operacao}</td>
                      <td className="px-4 py-3 font-mono">{num(r.caixas_produzidas)}</td>
                      <td className="px-4 py-3 font-mono">{num(Number(r.paletes_total))}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{Number(r.caixas_por_hora)}</td>
                      <td className="px-4 py-3 font-mono">{brl(Number(r.pagamento_diario))}</td>
                      <td className="px-4 py-3 font-mono">{brl(Number(r.acumulado_periodo))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
