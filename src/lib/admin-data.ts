import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Colab, Prod } from "./data";

export function useColabs() {
  return useQuery({
    queryKey: ["colabs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("colaboradores").select("*").order("nome");
      if (error) throw error;
      return data as Colab[];
    },
  });
}

export function useProdRange(inicio: string, fim: string) {
  return useQuery({
    queryKey: ["prod-range", inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtividade")
        .select("*")
        .gte("data", inicio)
        .lte("data", fim)
        .order("data")
        .limit(10000);
      if (error) throw error;
      return data as Prod[];
    },
  });
}

export type RankRow = { colab: Colab; caixas: number; horas: number; valor: number; cxh: number; dias: number };

export function rankBy(rows: Prod[], colabs: Colab[]): RankRow[] {
  const map = new Map<string, RankRow>();
  for (const r of rows) {
    const colab = colabs.find((c) => c.id === r.colaborador_id);
    if (!colab) continue;
    const e = map.get(colab.id) ?? { colab, caixas: 0, horas: 0, valor: 0, cxh: 0, dias: 0 };
    e.caixas += r.caixas_produzidas;
    e.horas += Number(r.horas_trabalhadas);
    e.valor += Number(r.valor_gerado);
    e.dias += 1;
    map.set(colab.id, e);
  }
  return [...map.values()].map((e) => ({ ...e, cxh: e.horas ? e.caixas / e.horas : 0 })).sort((a, b) => b.cxh - a.cxh);
}

export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
