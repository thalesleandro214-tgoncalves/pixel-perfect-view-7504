import { createFileRoute, Link } from "@tanstack/react-router";
import { DemoBadge, Empty, Money, Panel, SectionTitle, StatCard, StatusPill } from "@/components/portal/bits";
import { ProdLineChart } from "@/components/portal/charts";
import { goalStatus, useMyRank } from "@/lib/data";
import { brl, currentMonth, dm, monthLabel, monthRange, num, todayIso } from "@/lib/format";
import { useMyMonth } from "@/lib/use-my-month";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const ym = currentMonth();
  const { me, cfg, rows, sum, loading, noProfile } = useMyMonth(ym);
  const [a, b] = monthRange(ym);
  const rank = useMyRank(a, b, !!me);

  if (loading) return <div className="pt-10 text-center text-sm text-muted-foreground">Carregando…</div>;
  if (noProfile) return <Empty>Seu cadastro ainda não foi vinculado. Procure seu gestor.</Empty>;

  const today = rows.find((r) => r.data === todayIso()) ?? null;
  const last = rows[rows.length - 1];
  const hero = today ?? last;
  const meta = Number(cfg?.meta_caixas_hora ?? 0);
  const cxh = hero ? Number(hero.caixas_por_hora) : 0;
  const pct = meta ? Math.round((cxh / meta) * 100) : 0;
  const bars = Math.min(10, Math.round(pct / 10));
  const firstName = me!.nome.split(" ")[0];

  return (
    <>
      <div className="flex justify-center pt-4 lg:justify-start"><DemoBadge /></div>

      <div className="pt-5">
        <div className="text-[13px] font-medium text-foreground/55">Olá, {firstName}!</div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[18px] font-semibold tracking-tight lg:text-2xl">{today ? "Sua produtividade de hoje" : "Seu último dia trabalhado"}</div>
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/45">{monthLabel(ym)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_2fr]">
        <div className="glass shadow-card rise relative overflow-hidden p-5">
          <div className="stripe-top absolute inset-x-0 top-0 h-1" />
          <div className="flex items-start justify-between">
            <div>
              <div className="label-mono">Caixas / hora · {hero ? (today ? "hoje" : dm(hero.data)) : "—"}</div>
              <div className="mt-1 flex items-end gap-1">
                <span className="num-display text-[72px]">{hero ? Math.round(cxh) : "—"}</span>
                <span className="mb-2 font-mono text-[11px] text-foreground/45">cx/h</span>
              </div>
            </div>
            <div className="text-right">
              <div className="label-mono">Meta</div>
              <div className="font-mono text-[18px] font-medium">{meta}</div>
            </div>
          </div>
          {hero && <div className="mt-3"><StatusPill status={goalStatus(cxh, cfg)} /></div>}
          <div className="mt-3 font-mono text-[10px] text-foreground/40">
            <span className="text-primary">{"▓".repeat(bars)}</span>{"░".repeat(10 - bars)} {Math.round(cxh)}/{meta} · {pct}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard delay={60} label="Caixas hoje" value={today ? num(today.caixas_produzidas) : "—"} sub={today ? `${Number(today.horas_trabalhadas)}h trabalhadas` : "sem registro hoje"} />
          <StatCard delay={120} label="Valor hoje" value={today ? <Money v={Number(today.valor_gerado)} /> : "—"} sub="gerado no dia" />
          <StatCard delay={180} label="Acumulado mês" value={<Money v={sum.valor} />} sub={`${sum.dias} dias trabalhados`} />
          <StatCard delay={240} label="Média mês" value={<>{Math.round(sum.cxh)}<span className="align-top text-[0.5em]"> cx/h</span></>} sub={`meta ${meta} cx/h`} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
        <Panel delay={300}>
          <div className="flex items-center justify-between">
            <div className="label-mono text-foreground/60">Ritmo diário · {monthLabel(ym)}</div>
            <div className="font-mono text-[10px] text-foreground/40">{Math.round(sum.min)}–{Math.round(sum.max)} cx/h</div>
          </div>
          {rows.length ? <ProdLineChart rows={rows} meta={meta} height={150} /> : <p className="py-8 text-center text-sm text-muted-foreground">Sem registros neste mês ainda.</p>}
        </Panel>

        <Panel delay={360} className="flex items-center gap-3">
          <span className="num-display text-[40px] text-primary-deep">#{rank.data?.posicao ?? "–"}</span>
          <div>
            <div className="label-mono">Ranking do mês</div>
            <div className="text-[13px] font-medium">{rank.data ? `${rank.data.posicao}º de ${rank.data.total} auxiliares` : "Sem posição ainda"}</div>
          </div>
        </Panel>
      </div>

      <SectionTitle right={<Link to="/app/historico" className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">ver tudo</Link>}>Histórico</SectionTitle>
      <div className="space-y-2.5">
        {[...rows].reverse().slice(0, 3).map((r, i) => {
          const st = goalStatus(Number(r.caixas_por_hora), cfg);
          return (
            <div key={r.id} className="glass rise flex items-center justify-between p-3.5" style={{ animationDelay: `${420 + i * 50}ms` }}>
              <div>
                <div className="text-[13px] font-semibold">{dm(r.data)} · {Number(r.horas_trabalhadas)}h</div>
                <div className="font-mono text-[10px] text-foreground/40">{num(r.caixas_produzidas)} caixas · {brl(Number(r.valor_gerado))}</div>
              </div>
              <div className={`font-mono text-[12px] font-medium ${st === "acima" ? "text-good" : st === "abaixo" ? "text-bad" : "text-foreground/70"}`}>
                {Number(r.caixas_por_hora)} cx/h
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
