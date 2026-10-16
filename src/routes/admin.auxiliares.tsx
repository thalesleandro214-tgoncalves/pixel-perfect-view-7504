import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Panel } from "@/components/portal/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useColabs } from "@/lib/admin-data";
import type { Colab } from "@/lib/data";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { setColaboradorPassword, setColaboradorStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/auxiliares")({ component: Auxiliares });

type Form = { id?: string; nome: string; cpf: string; matricula: string; funcao: string; equipe: string };
const blank: Form = { nome: "", cpf: "", matricula: "", funcao: "Auxiliar de Logística", equipe: "Expedição" };

function Auxiliares() {
  const colabs = useColabs().data ?? [];
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [pwFor, setPwFor] = useState<Colab | null>(null);
  const [pw, setPw] = useState("");
  const [q, setQ] = useState("");
  const pwFn = useServerFn(setColaboradorPassword);
  const stFn = useServerFn(setColaboradorStatus);

  const save = async () => {
    if (!form) return;
    if (form.nome.trim().length < 3) return toast.error("Informe o nome.");
    if (!isValidCpf(form.cpf)) return toast.error("CPF inválido.");
    const row = { nome: form.nome.trim(), cpf: onlyDigits(form.cpf), matricula: form.matricula || null, funcao: form.funcao, equipe: form.equipe };
    const { error } = form.id
      ? await supabase.from("colaboradores").update(row).eq("id", form.id)
      : await supabase.from("colaboradores").insert(row);
    if (error) return toast.error(error.code === "23505" ? "CPF já cadastrado." : error.message);
    toast.success("Salvo!");
    setForm(null);
    qc.invalidateQueries({ queryKey: ["colabs"] });
  };

  const savePw = async () => {
    if (!pwFor || pw.length < 6) return toast.error("Senha precisa de 6+ caracteres.");
    try {
      await pwFn({ data: { colaboradorId: pwFor.id, password: pw } });
      toast.success("Senha definida. O auxiliar já pode entrar.");
      setPwFor(null);
      setPw("");
      qc.invalidateQueries({ queryKey: ["colabs"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggle = async (c: Colab, on: boolean) => {
    try {
      await stFn({ data: { colaboradorId: c.id, status: on ? "ativo" : "inativo" } });
      qc.invalidateQueries({ queryKey: ["colabs"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const list = colabs.filter((c) => (c.nome + (c.cpf ?? "") + (c.unidade ?? "") + (c.matricula ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="flex items-center justify-between pt-5">
        <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">Auxiliares</h1>
        <Button onClick={() => setForm(blank)}><Plus className="size-4" /> Novo</Button>
      </div>
      <Input className="mt-4" placeholder="Buscar por nome, CPF ou equipe" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-3 space-y-2.5">
        {list.map((c) => (
          <Panel key={c.id} className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent font-semibold text-accent-foreground">{c.nome[0]}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{c.nome} </div>
              <div className="truncate font-mono text-[10px] text-foreground/50">{c.cpf ? formatCpf(c.cpf) : "sem CPF"} · {c.unidade ?? c.equipe} · {c.user_id ? "com acesso" : "sem senha"}</div>
            </div>
            <Switch checked={c.status === "ativo"} onCheckedChange={(v) => toggle(c, v)} aria-label="Ativo" />
            <Button size="icon" variant="ghost" onClick={() => setPwFor(c)} aria-label="Senha"><KeyRound className="size-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => setForm({ id: c.id, nome: c.nome, cpf: c.cpf ? formatCpf(c.cpf) : "", matricula: c.matricula ?? "", funcao: c.funcao, equipe: c.equipe })} aria-label="Editar"><Pencil className="size-4" /></Button>
          </Panel>
        ))}
      </div>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{form?.id ? "Editar auxiliar" : "Novo auxiliar"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              {([["nome", "Nome"], ["cpf", "CPF"], ["matricula", "Matrícula"], ["funcao", "Função"], ["equipe", "Equipe"]] as const).map(([k, l]) => (
                <div key={k} className="space-y-1.5">
                  <Label>{l}</Label>
                  <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: k === "cpf" ? formatCpf(e.target.value) : e.target.value })} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwFor} onOpenChange={(o) => !o && setPwFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar / redefinir senha · {pwFor?.nome}</DialogTitle></DialogHeader>
          <Input type="text" placeholder="Nova senha (mín. 6)" value={pw} onChange={(e) => setPw(e.target.value)} />
          <DialogFooter><Button onClick={savePw}>Definir senha</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
