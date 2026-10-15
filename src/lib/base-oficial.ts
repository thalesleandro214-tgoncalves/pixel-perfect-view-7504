/** Parser/validator for the official productivity base (CSV ";" with 24 columns). Shared by client preview and server import. */

export const COLUNAS = [
  "NOME", "UNIDADE", "DATA", "LP Duplo", "Mistos", "Total Mistos + LP DUPLO", "Valor Mistos", "Total Mistos",
  "Total Gav.", "Valor Gaveta", "Total Gaveta", "Total Container", "Valor Container", "Total Container (R$)",
  "Caixas", "Início primeira montagem", "Término da última montagem", "Duração da operação (S/ refeição)",
  "Minutos", "CX/M", "CX/H", "TOTAL PAGAMENTO DIÁRIO", "ACUMULADO NO PERÍODO", "CX/HH MÉDIA DO PERÍODO",
] as const;

export type LinhaBase = {
  linha: number;
  nome_base: string;
  nome: string;
  matricula: string | null;
  unidade: string;
  data: string;
  lp_duplo: number; mistos: number; total_mistos_lp: number; valor_mistos: number; total_mistos_rs: number;
  total_gav: number; valor_gaveta: number; total_gaveta_rs: number;
  total_container: number; valor_container: number; total_container_rs: number;
  caixas_produzidas: number;
  inicio_montagem: string; termino_montagem: string; duracao_operacao: string;
  minutos: number; cx_m: number; caixas_por_hora: number;
  pagamento_diario: number; acumulado_periodo: number; cxh_media_periodo: number;
  paletes_total: number;
};
export type ErroLinha = { linha: number; erro: string };

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

function num(v: string): number {
  let s = (v ?? "").trim().replace(/^R\$\s*/i, "").replace(/\s/g, "");
  if (s === "" || s === "-") return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`valor numérico inválido "${v}"`);
  return n;
}
function data(v: string): string {
  const m = (v ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) throw new Error(`data inválida "${v}" (use DD/MM/AAAA)`);
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) throw new Error(`data inexistente "${v}"`);
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function hora(v: string, campo: string): string {
  const s = (v ?? "").trim();
  if (!/^\d{1,3}:\d{2}(:\d{2})?$/.test(s)) throw new Error(`${campo} inválido "${v}"`);
  return s;
}

export function parseBase(text: string): { linhas: LinhaBase[]; erros: ErroLinha[] } {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (!rows.length) return { linhas: [], erros: [{ linha: 0, erro: "Arquivo vazio." }] };
  const head = rows[0].split(";").map((h) => norm(h));
  const idx = COLUNAS.map((c) => head.indexOf(norm(c)));
  const faltando = COLUNAS.filter((_, i) => idx[i] < 0);
  if (faltando.length) return { linhas: [], erros: [{ linha: 1, erro: `Colunas ausentes: ${faltando.join(", ")}` }] };

  const linhas: LinhaBase[] = [];
  const erros: ErroLinha[] = [];
  const vistos = new Map<string, number>();
  rows.slice(1).forEach((raw, i) => {
    const linha = i + 2;
    const c = raw.split(";");
    const g = (k: number) => (c[idx[k]] ?? "").trim();
    try {
      const nome_base = g(0).replace(/\s+/g, " ");
      if (!nome_base) throw new Error("NOME vazio");
      const m = nome_base.match(/^(\d+)\s*:\s*(.+)$/);
      const unidade = g(1);
      if (!unidade) throw new Error("UNIDADE vazia");
      const caixas = num(g(14));
      if (!Number.isInteger(caixas) || caixas < 0) throw new Error(`Caixas inválido "${g(14)}"`);
      const l: LinhaBase = {
        linha, nome_base, nome: (m ? m[2] : nome_base).replace(/\.$/, "").trim(), matricula: m ? m[1] : null,
        unidade, data: data(g(2)),
        lp_duplo: num(g(3)), mistos: num(g(4)), total_mistos_lp: num(g(5)), valor_mistos: num(g(6)), total_mistos_rs: num(g(7)),
        total_gav: num(g(8)), valor_gaveta: num(g(9)), total_gaveta_rs: num(g(10)),
        total_container: num(g(11)), valor_container: num(g(12)), total_container_rs: num(g(13)),
        caixas_produzidas: caixas,
        inicio_montagem: hora(g(15), "Início"), termino_montagem: hora(g(16), "Término"), duracao_operacao: hora(g(17), "Duração"),
        minutos: num(g(18)), cx_m: num(g(19)), caixas_por_hora: num(g(20)),
        pagamento_diario: num(g(21)), acumulado_periodo: num(g(22)), cxh_media_periodo: num(g(23)),
        paletes_total: 0,
      };
      if (l.minutos <= 0) throw new Error("Minutos deve ser maior que zero");
      l.paletes_total = l.total_mistos_lp + l.total_gav + l.total_container;
      const key = `${nome_base}|${l.data}`;
      if (vistos.has(key)) throw new Error(`duplicada (mesmo colaborador e data da linha ${vistos.get(key)})`);
      vistos.set(key, linha);
      linhas.push(l);
    } catch (e) {
      erros.push({ linha, erro: (e as Error).message });
    }
  });
  return { linhas, erros };
}
