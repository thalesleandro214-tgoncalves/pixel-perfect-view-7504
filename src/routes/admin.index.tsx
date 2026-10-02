import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { DemoBadge, Panel, SectionTitle, StatCard } from "@/components/portal/bits";
import { ValueAreaChart } from "@/components/portal/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadCsv, rankBy, useColabs, useProdRange } from "@/lib/admin-data";
import { goalStatus, summarize, useConfig } from "@/lib/data";
import { brl, currentMonth, dm, dmy, monthRange, num } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

const axis = { fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--muted-foreground)" };

function AdminHome() {
  const [def0, def1] = monthRange(currentMonth());
  const [from, setFrom] = useState(def0);
  const [to, setTo] = useState(def1);
  const [equipe, setEquipe] = useState("all");
  const [colab, setColab] = useState("all");
  const colabs = useColabs().data ?? [];
  const cfg = useConfig().data;
  const prod = useProdRange(from, to).data ?? [];
  const meta = Number(cfg?.meta_caixas_hora ?? 0);

  const equipes = [...new Set(colabs.map((c) => c.equipe))];
  const filteredColabs = colabs.filter((c) => (equipe === "all" || c.equipe === equipe) && (colab === "all" || c.id === colab));
  const ids = new Set(filteredColabs.map((c) => c.id));
  const rows = prod.filter((r) => ids.has(r.colaborador_id));
  const sum = summarize(rows);
  const ranking = rankBy(rows, colabs);
  const acima = ranking.filter((r) => goalStatus(r.cxh, cfg) !== "abaixo").length;
  const abaixo = ranking.length - acima;

  const byDay = useMemo(() => {
    const m = new Map<string, { c: number; h: number; v: number }>();
    for (const r of rows) {
      const e = m.get(r.data) ?? { c: 0, h: 0, v: 0 };
      e.c += r.caixas_produzidas;
      e.h += Number(r.horas_trabalhadas);
      e.v += Number(r.valor_gerado);
      m.set(r.data, e);
    }
    return [...m.entries()].sort().map(([d, e]) => ({ d: dm(d), cxh: +(e.c / e.h).toFixed(1), v: e.v }));
  }, [rows]);

  const exportar = () =>
    downloadCsv(
      `produtividade_${from}_${to}.csv`,
      ["Data", "CPF", "Nome", "Equipe", "Horas Trabalhadas", "Caixas Produzidas", "Caixas/Hora", "Valor"],
      rows.map((r) => {
        const c = colabs.find((x) => x.id === r.colaborador_id)!;
        return [dmy(r.data), c.cpf, c.nome, c.equipe, r.horas_trabalhadas, r.caixas_produzidas, r.caixas_por_hora, Number(r.valor_gerado).toFixed(2).replace(".", ",")];
      }),
    );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-5">
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">Painel da equipe</h1>
        <DemoBadge />
      </div>

      <Panel className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Select value={equipe} onValueChange={setEquipe}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as equipes</SelectItem>
            {equipes.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={colab} onValueChange={setColab}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os auxiliares</SelectItem>
            {colabs.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportar} className="col-span-2 lg:col-span-1"><Download className="size-4" /> Exportar CSV</Button>
      </Panel>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Auxiliares ativos" value={colabs.filter((c) => c.status === "ativo").length} />
        <StatCard label="Média cx/hora" value={sum.cxh.toFixed(1)} sub={`meta ${meta}`} />
        <StatCard label="Total de caixas" value={num(sum.caixas)} />
        <StatCard label="Valor total" value={brl(sum.valor)} />
        <StatCard label="Na meta ou acima" value={<span className="text-good">{acima}</span>} sub="auxiliares" />
        <StatCard label="Abaixo da meta" value={<span className="text-bad">{abaixo}</span>} sub="auxiliares" />
        <StatCard label="Dias-registro" value={num(sum.dias)} />
        <StatCard label="Horas trabalhadas" value={num(sum.horas)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div>
          <SectionTitle>Produtividade média por dia</SectionTitle>
          <Panel>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDay} margin={{ left: -24, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" tick={axis} tickLine={false} axisLine={false} minTickGap={12} />
                <YAxis tick={axis} tickLine={false} axisLine={false} domain={["dataMin - 10", "dataMax + 5"]} />
                <ReferenceLine y={meta} stroke="var(--foreground)" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Tooltip formatter={(v: number) => [`${v} cx/h`, "Média"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="cxh" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div>
          <SectionTitle>Valor gerado por dia</SectionTitle>
          <Panel><ValueAreaChart data={byDay} height={200} /></Panel>
        </div>
        <div>
          <SectionTitle>Comparativo entre auxiliares</SectionTitle>
          <Panel>
            <ResponsiveContainer width="100%" height={Math.max(200, ranking.length * 28)}>
              <BarChart data={ranking.map((r) => ({ n: r.colab.nome.split(" ")[0], v: +r.cxh.toFixed(1), s: goalStatus(r.cxh, cfg) }))} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={axis} tickLine={false} axisLine={false} domain={[0, "dataMax + 10"]} />
                <YAxis type="category" dataKey="n" tick={{ ...axis, fontSize: 11 }} width={70} tickLine={false} axisLine={false} />
                <ReferenceLine x={meta} stroke="var(--foreground)" strokeDasharray="4 4" strokeOpacity={0.4} />
                <Tooltip formatter={(v: number) => [`${v} cx/h`, "Média"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                  {ranking.map((r) => (
                    <Cell key={r.colab.id} fill={goalStatus(r.cxh, cfg) === "abaixo" ? "var(--chart-5)" : "var(--primary)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
        <div>
          <SectionTitle>Distribuição vs meta</SectionTitle>
          <Panel className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={[{ n: "Na meta/acima", v: acima }, { n: "Abaixo", v: abaixo }]} dataKey="v" nameKey="n" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  <Cell fill="var(--good)" />
                  <Cell fill="var(--bad)" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <div><div className="label-mono">Na meta ou acima</div><div className="num-display text-4xl text-good">{acima}</div></div>
              <div><div className="label-mono">Abaixo</div><div className="num-display text-4xl text-bad">{abaixo}</div></div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
