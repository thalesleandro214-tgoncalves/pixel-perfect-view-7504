import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { monthRange } from "./format";

export type Prod = Tables<"produtividade">;
export type Colab = Tables<"colaboradores">;

export function useMe(userId?: string) {
  return useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("colaboradores").select("*").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyProd(colabId: string | undefined, ym: string) {
  return useQuery({
    queryKey: ["myprod", colabId, ym],
    enabled: !!colabId,
    queryFn: async () => {
      const [a, b] = monthRange(ym);
      const { data, error } = await supabase
        .from("produtividade")
        .select("*")
        .eq("colaborador_id", colabId!)
        .gte("data", a)
        .lte("data", b)
        .order("data");
      if (error) throw error;
      return data;
    },
  });
}

export function useMyRank(inicio: string, fim: string, enabled = true) {
  return useQuery({
    queryKey: ["myrank", inicio, fim],
    enabled,
    queryFn: async () => {
      const { data } = await supabase.rpc("minha_posicao_ranking", { _inicio: inicio, _fim: fim });
      return data?.[0] ?? null;
    },
  });
}

/** Aggregates over official rows. Payment/accumulated/average come straight from the base (never recomputed with tariffs). */
export function summarize(rows: Prod[]) {
  const sorted = [...rows].sort((a, b) => a.data.localeCompare(b.data));
  const last = sorted[sorted.length - 1];
  const dias = rows.length;
  const caixas = rows.reduce((s, r) => s + r.caixas_produzidas, 0);
  const minutos = rows.reduce((s, r) => s + Number(r.minutos), 0);
  const paletes = rows.reduce((s, r) => s + Number(r.paletes_total), 0);
  const pagamentos = rows.reduce((s, r) => s + Number(r.pagamento_diario), 0);
  const vals = rows.map((r) => Number(r.caixas_por_hora));
  return {
    dias,
    caixas,
    paletes,
    horas: minutos / 60,
    /** soma dos pagamentos diários oficiais no filtro */
    pagamentos,
    /** ACUMULADO NO PERÍODO oficial da última data do filtro */
    acumulado: last ? Number(last.acumulado_periodo) : 0,
    /** CX/HH MÉDIA DO PERÍODO oficial da última data do filtro */
    mediaOficial: last ? Number(last.cxh_media_periodo) : 0,
    /** caixas ÷ horas no filtro (agregado) */
    cxh: minutos ? caixas / (minutos / 60) : 0,
    max: vals.length ? Math.max(...vals) : 0,
    min: vals.length ? Math.min(...vals) : 0,
  };
}
