import { createFileRoute, Link } from "@tanstack/react-router";
import { Empty, Money, Panel, SectionTitle, StatCard } from "@/components/portal/bits";
import { ProdLineChart } from "@/components/portal/charts";
import { useMyRank } from "@/lib/data";
import { brl, currentMonth, dm, monthLabel, monthRange, num, todayIso } from "@/lib/format";
import { useMyMonth } from "@/lib/use-my-month";

export const Route = createFileRoute("/app/")({ component: Home });

function Home() {
  const ym = currentMonth();
  const { me, rows, sum, loading, noProfile } = useMyMonth(ym);
  const [a, b] = monthRange(ym);
  const rank = useMyRank(a, b, !!me);

  if (loading) return <div className="pt-10 text-center text-sm text-muted-foreground">Carregando…</div>;
  if (noProfile) return <Empty>Seu cadastro ainda não foi vinculado. Procure seu gestor.</Empty>;

  const today = rows.find((r) => r.data === todayIso()) ?? null;
  const hero = today ?? rows[rows.length - 1];
  const firstName = me!.nome.split(" ")[0];

  return (
    <>
      <div className="pt-5">
        <div className="text-[13px] font-medium text-foreground/55">Olá, {firstName}! · {me!.unidade ?? "—"}</div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-[18px] font-semibold tracking-tight lg:text-2xl">{today ? "Sua produtividade de hoje" : "Seu último dia registrado"}</div>
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/45">{monthLabel(ym)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_2fr]">
        <div className="glass shadow-card rise relative overflow-hidden p-5">
          <div className="stripe-top absolute inset-x-0 top-0 h-1" />
          <div className="label-mono">CX/H · {hero ? dm(hero.data) : "—"}</div>
          <div className="mt-1 flex items-end gap-1">
            <span className="num-display text-[72px]">{hero ? Number(hero.caixas_por_hora).toFixed(0) : "—"}</span>
            <span className="mb-2 font-mono text-[11px] text-foreground/45">cx/h</span>
          </div>
          {hero && <div className="font-mono text-[10px] text-foreground/45">Operação {hero.duracao_operacao} · {hero.inicio_montagem}–{hero.termino_montagem}</div>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard delay={60} label="Caixas" value={hero ? num(hero.caixas_produzidas) : "—"} sub={hero ? `${num(Number(hero.paletes_total))} paletes` : "sem registro"} />
          <StatCard delay={120} label="Gratificação do dia" value={hero ? <Money v={Number(hero.pagamento_diario)} /> : "—"} sub="pagamento diário" />
          <StatCard delay={180} label="Acumulado no período" value={<Money v={sum.acumulado} />} sub={`${sum.dias} dias registrados`} />
          <StatCard delay={240} label="Média do período" value={<>{sum.mediaOficial.toFixed(1)}<span className="align-top text-[0.5em]"> cx/h</span></>} sub="CX/HH média oficial" />
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
        <Panel delay={300}>
          <div className="flex items-center justify-between">
            <div className="label-mono text-foreground/60">Ritmo diário · {monthLabel(ym)}</div>
            <div className="font-mono text-[10px] text-foreground/40">{Math.round(sum.min)}–{Math.round(sum.max)} cx/h</div>
          </div>
          {rows.length ? <ProdLineChart rows={rows} height={150} /> : <p className="py-8 text-center text-sm text-muted-foreground">Sem registros neste mês.</p>}
        </Panel>
        <Panel delay={360} className="flex items-center gap-3">
          <span className="num-display text-[40px] text-primary-deep">#{rank.data?.posicao ?? "–"}</span>
          <div>
            <div className="label-mono">Ranking CX/H do mês</div>
            <div className="text-[13px] font-medium">{rank.data ? `${rank.data.posicao}º de ${rank.data.total}` : "Sem posição ainda"}</div>
          </div>
        </Panel>
      </div>

      <SectionTitle right={<Link to="/app/historico" className="font-mono text-[10px] uppercase tracking-[0.15em] text-primary">ver tudo</Link>}>Histórico</SectionTitle>
      <div className="space-y-2.5">
        {[...rows].reverse().slice(0, 3).map((r, i) => (
          <div key={r.id} className="glass rise flex items-center justify-between p-3.5" style={{ animationDelay: `${420 + i * 50}ms` }}>
            <div>
              <div className="text-[13px] font-semibold">{dm(r.data)} · {r.duracao_operacao}</div>
              <div className="font-mono text-[10px] text-foreground/40">{num(r.caixas_produzidas)} caixas · {num(Number(r.paletes_total))} paletes · {brl(Number(r.pagamento_diario))}</div>
            </div>
            <div className="font-mono text-[12px] font-medium">{Number(r.caixas_por_hora)} cx/h</div>
          </div>
        ))}
      </div>
    </>
  );
}
