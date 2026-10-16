import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel, SectionTitle } from "@/components/portal/bits";
import { Button } from "@/components/ui/button";
import { parseBase, type ErroLinha } from "@/lib/base-oficial";
import { importarBase } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/produtividade")({ component: Importar });

type Prev = { arquivo: string; conteudo: string; validas: number; erros: ErroLinha[]; periodo: string };
type Res = { inseridos: number; atualizados: number; inalterados: number; invalidos: number; erros: ErroLinha[]; novosColaboradores: number };

function Importar() {
  const qc = useQueryClient();
  const fn = useServerFn(importarBase);
  const [prev, setPrev] = useState<Prev | null>(null);
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);
  const hist = useQuery({
    queryKey: ["importacoes"],
    queryFn: async () => (await supabase.from("importacoes").select("*").order("created_at", { ascending: false }).limit(10)).data ?? [],
  });

  const onFile = async (f?: File) => {
    if (!f) return;
    const conteudo = await f.text();
    const { linhas, erros } = parseBase(conteudo);
    const datas = linhas.map((l) => l.data).sort();
    setRes(null);
    setPrev({ arquivo: f.name, conteudo, validas: linhas.length, erros, periodo: datas.length ? `${datas[0]} a ${datas[datas.length - 1]}` : "—" });
  };

  const importar = async () => {
    if (!prev) return;
    setBusy(true);
    try {
      const r = await fn({ data: { arquivo: prev.arquivo, conteudo: prev.conteudo } });
      setRes(r);
      toast.success("Base importada.");
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <>
      <h1 className="pt-5 text-xl font-semibold tracking-tight lg:text-2xl">Importar base oficial</h1>
      <Panel className="mt-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Envie o CSV oficial (separado por “;”, 24 colunas). Cada registro é identificado por colaborador + data: reenviar o mesmo arquivo não duplica nada, e correções atualizam o registro existente.
        </p>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-sm hover:bg-accent">
          <Upload className="size-4" /> {prev ? prev.arquivo : "Escolher arquivo CSV"}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {prev && (
          <div className="space-y-2 text-sm">
            <div className="font-mono text-xs">{prev.validas} linhas válidas · {prev.erros.length} inválidas · período {prev.periodo}</div>
            <Button onClick={importar} disabled={busy || !prev.validas}>{busy && <Loader2 className="size-4 animate-spin" />} Importar</Button>
          </div>
        )}
        {res && (
          <div className="rounded-xl bg-accent p-3 font-mono text-xs text-accent-foreground">
            {res.inseridos} novos · {res.atualizados} atualizados · {res.inalterados} sem alteração · {res.invalidos} inválidos · {res.novosColaboradores} colaboradores novos
          </div>
        )}
        {!!(res?.erros ?? prev?.erros)?.length && (
          <div className="max-h-60 overflow-auto rounded-xl border p-3 font-mono text-[11px]">
            {(res?.erros ?? prev!.erros).map((e) => <div key={e.linha}>Linha {e.linha}: {e.erro}</div>)}
          </div>
        )}
      </Panel>

      <SectionTitle>Últimas importações</SectionTitle>
      <div className="space-y-2">
        {(hist.data ?? []).map((h) => (
          <Panel key={h.id} className="font-mono text-[11px]">
            <div className="font-sans text-sm font-semibold">{h.arquivo}</div>
            {new Date(h.created_at).toLocaleString("pt-BR")} · {h.total_linhas} linhas · {h.inseridos} novos · {h.atualizados} atualizados · {h.inalterados} iguais · {h.invalidos} inválidos
          </Panel>
        ))}
        {!hist.data?.length && <Panel className="text-center text-sm text-muted-foreground">Nenhuma importação ainda.</Panel>}
      </div>
    </>
  );
}
