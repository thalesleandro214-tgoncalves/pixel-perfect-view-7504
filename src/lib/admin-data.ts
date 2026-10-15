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
      const out: Prod[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("produtividade")
          .select("*")
          .gte("data", inicio)
          .lte("data", fim)
          .order("data")
          .order("id")
          .range(from, from + 999);
        if (error) throw error;
        out.push(...(data as Prod[]));
        if (data.length < 1000) break;
      }
      return out;
    },
  });
}

export type RankRow = { colab: Colab; caixas: number; minutos: number; paletes: number; pagamentos: number; acumulado: number; ultima: string; cxh: number; dias: number };

/** CX/H no período = caixas ÷ (minutos/60). Gratificação = ACUMULADO oficial da última data no período (sem somar acumulados). */
export function rankBy(rows: Prod[], colabs: Colab[], by: "cxh" | "acumulado" = "cxh"): RankRow[] {
  const cmap = new Map(colabs.map((c) => [c.id, c]));
  const map = new Map<string, RankRow>();
  for (const r of rows) {
    const colab = cmap.get(r.colaborador_id);
    if (!colab) continue;
    const e = map.get(colab.id) ?? { colab, caixas: 0, minutos: 0, paletes: 0, pagamentos: 0, acumulado: 0, ultima: "", cxh: 0, dias: 0 };
    e.caixas += r.caixas_produzidas;
    e.minutos += Number(r.minutos);
    e.paletes += Number(r.paletes_total);
    e.pagamentos += Number(r.pagamento_diario);
    if (r.data >= e.ultima) { e.ultima = r.data; e.acumulado = Number(r.acumulado_periodo); }
    e.dias += 1;
    map.set(colab.id, e);
  }
  return [...map.values()]
    .map((e) => ({ ...e, cxh: e.minutos ? e.caixas / (e.minutos / 60) : 0 }))
    .sort((a, b) => (by === "cxh" ? b.cxh - a.cxh : b.acumulado - a.acumulado));
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
