import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/portal/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfig } from "@/lib/data";

export const Route = createFileRoute("/admin/config")({ component: Config });

const fields = [
  ["meta_caixas_hora", "Meta de caixas/hora", "Referência para acima/dentro/abaixo da meta"],
  ["tolerancia_meta", "Tolerância da meta (cx/h)", "Faixa considerada 'dentro da meta' (± este valor)"],
  ["valor_por_caixa", "Valor por caixa (R$)", "Valor gerado = caixas × valor por caixa"],
  ["bonus_percentual_acima_meta", "Bônus acima da meta (%)", "Acréscimo no valor do dia quando cx/h ≥ meta"],
] as const;

function Config() {
  const cfg = useConfig().data;
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cfg) setForm(Object.fromEntries(fields.map(([k]) => [k, String(cfg[k])])));
  }, [cfg]);

  const save = async () => {
    const vals = Object.fromEntries(fields.map(([k]) => [k, Number(String(form[k]).replace(",", "."))]));
    if (Object.values(vals).some((v) => Number.isNaN(v) || v < 0)) return toast.error("Valores inválidos.");
    setBusy(true);
    const { error } = await supabase.from("configuracoes").update({ ...vals, updated_at: new Date().toISOString() }).eq("id", 1);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas. Novos lançamentos usarão estes parâmetros.");
    qc.invalidateQueries({ queryKey: ["config"] });
  };

  const recalc = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("recalcular_produtividade");
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${data} registros recalculados.`);
    qc.invalidateQueries();
  };

  return (
    <>
      <h1 className="pt-5 text-xl font-semibold tracking-tight lg:text-2xl">Parâmetros de cálculo</h1>
      <Panel className="mt-4 max-w-xl space-y-4">
        {fields.map(([k, l, h]) => (
          <div key={k} className="space-y-1.5">
            <Label>{l}</Label>
            <Input inputMode="decimal" value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="font-mono" />
            <p className="text-xs text-muted-foreground">{h}</p>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={save} disabled={busy}>Salvar</Button>
          <Button variant="outline" onClick={recalc} disabled={busy}>Recalcular todos os registros</Button>
        </div>
        <p className="text-xs text-muted-foreground">Caixas/hora = caixas produzidas ÷ horas trabalhadas (automático).</p>
      </Panel>
    </>
  );
}
