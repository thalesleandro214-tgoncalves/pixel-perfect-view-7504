import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { monthRange } from "./format";

export type Prod = Tables<"produtividade">;
export type Colab = Tables<"colaboradores">;
export type Config = Tables<"configuracoes">;

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

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

export function summarize(rows: Pick<Prod, "caixas_produzidas" | "horas_trabalhadas" | "caixas_por_hora" | "valor_gerado">[]) {
  const dias = rows.length;
  const caixas = rows.reduce((s, r) => s + r.caixas_produzidas, 0);
  const horas = rows.reduce((s, r) => s + Number(r.horas_trabalhadas), 0);
  const valor = rows.reduce((s, r) => s + Number(r.valor_gerado), 0);
  const cxh = horas ? caixas / horas : 0;
  const vals = rows.map((r) => Number(r.caixas_por_hora));
  return {
    dias,
    caixas,
    horas,
    valor,
    cxh,
    max: vals.length ? Math.max(...vals) : 0,
    min: vals.length ? Math.min(...vals) : 0,
    mediaDiaria: dias ? valor / dias : 0,
  };
}

export type Status = "acima" | "dentro" | "abaixo";
export function goalStatus(cxh: number, cfg?: Pick<Config, "meta_caixas_hora" | "tolerancia_meta"> | null): Status {
  if (!cfg) return "dentro";
  const meta = Number(cfg.meta_caixas_hora);
  const tol = Number(cfg.tolerancia_meta);
  if (cxh >= meta + tol) return "acima";
  if (cxh >= meta - tol) return "dentro";
  return "abaixo";
}
