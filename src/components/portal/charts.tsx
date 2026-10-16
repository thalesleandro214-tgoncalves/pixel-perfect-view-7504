import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Prod } from "@/lib/data";
import { brl, dm, dmy, num } from "@/lib/format";

const axis = { fontSize: 10, fontFamily: "JetBrains Mono", fill: "var(--muted-foreground)" };

function DayDetail({ r }: { r: Prod }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-accent p-3 text-accent-foreground sm:grid-cols-6">
      {[
        ["Data", dmy(r.data)],
        ["Operação", r.duracao_operacao ?? "—"],
        ["Caixas", num(r.caixas_produzidas)],
        ["Paletes", num(Number(r.paletes_total))],
        ["CX/H", `${Number(r.caixas_por_hora)}`],
        ["Pagamento", brl(Number(r.pagamento_diario))],
      ].map(([k, v]) => (
        <div key={k}>
          <div className="font-mono text-[9px] uppercase tracking-[0.15em] opacity-70">{k}</div>
          <div className="text-sm font-semibold">{v}</div>
        </div>
      ))}
    </div>
  );
}

export function ProdLineChart({ rows, height = 180, interactive = true }: { rows: Prod[]; height?: number; interactive?: boolean }) {
  const [sel, setSel] = useState<Prod | null>(null);
  const data = rows.map((r) => ({ d: dm(r.data), v: Number(r.caixas_por_hora) }));
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          onClick={(e) => {
            const i = e?.activeTooltipIndex;
            if (interactive && typeof i === "number") setSel(rows[i]);
          }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="d" tick={axis} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={axis} tickLine={false} axisLine={false} domain={["dataMin - 8", "dataMax + 8"]} />
          <Tooltip
            cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }}
            contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
            formatter={(v: number) => [`${v} cx/h`, "Produtividade"]}
          />
          <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
      {interactive && (sel ? <DayDetail r={sel} /> : <p className="mt-2 font-mono text-[10px] text-foreground/45">Toque em um dia para ver detalhes</p>)}
    </div>
  );
}

export function ValueAreaChart({ data, height = 180 }: { data: { d: string; v: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="valFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="d" tick={axis} tickLine={false} axisLine={false} minTickGap={16} />
        <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${Math.round(v)}`} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: number) => [brl(v), "Valor"]} />
        <Area type="monotone" dataKey="v" stroke="var(--primary-deep)" strokeWidth={2} fill="url(#valFill)" activeDot={{ r: 6 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
