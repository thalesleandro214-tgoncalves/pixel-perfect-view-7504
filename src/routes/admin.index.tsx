import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { Panel, SectionTitle, StatCard } from "@/components/portal/bits";
import { ValueAreaChart } from "@/components/portal/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCsv, rankBy, useColabs, useProdRange } from "@/lib/admin-data";
import { summarize } from "@/lib/data";
import { brl, dm, dmy, num } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

const axis = { fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--muted-foreground)" };

function AdminHome() {
  const [from, setFrom] = useState("2026-09-01");
  const [to, setTo] = useState("2026-09-30");
  const [unidade, setUnidade] = useState("all");
  const [colab, setColab] = useState("all");
  const colabs = useColabs().data ?? [];
  const prod = useProdRange(from, to).data ?? [];

  const unidades = [...new Set(colabs.map((c) => c.unidade).filter(Boolean))] as string[];
  const filteredColabs = colabs.filter((c) => (unidade === "all" || c.unidade === unidade) && (colab === "all" || c.id === colab));
  const ids = new Set(filteredColabs.map((c) => c.id));
  const rows = prod.filter((r) => ids.has(r.colaborador_id));
  const sum = summarize(rows);
  const ranking = rankBy(rows, colabs);
  const acumuladoTotal = ranking.reduce((s, r) => s + r.acumulado, 0);

  const byDay = useMemo(() => {
    const m = new Map<string, { c: number; min: number; v: number }>();
    for (const r of rows) {
      const e = m.get(r.data) ?? { c: 0, min: 0, v: 0 };
      e.c += r.caixas_produzidas;
      e.min += Number(r.minutos);
      e.v += Number(r.pagamento_diario);
      m.set(r.data, e);
    }
    return [...m.entries()].sort().map(([d, e]) => ({ d: dm(d), cxh: e.min ? +(e.c / (e.min / 60)).toFixed(1) : 0, v: e.v }));
  }, [rows]);

  const exportar = () =>
    downloadCsv(
      `produtividade_${from}_${to}.csv`,
      ["Data", "Nome", "Unidade", "Caixas", "Paletes", "Duração", "CX/H", "Pagamento diário", "Acumulado no período", "CX/HH média do período"],
      rows.map((r) => {
        const c = colabs.find((x) => x.id === r.colaborador_id)!;
        const br = (v: unknown) => Number(v).toFixed(2).replace(".", ",");
        return [dmy(r.data), c.nome, r.unidade ?? "", r.caixas_produzidas, Number(r.paletes_total), r.duracao_operacao ?? "", br(r.caixas_por_hora), br(r.pagamento_diario), br(r.acumulado_periodo), br(r.cxh_media_periodo)];
      }),
    );

  return (
    <>
      <h1 className="pt-5 text-xl font-semibold tracking-tight lg:text-2xl">Painel da equipe</h1>

      <Panel className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Select value={unidade} onValueChange={setUnidade}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {unidades.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={colab} onValueChange={setColab}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os colaboradores</SelectItem>
            {colabs.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportar} className="col-span-2 lg:col-span-1"><Download className="size-4" /> Exportar CSV</Button>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Colaboradores no período" value={ranking.length} />
        <StatCard label="CX/H do período" value={sum.cxh.toFixed(1)} sub="caixas ÷ horas de operação" />
        <StatCard label="Total de caixas" value={num(sum.caixas)} />
        <StatCard label="Total de paletes" value={num(sum.paletes)} />
        <StatCard label="Pagamentos diários" value={brl(sum.pagamentos)} sub="soma no período" />
        <StatCard label="Acumulado oficial" value={brl(acumuladoTotal)} sub="último acumulado de cada um" />
        <StatCard label="Dias-registro" value={num(sum.dias)} />
        <StatCard label="Horas de operação" value={num(sum.horas)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <SectionTitle>CX/H da equipe por dia</SectionTitle>
          <Panel>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDay} margin={{ left: -24, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" tick={axis} tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis tick={axis} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [`${v} cx/h`, "CX/H"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="cxh" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div>
          <SectionTitle>Pagamentos diários por dia</SectionTitle>
          <Panel><ValueAreaChart data={byDay} height={200} /></Panel>
        </div>
      </div>
      <SectionTitle>Comparativo CX/H entre colaboradores</SectionTitle>
      <Panel>
        <ResponsiveContainer width="100%" height={Math.max(200, ranking.length * 24)}>
          <BarChart data={ranking.map((r) => ({ n: r.colab.nome.split(" ").slice(0, 2).join(" "), v: +r.cxh.toFixed(1) }))} layout="vertical" margin={{ left: 0, right: 16 }}>
            <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="n" tick={{ ...axis, fontSize: 10 }} width={120} interval={0} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: number) => [`${v} cx/h`, "CX/H"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="v" fill="var(--primary)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </>
  );
}
