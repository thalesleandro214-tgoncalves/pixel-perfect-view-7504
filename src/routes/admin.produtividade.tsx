import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SectionTitle } from "@/components/portal/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useColabs, useProdRange } from "@/lib/admin-data";
import { useConfig } from "@/lib/data";
import { brl, dmy, isoDate, num, todayIso } from "@/lib/format";
import { isValidCpf, onlyDigits } from "@/lib/cpf";

export const Route = createFileRoute("/admin/produtividade")({ component: Produtividade });

type Parsed = { linha: number; data: string; cpf: string; nome: string; horas: number; caixas: number; colabId?: string; erro?: string };

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

function parseDate(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return isoDate(v);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    return d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : null;
  }
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
const toNum = (v: unknown) => (typeof v === "number" ? v : Number(String(v ?? "").replace(/\./g, "").replace(",", ".")));

function Produtividade() {
  const colabs = useColabs().data ?? [];
  const cfg = useConfig().data;
  const qc = useQueryClient();
  const recent = useProdRange(isoDate(new Date(Date.now() - 6 * 864e5)), todayIso()).data ?? [];
  const [f, setF] = useState({ colab: "", data: todayIso(), horas: "8", caixas: "" });
  const [preview, setPreview] = useState<Parsed[] | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries();

  const lancar = async () => {
    const horas = toNum(f.horas);
    const caixas = Math.round(toNum(f.caixas));
    if (!f.colab) return toast.error("Escolha o auxiliar.");
    if (!(horas > 0 && horas <= 24) || !(caixas >= 0)) return toast.error("Horas/caixas inválidas.");
    const { error } = await supabase.from("produtividade").upsert(
      { colaborador_id: f.colab, data: f.data, horas_trabalhadas: horas, caixas_produzidas: caixas },
      { onConflict: "colaborador_id,data" },
    );
    if (error) return toast.error(error.message);
    toast.success(`Lançado: ${(caixas / horas).toFixed(1)} cx/h`);
    setF({ ...f, caixas: "" });
    refresh();
  };

  const onFile = async (file: File) => {
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const rows: Parsed[] = raw.slice(0, 5000).map((r, i) => {
      const g = (k: string) => Object.entries(r).find(([h]) => norm(h) === k)?.[1];
      const cpf = onlyDigits(String(g("cpf") ?? "")).padStart(11, "0");
      const data = parseDate(g("data"));
      const horas = toNum(g("horastrabalhadas") ?? g("horas"));
      const caixas = toNum(g("caixasproduzidas") ?? g("caixas"));
      const colab = colabs.find((c) => c.cpf === cpf);
      let erro: string | undefined;
      if (!data) erro = "Data inválida";
      else if (!isValidCpf(cpf)) erro = "CPF inválido";
      else if (!colab) erro = "CPF não cadastrado";
      else if (!(horas > 0 && horas <= 24)) erro = "Horas inválidas";
      else if (!(caixas >= 0)) erro = "Caixas inválidas";
      return { linha: i + 2, data: data ?? "", cpf, nome: colab?.nome ?? String(g("nome") ?? ""), horas, caixas: Math.round(caixas), colabId: colab?.id, erro };
    });
    setPreview(rows);
  };

  const confirmar = async () => {
    const ok = preview!.filter((r) => !r.erro);
    setBusy(true);
    const { error } = await supabase.from("produtividade").upsert(
      ok.map((r) => ({ colaborador_id: r.colabId!, data: r.data, horas_trabalhadas: r.horas, caixas_produzidas: r.caixas })),
      { onConflict: "colaborador_id,data" },
    );
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${ok.length} registros importados.`);
    setPreview(null);
    refresh();
  };

  const modelo = () => {
    const ws = XLSX.utils.aoa_to_sheet([["Data", "CPF", "Nome", "Horas Trabalhadas", "Caixas Produzidas"], ["01/10/2026", "52998224725", "Carlos Silva", 8, 736]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtividade");
    XLSX.writeFile(wb, "modelo_produtividade.xlsx");
  };

  const remover = async (id: string) => {
    const { error } = await supabase.from("produtividade").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const valid = preview?.filter((r) => !r.erro).length ?? 0;
  const prevCxh = toNum(f.horas) > 0 && f.caixas ? toNum(f.caixas) / toNum(f.horas) : 0;

  return (
    <>
      <h1 className="pt-5 text-xl font-semibold tracking-tight lg:text-2xl">Lançar produtividade</h1>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Panel className="space-y-3">
          <div className="label-mono">Lançamento manual</div>
          <Select value={f.colab} onValueChange={(v) => setF({ ...f, colab: v })}>
            <SelectTrigger><SelectValue placeholder="Auxiliar" /></SelectTrigger>
            <SelectContent>{colabs.filter((c) => c.status === "ativo").map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label>Data</Label><Input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
            <div className="space-y-1"><Label>Horas</Label><Input inputMode="decimal" value={f.horas} onChange={(e) => setF({ ...f, horas: e.target.value })} /></div>
            <div className="space-y-1"><Label>Caixas</Label><Input inputMode="numeric" value={f.caixas} onChange={(e) => setF({ ...f, caixas: e.target.value })} /></div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-accent p-3 text-accent-foreground">
            <span className="font-mono text-xs">{prevCxh.toFixed(1)} cx/h</span>
            <span className="font-mono text-xs">≈ {brl(toNum(f.caixas || "0") * Number(cfg?.valor_por_caixa ?? 0))}</span>
          </div>
          <Button onClick={lancar} className="w-full">Salvar lançamento</Button>
        </Panel>

        <Panel className="space-y-3">
          <div className="label-mono">Importar Excel / CSV</div>
          <p className="text-sm text-muted-foreground">Colunas: Data, CPF, Nome, Horas Trabalhadas, Caixas Produzidas. Caixas/hora e valor são calculados automaticamente.</p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/30 p-6 text-center hover:bg-accent">
            <Upload className="size-6 text-primary" />
            <span className="text-sm font-medium">Escolher arquivo .xlsx ou .csv</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </label>
          <Button variant="outline" onClick={modelo} className="w-full">Baixar planilha modelo</Button>
        </Panel>
      </div>

      {preview && (
        <>
          <SectionTitle right={<span className="font-mono text-[10px]">{valid} válidas · {preview.length - valid} com erro</span>}>Prévia da importação</SectionTitle>
          <Panel className="max-h-96 overflow-auto p-0">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted"><tr className="text-left">{["Linha", "Data", "CPF", "Nome", "Horas", "Caixas", "Status"].map((h) => <th key={h} className="label-mono px-3 py-2 font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.linha} className="border-t">
                    <td className="px-3 py-2 font-mono">{r.linha}</td>
                    <td className="px-3 py-2">{r.data && dmy(r.data)}</td>
                    <td className="px-3 py-2 font-mono">{r.cpf}</td>
                    <td className="px-3 py-2">{r.nome}</td>
                    <td className="px-3 py-2 font-mono">{r.horas}</td>
                    <td className="px-3 py-2 font-mono">{r.caixas}</td>
                    <td className={`px-3 py-2 font-medium ${r.erro ? "text-bad" : "text-good"}`}>{r.erro ?? "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <div className="mt-3 flex gap-2">
            <Button onClick={confirmar} disabled={!valid || busy}>Confirmar importação ({valid})</Button>
            <Button variant="outline" onClick={() => setPreview(null)}>Cancelar</Button>
          </div>
        </>
      )}

      <SectionTitle>Últimos 7 dias</SectionTitle>
      <div className="space-y-2">
        {[...recent].reverse().slice(0, 40).map((r) => (
          <Panel key={r.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{colabs.find((c) => c.id === r.colaborador_id)?.nome}</div>
              <div className="font-mono text-[10px] text-foreground/50">{dmy(r.data)} · {Number(r.horas_trabalhadas)}h · {num(r.caixas_produzidas)} cx · {brl(Number(r.valor_gerado))}</div>
            </div>
            <span className="font-mono text-sm font-semibold">{Number(r.caixas_por_hora)}</span>
            <Button size="icon" variant="ghost" onClick={() => remover(r.id)} aria-label="Excluir"><Trash2 className="size-4" /></Button>
          </Panel>
        ))}
      </div>
    </>
  );
}
